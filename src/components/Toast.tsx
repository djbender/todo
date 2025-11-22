import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success';
}

let addToast: (message: string, type: 'error' | 'success') => void;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToast = (message: string, type: 'error' | 'success') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export const toast = {
  error: (message: string) => addToast(message, 'error'),
  success: (message: string) => addToast(message, 'success'),
};
