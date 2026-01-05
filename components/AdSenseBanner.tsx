import React, { useEffect, useRef, useState } from 'react';

const AdSenseBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // Evita carregar duas vezes no Strict Mode ou se já carregou
    if (isAdLoaded) return;

    const attemptLoad = (retries = 0) => {
      // Limite de tentativas (aprox 5 segundos)
      if (retries > 50) return;

      // Verifica se o elemento existe e se tem largura definida no DOM
      // O erro 'No slot size for availableWidth=0' ocorre quando o script executa em um elemento oculto ou sem layout
      if (adRef.current && adRef.current.offsetWidth > 0) {
        try {
          if (typeof window !== 'undefined') {
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
            setIsAdLoaded(true);
          }
        } catch (e: any) {
          console.error("AdSense Error:", e);
        }
      } else {
        // Se a largura for 0 (elemento oculto ou não renderizado), tenta novamente em 100ms
        setTimeout(() => attemptLoad(retries + 1), 100);
      }
    };

    // Inicia a tentativa de carregamento com pequeno delay inicial
    const timer = setTimeout(() => attemptLoad(), 100);

    return () => clearTimeout(timer);
  }, [isAdLoaded]);

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden min-h-[100px] bg-gray-50 rounded-lg relative border border-gray-100">
      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-[10px] uppercase tracking-widest z-0 pointer-events-none">
        Publicidade
      </div>
      <ins 
           ref={adRef}
           className="adsbygoogle relative z-10 block"
           style={{ display: 'block', width: '100%' }}
           data-ad-client="ca-pub-2568819987093254"
           data-ad-slot="9517743775"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdSenseBanner;
