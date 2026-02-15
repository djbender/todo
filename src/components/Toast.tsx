import { useState, useEffect } from 'react';
import { setAddToast } from './toastService';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success';
}

let nextId = 0;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setAddToast((message: string, type: 'error' | 'success') => {
      const id = (nextId++).toString();
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    });
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
