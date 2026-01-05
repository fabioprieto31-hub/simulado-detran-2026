import React, { useEffect, useRef, useState } from 'react';

const AdSenseBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // Evita carregar duas vezes no Strict Mode ou se já carregou
    if (isAdLoaded) return;

    const attemptLoad = (retries = 0) => {
      // Limite de tentativas estendido (aprox 10 segundos)
      if (retries > 100) return;

      // Verifica se o elemento existe e se tem dimensões reais no DOM
      // AdSense precisa de width > 0 para calcular o tamanho do slot
      if (adRef.current && adRef.current.offsetWidth > 0 && adRef.current.offsetHeight > 0) {
        try {
          if (typeof window !== 'undefined') {
            const adsbygoogle = (window as any).adsbygoogle || [];
            adsbygoogle.push({});
            setIsAdLoaded(true);
          }
        } catch (e: any) {
          // Ignora erro específico de slot size para não sujar o console, pois o retry cuidará disso se for temporário
          if (!e?.message?.includes('No slot size')) {
             console.error("AdSense Error:", e);
          }
        }
      } else {
        // Se a largura for 0 (elemento oculto ou não renderizado), tenta novamente em 100ms
        setTimeout(() => attemptLoad(retries + 1), 100);
      }
    };

    // Inicia a tentativa de carregamento com delay inicial para garantir renderização do layout pai
    const timer = setTimeout(() => {
       // Usa requestAnimationFrame para garantir que o paint do navegador ocorreu
       window.requestAnimationFrame(() => attemptLoad());
    }, 200);

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
           style={{ display: 'block', width: '100%', minHeight: '100px' }}
           data-ad-client="ca-pub-2568819987093254"
           data-ad-slot="9517743775"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdSenseBanner;
