import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ children, onClose, title, size = 'medium' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`${sizeClasses[size]} bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up`}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="font-playfair text-xl font-bold text-navy">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;