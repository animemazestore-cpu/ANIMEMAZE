import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CreditCard, Check, RefreshCw } from 'lucide-react';
import { createFamPayOrder, verifyFamPayOrder, type FamPayOrderResponse, type FamPayVerifyResponse } from '../lib/fampay';

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
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');

  // FamPay Payment State
  const [fampayOrderId, setFampayOrderId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderCreatedId, setOrderCreatedId] = useState<string | null>(null);
  const [orderDeliveryDate, setOrderDeliveryDate] = useState<string | null>(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !orderCreatedId && !loading) {
      navigate('/cart');
    }
  }, [items, navigate, orderCreatedId, loading]);

  // Generate FamPay QR Code on mount
  useEffect(() => {
    const generateQR = async () => {
      if (total > 0) {
        try {
          const upiId = import.meta.env.VITE_UPI_ID || '8445619079@fam';
          const response: FamPayOrderResponse = await createFamPayOrder(upiId, total);
          if (response.status === 'success') {
            setFampayOrderId(response.data.order_id);
            setQrCodeUrl(response.data.qr_url);
          } else {
            setErrorMsg('Failed to generate payment QR. Please try again.');
          }
        } catch (err) {
          console.error('FamPay QR generation failed:', err);
          setErrorMsg('Failed to generate payment QR. Please try again.');
        }
      }
    };
    generateQR();
  }, [total]);

  // Poll for payment verification
  useEffect(() => {
    if (!fampayOrderId || paymentStatus !== 'pending') return;

    const pollInterval = setInterval(async () => {
      try {
        const response: FamPayVerifyResponse = await verifyFamPayOrder(fampayOrderId);
        if (response.status === 'success' && response.data) {
          setPaymentStatus('paid');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Payment verification failed:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [fampayOrderId, paymentStatus]);

  const handleVerifyPayment = async () => {
    if (!fampayOrderId) return;
    setIsVerifyingPayment(true);
    try {
      const response: FamPayVerifyResponse = await verifyFamPayOrder(fampayOrderId);
      if (response.status === 'success' && response.data) {
        setPaymentStatus('paid');
      } else {
        setErrorMsg('Payment not yet verified. Please complete the payment and try again.');
      }
    } catch (err) {
      console.error('Manual verification failed:', err);
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to place an order.');
      navigate('/auth');
      return;
    }
    if (paymentStatus !== 'paid') {
      setErrorMsg('Please complete the payment verification before placing the order.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const shippingAddressJson = {
      fullName,
      phone,
      email,
      address,
      landmark,
      city,
      state,
      pincode,
      country,
      fampay_order_id: fampayOrderId,
      item_variants: items.map(item => ({
        product_id: item.product.id,
        selected_variant: item.selectedVariant || null
      }))
    };

    // Calculate estimated delivery date (5-6 days from now)
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5 + Math.floor(Math.random() * 2)); // 5-6 days

    try {
      // --- Try Supabase first ---
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          status: 'PAID',
          payment_status: 'PAID',
          shipping_address: shippingAddressJson,
          estimated_delivery_date: estimatedDeliveryDate.toISOString()
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
        setOrderDeliveryDate(estimatedDeliveryDate.toISOString());
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
          status: 'PAID',
          payment_status: 'PAID',
          shipping_address: shippingAddressJson,
          estimated_delivery_date: estimatedDeliveryDate.toISOString(),
          items: items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            selected_variant: item.selectedVariant || null
          })),
          created_at: new Date().toISOString(),
          fampay_order_id: fampayOrderId
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
          setOrderDeliveryDate(estimatedDeliveryDate.toISOString());
        }, 2500);
      } catch (localErr) {
        console.error('Local order storage also failed:', localErr);
        setErrorMsg('Could not place order. Please try again.');
        setLoading(false);
      }
      // loading stays true during the 2.5s delay until confirmation screen renders
    }
  };


  if (orderCreatedId) {
    const formattedDeliveryDate = orderDeliveryDate 
      ? new Date(orderDeliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto text-success">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Your order ID is <strong className="text-gray-900">{orderCreatedId}</strong>. Payment has been verified automatically via FamPay. You can track this in your dashboard.
        </p>
        {formattedDeliveryDate && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Estimated Delivery</p>
            <p className="text-lg font-bold text-gray-900">{formattedDeliveryDate}</p>
          </div>
        )}
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
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Secure Checkout</h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 text-danger rounded-xl text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Shipping Address */}
        <div className="lg:col-span-7 space-y-6 bg-white border border-gray-200 p-6 sm:p-8 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Shipping Information</h2>
          
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
              label="Landmark (Optional)"
              type="text"
              placeholder="Near metro station, school, etc."
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />

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

            <Input
              label="Country"
              type="text"
              required
              placeholder="India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side: Payment details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order total amount card */}
          <div className="glass-card p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm text-gray-600 border-b border-gray-200 pb-4 mb-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedVariant || ''}`} className="flex justify-between items-center text-xs">
                  <div className="flex flex-col truncate max-w-[200px]">
                    <span className="truncate">{item.product.name} (x{item.quantity})</span>
                    {item.selectedVariant && (
                      <span className="text-[10px] text-primary font-bold">Size: {item.selectedVariant}</span>
                    )}
                  </div>
                  <span className="text-gray-900">₹{item.product.price * item.quantity}</span>
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
            <div className="flex justify-between items-center font-extrabold text-base text-gray-900">
              <span>Grand Total:</span>
              <span className="text-secondary">₹{total}</span>
            </div>
          </div>

          {/* UPI Payment display */}
          <div className="glass-card p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>2. UPI Payment</span>
            </h2>

            {/* instructions */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-2">
              <p className="font-bold text-gray-900">Instructions:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Scan the QR code below using any UPI app.</li>
                <li>Pay the exact amount: <strong className="text-gray-900">₹{total}</strong></li>
                <li>Payment will be verified automatically within 30 seconds.</li>
                <li>Once verified, click "Place Order" to complete.</li>
              </ol>
            </div>

            {/* QR display */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl max-w-[220px] mx-auto border border-gray-200">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-auto" />
              ) : (
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-primary" />
              )}
              <span className="text-[10px] text-gray-500 font-bold mt-2 uppercase tracking-wide">
                Scan using GPay / PhonePe / Paytm
              </span>
            </div>

            {/* Payment Status */}
            <div className={`p-3 rounded-xl border text-center ${
              paymentStatus === 'paid' 
                ? 'bg-success/10 border-success/20 text-success' 
                : 'bg-warning/10 border-warning/20 text-warning'
            }`}>
              <p className="text-xs font-bold uppercase tracking-wider">
                {paymentStatus === 'paid' ? '✓ Payment Verified' : '⏳ Awaiting Payment'}
              </p>
              {paymentStatus === 'pending' && (
                <p className="text-[10px] mt-1 opacity-75">Auto-verifying every 5 seconds...</p>
              )}
            </div>

            {paymentStatus === 'pending' && (
              <Button
                type="button"
                variant="outline"
                fullWidth
                size="sm"
                onClick={handleVerifyPayment}
                loading={isVerifyingPayment}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Payment Status
              </Button>
            )}


            <Button 
              type="submit" 
              fullWidth 
              size="lg" 
              loading={loading}
              disabled={paymentStatus !== 'paid'}
            >
              {paymentStatus === 'paid' ? 'Place Order' : 'Complete Payment First'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
