import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle } from 'lucide-react';

export function Toast({ message, duration = 15000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg">
      <AlertCircle size={20} className="text-yellow-400" />
      <p>{message}</p>
    </div>,
    document.body
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, duration = 15000) => {
    setToast({ message, duration });
  };

  const hideToast = () => {
    setToast(null);
  };

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      duration={toast.duration}
      onClose={hideToast}
    />
  ) : null;

  return [ToastComponent, showToast];
}
