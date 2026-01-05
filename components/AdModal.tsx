import React, { useEffect, useState } from 'react';
import AdSenseBanner from './AdSenseBanner';

interface AdModalProps {
  onClose: () => void;
}

const AdModal: React.FC<AdModalProps> = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95 p-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-lg text-white flex flex-col items-center relative overflow-hidden">
        
        <div className="w-full p-2 bg-gray-800 flex justify-between items-center">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Publicidade</span>
            {canClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            )}
        </div>

        <div className="w-full bg-white p-1 min-h-[250px] flex items-center justify-center">
             {/* Exibe o anúncio AdSense aqui */}
             <AdSenseBanner />
        </div>
        
        <div className="p-4 w-full">
            <button
            onClick={onClose}
            disabled={!canClose}
            className={`w-full py-3 rounded-lg font-bold transition-all ${
                canClose
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            >
            {canClose ? 'FECHAR ANÚNCIO' : `FECHAR EM ${timeLeft}s`}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdModal;
