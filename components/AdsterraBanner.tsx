import React, { useEffect, useRef } from 'react';

const AdsterraBanner: React.FC = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Evita recarregar se já houver conteúdo
    if (bannerRef.current && bannerRef.current.children.length === 0) {
      const container = bannerRef.current;

      // Script de Configuração (atOptions)
      const atOptionsScript = document.createElement('script');
      atOptionsScript.type = 'text/javascript';
      atOptionsScript.innerHTML = `
        atOptions = {
          'key' : '594049794d40b803695b18404b05fa60',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;

      // Script de Execução (invoke.js)
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = '//www.highperformanceformat.com/594049794d40b803695b18404b05fa60/invoke.js';

      container.appendChild(atOptionsScript);
      container.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="flex flex-col items-center my-4 overflow-hidden">
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
        Publicidade
      </div>
      <div 
        ref={bannerRef} 
        className="w-[300px] h-[250px] bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300 shadow-inner"
      >
        {/* O Adsterra irá injetar o iframe aqui */}
      </div>
    </div>
  );
};

export default AdsterraBanner;