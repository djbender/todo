let addToast: (message: string, type: 'error' | 'success') => void;

export const setAddToast = (fn: typeof addToast) => {
  addToast = fn;
};

export const toast = {
  error: (message: string) => addToast(message, 'error'),
  success: (message: string) => addToast(message, 'success'),
};
