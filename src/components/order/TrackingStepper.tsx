import React from 'react';
import { Check, Clock, Package, Truck, Home, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import type { OrderStatus } from '../../types/database';

interface TrackingStepperProps {
  status: OrderStatus;
  trackingInfo?: {
    carrier?: string;
    tracking_number?: string;
    shipped_at?: string;
  };
}

export const TrackingStepper: React.FC<TrackingStepperProps> = ({ status, trackingInfo }) => {
  const [copied, setCopied] = React.useState(false);

  const stages = [
    { key: 'PLACED', label: 'Order Placed', icon: Clock, desc: 'Awaiting manual UPI verification' },
    { key: 'PAID', label: 'Payment Approved', icon: CheckCircle2, desc: 'UPI screenshot verified successfully' },
    { key: 'PROCESSING', label: 'Processing', icon: Package, desc: 'Items are being quality-checked and packaged' },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck, desc: 'Dispatched from warehouse' },
    { key: 'DELIVERED', label: 'Delivered', icon: Home, desc: 'Package delivered safely' },
  ];

  const getStatusIndex = (currentStatus: OrderStatus): number => {
    switch (currentStatus) {
      case 'PENDING_VERIFICATION': return 0;
      case 'PAID': return 1;
      case 'PROCESSING': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStatusIndex(status);
  const isCancelled = status === 'CANCELLED';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCarrierTrackLink = (carrier?: string, num?: string): string | null => {
    if (!carrier || !num) return null;
    const name = carrier.toLowerCase();
    if (name.includes('delhivery')) {
      return `https://www.delhivery.com/track/package/${num}`;
    }
    if (name.includes('blue dart') || name.includes('bluedart')) {
      return `https://www.bluedart.com/tracking`;
    }
    if (name.includes('dtdc')) {
      return `https://www.dtdc.in/tracking.asp`;
    }
    if (name.includes('india post') || name.includes('speed post')) {
      return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx`;
    }
    return null;
  };

  const trackLink = trackingInfo ? getCarrierTrackLink(trackingInfo.carrier, trackingInfo.tracking_number) : null;

  if (isCancelled) {
    return (
      <div className="p-4 bg-danger/10 border border-danger/30 rounded-2xl flex items-center space-x-3 text-danger text-sm">
        <AlertCircle className="h-5 w-5 flex-shrink-0 animate-pulse" />
        <div>
          <p className="font-bold">Order Cancelled</p>
          <p className="text-xs text-danger/80">This order has been cancelled. If payment was made, your refund is being processed manually.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full py-4">
      {/* Visual Line Stepper */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4">
        {/* Connection Line (Desktop) */}
        <div className="absolute left-6 right-6 top-[22px] h-0.5 bg-white/5 hidden md:block z-0">
          <div 
            className="h-full bg-gradient-to-r from-primary via-purple-500 to-secondary transition-all duration-1000"
            style={{ width: `${(currentIndex / 4) * 100}%` }}
          />
        </div>

        {stages.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={stage.key} className="flex md:flex-col items-center md:text-center relative z-10 w-full md:w-auto gap-4 md:gap-2 group">
              {/* Step indicator circle */}
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-gradient-to-br from-primary to-purple-600 border-primary shadow-lg shadow-primary/20 text-white' 
                    : isActive 
                    ? 'bg-surface border-secondary-light text-secondary-light shadow-lg shadow-secondary/20 animate-pulse scale-105' 
                    : 'bg-[#0B0F19] border-white/10 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 stroke-[2.5]" />
                ) : (
                  <StageIcon className="h-5 w-5" />
                )}
              </div>

              {/* Text metadata */}
              <div className="text-left md:text-center space-y-0.5">
                <p 
                  className={`text-sm font-bold transition-colors ${
                    isCompleted || isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 max-w-[150px] leading-snug md:mx-auto">
                  {idx === 3 && isActive && trackingInfo?.carrier
                    ? `Pending dispatch via ${trackingInfo.carrier}`
                    : stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courier tracking details info block */}
      {status === 'SHIPPED' && trackingInfo?.tracking_number && (
        <div className="p-5 bg-white/2 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fadeIn">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
              Shipment Dispatch Tracking Info
            </span>
            <p className="text-sm font-bold text-white">
              Carrier Partner: <span className="text-gray-300 font-medium">{trackingInfo.carrier || 'Standard Courier'}</span>
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Tracking Number:</span>
              <code className="text-xs font-mono font-bold text-secondary-light select-all">
                {trackingInfo.tracking_number}
              </code>
              <button 
                onClick={() => copyToClipboard(trackingInfo.tracking_number || '')}
                className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                title="Copy tracking number"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            {trackingInfo.shipped_at && (
              <p className="text-[10px] text-gray-500">
                Dispatched on: {new Date(trackingInfo.shipped_at).toLocaleString()}
              </p>
            )}
          </div>

          {trackLink ? (
            <a 
              href={trackLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-4 py-2 bg-secondary text-background hover:brightness-110 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-secondary/15 flex items-center space-x-1.5"
            >
              <span>Track Shipment</span>
              <Truck className="h-3.5 w-3.5" />
            </a>
          ) : (
            <div className="text-xs text-gray-500 max-w-[200px] text-left sm:text-right leading-tight">
              Please copy the tracking number and track it on the courier's official portal.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
