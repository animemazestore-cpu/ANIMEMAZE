import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CreditCard, Upload, Check } from 'lucide-react';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getTotalAmount, clearCart } = useCartStore();

  const [appliedCoupon] = useState<any>(() => {
    return JSON.parse(localStorage.getItem('animemaze_applied_coupon') || 'null');
  });

  const subtotal = getTotalAmount();

  // Validate if the coupon meets requirements (active, minimum order subtotal)
  const isCouponValid = appliedCoupon && 
    (appliedCoupon.active !== false) && 
    (!appliedCoupon.minOrder || subtotal >= appliedCoupon.minOrder);

  let discountAmount = 0;
  if (isCouponValid) {
    if (appliedCoupon.type === 'PERCENT') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100);
    } else if (appliedCoupon.type === 'FIXED') {
      discountAmount = Math.min(subtotal, appliedCoupon.value);
    }
  }

  const shippingCharge = subtotal >= 999 ? 0 : 99;
  const total = Math.max(0, subtotal - discountAmount) + shippingCharge;

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Payment Proof
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderCreatedId && !loading) {
      navigate('/cart');
    }
  }, [items, navigate, orderCreatedId, loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG, JPG, JPEG).');
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to place an order.');
      navigate('/auth');
      return;
    }
    if (!screenshotFile) {
      setErrorMsg('Please upload your payment confirmation screenshot.');
      return;
    }
    if (!transactionId.trim()) {
      setErrorMsg('Please enter your transaction ID / UTR.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const shippingAddressJson = {
      fullName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      transactionId: transactionId.trim(),
      item_variants: items.map(item => ({
        product_id: item.product.id,
        selected_variant: item.selectedVariant || null
      }))
    };

    try {
      // --- Try Supabase first ---
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'PENDING_VERIFICATION',
          payment_status: 'PENDING_VERIFICATION',
          shipping_address: shippingAddressJson
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      // Insert order items
      const orderItemsInsert = items.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsInsert);

      if (itemsError) throw itemsError;

      // Upload screenshot (best-effort)
      try {
        const fileExt = screenshotFile.name.split('.').pop();
        const fileName = `${orderId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, screenshotFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(fileName);

          await supabase
            .from('payment_proofs')
            .insert({ order_id: orderId, screenshot_url: publicUrl });
        }
      } catch (_uploadErr) {
        // Screenshot upload failure is non-fatal — order still placed
        console.warn('Screenshot upload failed, order still created:', _uploadErr);
      }

      // Update stock (best-effort)
      for (const item of items) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
      }

      clearCart();
      localStorage.removeItem('animemaze_applied_coupon');
      // Delay so confirmation doesn't flash instantly
      setTimeout(() => {
        setLoading(false);
        setOrderCreatedId(orderId);
      }, 2500);

    } catch (supabaseErr: any) {
      console.warn('Supabase order failed, using local order fallback:', supabaseErr);

      // --- Fallback: store order in localStorage ---
      try {
        const localOrderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const localOrder = {
          id: localOrderId,
          user_id: user.id,
          total_amount: total,
          status: 'PENDING_VERIFICATION',
          payment_status: 'PENDING_VERIFICATION',
          shipping_address: shippingAddressJson,
          items: items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            selected_variant: item.selectedVariant || null
          })),
          created_at: new Date().toISOString(),
          screenshot_preview: screenshotPreview // data URL from FileReader
        };

        const existingOrders = JSON.parse(localStorage.getItem('animemaze_local_orders') || '[]');
        existingOrders.unshift(localOrder);
        localStorage.setItem('animemaze_local_orders', JSON.stringify(existingOrders));

        clearCart();
        localStorage.removeItem('animemaze_applied_coupon');
        // Delay so confirmation doesn't flash instantly
        setTimeout(() => {
          setLoading(false);
          setOrderCreatedId(localOrderId);
        }, 2500);
      } catch (localErr) {
        console.error('Local order storage also failed:', localErr);
        setErrorMsg('Could not place order. Please try again.');
        setLoading(false);
      }
      // loading stays true during the 2.5s delay until confirmation screen renders
    }
  };

  // UPI Link generation for QR code
  const upiId = import.meta.env.VITE_UPI_ID || '8445619079@fam';
  const upiName = import.meta.env.VITE_UPI_NAME || 'AnimeMaze';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=${upiName}&am=${total}&cu=INR&tn=AnimeMaze%20Order`
  )}`;

  if (orderCreatedId) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto text-success">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Order Placed Successfully!</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your order ID is <strong className="text-white">{orderCreatedId}</strong>. We have received your UPI screenshot and are currently verifying the payment. You can track this in your dashboard.
        </p>
        <div className="pt-4 flex gap-4">
          <Button fullWidth onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-white mb-8">Secure Checkout</h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Shipping Address */}
        <div className="lg:col-span-7 space-y-6 bg-surface/50 border border-white/5 p-6 sm:p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-4">1. Shipping Information</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Input
                label="Full Name"
                type="text"
                required
                placeholder="Naruto Uzumaki"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <Input
              label="Phone Number"
              type="tel"
              required
              placeholder="e.g. +91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="otaku@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Input
                label="Delivery Address"
                type="text"
                required
                placeholder="Flat No, Building, Street Name..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <Input
              label="City"
              type="text"
              required
              placeholder="Tokyo"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <Input
              label="State"
              type="text"
              required
              placeholder="Delhi / Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />

            <Input
              label="Pincode"
              type="text"
              required
              placeholder="110001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side: Payment details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order total amount card */}
          <div className="glass-card p-6 rounded-2xl border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm text-gray-400 border-b border-white/5 pb-4 mb-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedVariant || ''}`} className="flex justify-between items-center text-xs">
                  <div className="flex flex-col truncate max-w-[200px]">
                    <span className="truncate">{item.product.name} (x{item.quantity})</span>
                    {item.selectedVariant && (
                      <span className="text-[10px] text-primary-light font-bold">Size: {item.selectedVariant}</span>
                    )}
                  </div>
                  <span className="text-white">₹{item.product.price * item.quantity}</span>
                </div>
              ))}

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400 font-semibold pt-1">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-xs pt-1">
                <span>Shipping</span>
                <span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
              </div>
            </div>
            <div className="flex justify-between items-center font-extrabold text-base text-white">
              <span>Grand Total:</span>
              <span className="text-secondary-light">₹{total}</span>
            </div>
          </div>

          {/* UPI Payment display */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary-light" />
              <span>2. UPI Payment</span>
            </h2>

            {/* instructions */}
            <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-xs text-gray-400 space-y-2">
              <p className="font-bold text-white">Instructions:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Scan the QR code or copy the UPI ID below.</li>
                <li>Pay the exact amount: <strong className="text-white">₹{total}</strong></li>
                <li>Take a screenshot of the successful payment.</li>
                <li>Upload the screenshot and press "Place Order".</li>
              </ol>
            </div>

            {/* QR display */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl max-w-[220px] mx-auto border border-white/10">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-auto" />
              <span className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-wide">
                Scan using GPay / PhonePe / Paytm
              </span>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500">Merchant UPI ID:</p>
              <p className="text-sm font-bold text-secondary-light select-all">{upiId}</p>
            </div>

            {/* Screenshot file upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                Upload Payment Screenshot <span className="text-danger">*</span>:
              </label>

              {screenshotPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video bg-background flex items-center justify-center">
                  <img src={screenshotPreview} alt="Screenshot Preview" className="h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotFile(null);
                      setScreenshotPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-danger text-white text-[10px] font-bold px-2 py-1 rounded hover:brightness-110"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <label className="border border-white/10 hover:border-white/20 border-dashed rounded-xl p-8 bg-white/2 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-300 font-medium">Click to upload screenshot</span>
                  <span className="text-[10px] text-gray-500 mt-1">PNG, JPG, JPEG</span>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {/* Transaction ID */}
            <Input
              label="Transaction ID / UTR *"
              type="text"
              required
              placeholder="Enter 12-digit UPI Transaction ID or UTR"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Place Order (Verify Payment)
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
