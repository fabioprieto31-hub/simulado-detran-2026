import React, { useEffect, useState } from 'react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
      <div className="w-full max-w-sm p-4 bg-gray-900 rounded-lg text-white flex flex-col items-center">
        <div className="w-full h-48 bg-gray-800 rounded mb-4 flex items-center justify-center relative overflow-hidden animate-pulse">
          <span className="text-gray-400 font-bold text-xl">PUBLICIDADE</span>
          <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
             AdMob / AdSense Simulado
          </div>
        </div>
        
        <p className="mb-6 text-center text-sm text-gray-300">
          Apoie o desenvolvedor assistindo este vídeo curto.
        </p>

        <button
          onClick={onClose}
          disabled={!canClose}
          className={`w-full py-3 rounded font-bold transition-all ${
            canClose
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canClose ? 'FECHAR ANÚNCIO' : `AGUARDE ${timeLeft}s`}
        </button>
      </div>
    </div>
  );
};

export default AdModal;
