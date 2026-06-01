import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClose: () => void;
  fishData?: {
    emoji: string;
    name: string;
    lb: number;
    isPerfect: boolean;
    color: string;
    price: number;
  };
}

export function ToastNotification({ message, type = 'info', duration = 3000, onClose, fishData }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    success: 'bg-green-500/90',
    info: 'bg-blue-500/90',
    warning: 'bg-yellow-500/90',
    error: 'bg-red-500/90'
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${bgColors[type]} backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 p-4 min-w-[300px] max-w-[400px]`}>
        <div className="flex items-start gap-3">
          {fishData && (
            <div className="text-4xl">{fishData.emoji}</div>
          )}
          <div className="flex-1">
            {fishData ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-white text-lg">{fishData.name}</p>
                  <button onClick={onClose} className="text-white/70 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-2xl font-black mb-1" style={{ color: fishData.color }}>
                  {fishData.lb} LB
                </p>
                {fishData.isPerfect && (
                  <p className="text-yellow-300 text-sm font-bold mb-1">⭐ PERFECT CATCH!</p>
                )}
                <p className="text-white/90 text-sm">Auto-sold: +{fishData.price} WL</p>
              </>
            ) : (
              <p className="text-white font-medium">{message}</p>
            )}
          </div>
          {!fishData && (
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type?: 'success' | 'info' | 'warning' | 'error';
    fishData?: any;
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ animationDelay: `${index * 100}ms` }}>
          <ToastNotification
            message={toast.message}
            type={toast.type}
            fishData={toast.fishData}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
