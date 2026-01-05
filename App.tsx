import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { STATIC_QUESTIONS } from './constants';
import { Question, QuizState } from './types';
import QuestionCard from './components/QuestionCard';
import AdModal from './components/AdModal';
import ResultScreen from './components/ResultScreen';
import Footer from './components/Footer';
import AdSenseBanner from './components/AdSenseBanner'; 
import { generateQuestions } from './services/geminiService';

// Show ad every X questions
const AD_FREQUENCY = 5;
// Official time limit in seconds (40 minutes)
const GAME_DURATION = 40 * 60;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<QuizState>({
    status: 'IDLE',
    currentQuestionIndex: 0,
    answers: [],
    shuffledQuestions: []
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Initialize PWA checks and Back Button Handler
  useEffect(() => {
    // Lógica do botão Voltar (Android)
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        setGameState(currentState => {
            if (currentState.status === 'IDLE') {
                CapacitorApp.exitApp();
                return currentState;
            }
            
            if (currentState.status === 'PLAYING') {
                if (window.confirm("Deseja sair do simulado? Seu progresso será perdido.")) {
                    return {
                        status: 'IDLE',
                        currentQuestionIndex: 0,
                        answers: [],
                        shuffledQuestions: []
                    };
                }
                return currentState;
            }
            
            return {
                status: 'IDLE',
                currentQuestionIndex: 0,
                answers: [],
                shuffledQuestions: []
            };
        });
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('installBannerDismissed')) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isIosDevice && !isStandalone && !localStorage.getItem('installBannerDismissed')) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.removeAllListeners();
      }
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (gameState.status === 'PLAYING') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameState(curr => ({ ...curr, status: 'FINISHED' }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  const getWeightedQuestions = useCallback(() => {
    const shuffle = (array: Question[]) => [...array].sort(() => Math.random() - 0.5);

    const pools = {
      legislation: STATIC_QUESTIONS.filter(q => ['Legislação', 'Sinalização', 'Infrações'].includes(q.category || '')),
      defensive: STATIC_QUESTIONS.filter(q => q.category === 'Direção Defensiva'),
      firstAid: STATIC_QUESTIONS.filter(q => q.category === 'Primeiros Socorros'),
      mechanics: STATIC_QUESTIONS.filter(q => q.category === 'Mecânica'),
      environment: STATIC_QUESTIONS.filter(q => ['Meio Ambiente', 'Cidadania'].includes(q.category || ''))
    };

    const selected = [
      ...shuffle(pools.legislation).slice(0, 12),
      ...shuffle(pools.defensive).slice(0, 10),
      ...shuffle(pools.firstAid).slice(0, 3),
      ...shuffle(pools.environment).slice(0, 3),
      ...shuffle(pools.mechanics).slice(0, 2)
    ];

    return shuffle(selected);
  }, []);

  const startStandardGame = useCallback(() => {
    const shuffled = getWeightedQuestions();

    setGameState({
      status: 'PLAYING',
      currentQuestionIndex: 0,
      answers: [],
      shuffledQuestions: shuffled
    });
    setSelectedOption(null);
    setAiError(null);
    setTimeLeft(GAME_DURATION); 
  }, [getWeightedQuestions]);

  const startAiGame = async () => {
    setGameState(prev => ({ ...prev, status: 'LOADING_AI' }));
    setAiError(null);
    try {
      const newQuestions = await generateQuestions(10); 
      if (newQuestions.length === 0) throw new Error("No questions generated");
      
      setGameState({
        status: 'PLAYING',
        currentQuestionIndex: 0,
        answers: [],
        shuffledQuestions: newQuestions
      });
      setSelectedOption(null);
      setTimeLeft(GAME_DURATION); 
    } catch (err) {
      setAiError("Não foi possível gerar questões com IA. Verifique sua chave API ou tente novamente.");
      setGameState(prev => ({ ...prev, status: 'IDLE' }));
    }
  };

  const handleRestart = () => {
    if (gameState.status === 'PLAYING') {
      if (!window.confirm("Deseja fechar o simulado? Todo o progresso será perdido.")) {
         return;
      }
    }
    
    setGameState({
      status: 'IDLE',
      currentQuestionIndex: 0,
      answers: [],
      shuffledQuestions: []
    });
    setSelectedOption(null);
    setAiError(null);
    setTimeLeft(GAME_DURATION);
  };

  const handleReview = () => {
    setGameState(prev => ({
      ...prev,
      status: 'REVIEW',
      currentQuestionIndex: 0
    }));
    const firstAnswer = gameState.answers[0];
    setSelectedOption(firstAnswer !== undefined ? firstAnswer : null);
  };

  const handleOptionSelect = (index: number) => {
    if (gameState.status === 'REVIEW') return;
    setSelectedOption(index);
  };

  const handlePreviousQuestion = () => {
    if (gameState.currentQuestionIndex > 0) {
      const prevIndex = gameState.currentQuestionIndex - 1;
      
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prevIndex
      }));

      const prevAnswer = gameState.answers[prevIndex];
      setSelectedOption(prevAnswer !== undefined && prevAnswer !== null ? prevAnswer : null);
    }
  };

  const handleNextQuestion = () => {
    const isReviewing = gameState.status === 'REVIEW';

    if (isReviewing) {
       const nextIndex = gameState.currentQuestionIndex + 1;
       if (nextIndex < gameState.shuffledQuestions.length) {
         setGameState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
         const nextAnswer = gameState.answers[nextIndex];
         setSelectedOption(nextAnswer !== undefined ? nextAnswer : null);
       } else {
         setGameState(prev => ({ ...prev, status: 'FINISHED' }));
       }
       return;
    }

    const newAnswers = [...gameState.answers];
    newAnswers[gameState.currentQuestionIndex] = selectedOption;

    const nextIndex = gameState.currentQuestionIndex + 1;
    const shouldShowAd = nextIndex > 0 && nextIndex % AD_FREQUENCY === 0;

    if (nextIndex >= gameState.shuffledQuestions.length) {
      setGameState(prev => ({
        ...prev,
        answers: newAnswers,
        status: 'FINISHED'
      }));
    } else {
      if (shouldShowAd) {
         setGameState(prev => ({
           ...prev,
           answers: newAnswers,
           status: 'PAUSED_FOR_AD'
         }));
      } else {
         setGameState(prev => ({
           ...prev,
           answers: newAnswers,
           currentQuestionIndex: nextIndex
         }));
         
         if (newAnswers[nextIndex] !== undefined && newAnswers[nextIndex] !== null) {
           setSelectedOption(newAnswers[nextIndex]);
         } else {
           setSelectedOption(null);
         }
      }
    }
  };

  const handleAdClosed = () => {
    const nextIndex = gameState.currentQuestionIndex + 1;
    
    if (nextIndex >= gameState.shuffledQuestions.length) {
        setGameState(prev => ({ ...prev, status: 'FINISHED' }));
    } else {
        setGameState(prev => ({
          ...prev,
          status: 'PLAYING',
          currentQuestionIndex: nextIndex
        }));
        
        const existingAnswer = gameState.answers[nextIndex];
        setSelectedOption(existingAnswer !== undefined && existingAnswer !== null ? existingAnswer : null);
    }
  };

  const isReviewMode = gameState.status === 'REVIEW';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans pb-16">
      {/* Header */}
      <header className={`text-white p-4 shadow-md sticky top-0 z-10 transition-colors ${isReviewMode ? 'bg-yellow-600' : 'bg-blue-700'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          
          {(gameState.status === 'PLAYING' || gameState.status === 'FINISHED' || gameState.status === 'REVIEW') ? (
            <button 
              onClick={handleRestart}
              className="p-2 rounded-full hover:bg-white/20 transition-colors mr-2"
              title="Sair"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="w-10"></div> 
          )}

          <div className="flex-grow text-center">
             {gameState.status === 'PLAYING' ? (
               <div className={`text-xl font-mono font-bold tracking-wider ${timeLeft < 300 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                 {formatTime(timeLeft)}
               </div>
             ) : gameState.status === 'REVIEW' ? (
               <div className="text-xl font-bold tracking-tight">REVISÃO</div>
             ) : (
               <div>
                 <h1 className="text-xl font-bold tracking-tight leading-none">Simulado Detran</h1>
                 <p className="text-blue-200 text-xs">Prova Oficial 2026</p>
               </div>
             )}
          </div>

          <div className="w-10 text-right">
            {(gameState.status === 'PLAYING' || gameState.status === 'REVIEW') && (
              <div>
                <p className="text-sm font-bold">
                  {gameState.currentQuestionIndex + 1}
                  <span className="opacity-70 font-normal text-xs">/{gameState.shuffledQuestions.length}</span>
                </p>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 max-w-2xl mx-auto w-full flex flex-col items-center">
        
        {/* IDLE SCREEN */}
        {gameState.status === 'IDLE' && (
           <div className="flex flex-col items-center justify-center py-6 text-center space-y-6 animate-fade-in w-full">
             <div className="bg-white p-6 rounded-3xl shadow-xl mb-2 transform hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo192.png" 
                  alt="Logo Simulado Detran" 
                  className="w-28 h-28 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-6xl">🚦</span>';
                  }}
                />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-800 mb-2">Prepare-se para a prova!</h2>
               <p className="text-gray-600 max-w-xs mx-auto mb-2 text-sm">
                 Você terá <strong>40 minutos</strong> para responder <strong>30 questões</strong> sorteadas do banco de 120 perguntas.
               </p>
               <div className="flex justify-center gap-2 text-xs text-gray-500 mb-2 flex-wrap max-w-xs mx-auto">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">12 Legislação</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">10 Dir. Defensiva</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">3 Primeiros Socorros</span>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">3 Meio Amb.</span>
                  <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded">2 Mecânica</span>
               </div>
             </div>

             <div className="w-full max-w-xs space-y-3">
               <button 
                 onClick={startStandardGame}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
               >
                 <span>▶️</span> INICIAR PROVA COMPLETA
               </button>
               
               {process.env.API_KEY && (
                 <button 
                   onClick={startAiGame}
                   className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                 >
                   <span>✨</span> GERAR COM IA (BETA)
                 </button>
               )}
               
               {aiError && <p className="text-red-500 text-xs mt-2">{aiError}</p>}
             </div>

             {/* AdSense Banner no rodapé da Home (Visível em TODAS as plataformas) */}
             <div className="w-full mt-6">
                 <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Publicidade</p>
                 <AdSenseBanner />
             </div>
           </div>
        )}

        {/* LOADING SCREEN */}
        {gameState.status === 'LOADING_AI' && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
            <p className="text-gray-600 font-medium">A Inteligência Artificial está criando sua prova...</p>
          </div>
        )}

        {/* GAME SCREEN OR REVIEW SCREEN */}
        {(gameState.status === 'PLAYING' || gameState.status === 'REVIEW') && (
          <div className="w-full flex flex-col items-center">
            <QuestionCard 
              question={gameState.shuffledQuestions[gameState.currentQuestionIndex]}
              selectedOption={selectedOption}
              onSelectOption={handleOptionSelect}
              showFeedback={gameState.status === 'REVIEW'}
            />

            <div className="w-full max-w-md mt-2 sticky bottom-4 flex gap-3">
               {gameState.currentQuestionIndex > 0 && (
                 <button
                   onClick={handlePreviousQuestion}
                   className="flex-1 py-4 rounded-xl font-bold shadow-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all flex items-center justify-center"
                 >
                   <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                   </svg>
                   VOLTAR
                 </button>
               )}

              <button
                onClick={handleNextQuestion}
                disabled={selectedOption === null && !isReviewMode} 
                className={`flex-[2] py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  (selectedOption !== null || isReviewMode)
                    ? isReviewMode ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-500' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {gameState.currentQuestionIndex === gameState.shuffledQuestions.length - 1 
                  ? (isReviewMode ? 'VOLTAR AO RESULTADO' : 'FINALIZAR PROVA') 
                  : 'PRÓXIMA ➜'}
              </button>
            </div>
          </div>
        )}

        {/* AD OVERLAY LOGIC (AdSense Web Modal) */}
        {gameState.status === 'PAUSED_FOR_AD' && (
           <AdModal onClose={handleAdClosed} />
        )}

        {/* RESULT SCREEN */}
        {gameState.status === 'FINISHED' && (
          <div className="w-full flex flex-col items-center">
            <ResultScreen 
                state={gameState} 
                onRestart={handleRestart} 
                onReview={handleReview}
                totalQuestions={gameState.shuffledQuestions.length}
            />
            {/* AdSense Banner na tela de resultado (Visível em TODAS as plataformas) */}
            <div className="w-full max-w-md mt-6">
                <p className="text-xs text-center text-gray-400 mb-1 uppercase tracking-widest">Publicidade</p>
                <AdSenseBanner />
            </div>
          </div>
        )}
      </main>

      {/* INSTALL BANNER */}
      {showInstallBanner && (
         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_15px_rgba(0,0,0,0.15)] z-50 animate-slide-up-banner flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="bg-blue-600 text-white p-3 rounded-xl shadow-sm shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              </div>
              <div className="flex-grow">
                <p className="font-bold text-gray-900 leading-tight">Instalar Aplicativo</p>
                <p className="text-sm text-gray-600 leading-tight mt-0.5">
                   {isIOS 
                     ? "Toque em Compartilhar e 'Adicionar à Tela de Início'" 
                     : "Acesse offline e tenha melhor desempenho."}
                </p>
              </div>
           </div>
           
           <div className="flex gap-2 w-full sm:w-auto">
             <button 
               onClick={dismissInstallBanner}
               className="flex-1 sm:flex-none px-4 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-colors text-sm"
             >
               Agora não
             </button>
             {!isIOS && deferredPrompt && (
               <button 
                 onClick={handleInstallClick}
                 className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-95 text-sm"
               >
                 Instalar Grátis
               </button>
             )}
           </div>
         </div>
      )}

      <Footer />
    </div>
  );
};

export default App;
