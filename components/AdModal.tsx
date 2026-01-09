import React, { useEffect, useState } from 'react';
import AdsterraBanner from './AdsterraBanner';

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
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl text-white flex flex-col items-center relative overflow-hidden shadow-2xl border border-gray-800">
        
        <div className="w-full p-4 bg-gray-800 flex justify-between items-center border-b border-gray-700">
            <span className="text-xs text-yellow-500 font-black uppercase tracking-widest">Anúncio de Recompensa</span>
            {canClose && (
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            )}
        </div>

        <div className="w-full bg-white flex items-center justify-center py-6">
             <AdsterraBanner />
        </div>
        
        <div className="p-6 w-full bg-gray-900">
            <p className="text-center text-gray-400 text-xs mb-4 px-4 leading-snug">
              Apoie nosso app assistindo este anúncio para continuar o simulado gratuitamente.
            </p>
            <button
            onClick={onClose}
            disabled={!canClose}
            className={`w-full py-4 rounded-2xl font-black transition-all transform active:scale-95 ${
                canClose
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-lg'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
            }`}
            >
            {canClose ? 'CONTINUAR SIMULADO' : `FECHAR EM ${timeLeft}s`}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdModal;