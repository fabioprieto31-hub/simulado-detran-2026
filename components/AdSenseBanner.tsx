import React, { useEffect, useRef } from 'react';

const AdSenseBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Evita chamada dupla em StrictMode ou re-renders
    if (initialized.current) return;
    
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        // Apenas dá push se o script do AdSense estiver carregado e o elemento existir
        // O try-catch já protege, mas essa é a lógica padrão
        adsbygoogle.push({});
        initialized.current = true;
      }
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden min-h-[100px] bg-gray-200/50 rounded-lg">
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
           data-ad-client="ca-pub-2568819987093254"
           data-ad-slot="9517743775"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdSenseBanner;