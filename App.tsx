
import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { STATIC_QUESTIONS } from './constants';
import { Question, QuizState } from './types';
import QuestionCard from './components/QuestionCard';
import AdModal from './components/AdModal';
import ResultScreen from './components/ResultScreen';
import Footer from './components/Footer';
import AdsterraBanner from './components/AdsterraBanner'; 
import { generateQuestions } from './services/geminiService';

const AD_FREQUENCY = 10; 
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

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        setGameState(currentState => {
            if (currentState.status === 'IDLE') {
                CapacitorApp.exitApp();
                return currentState;
            }
            if (currentState.status === 'PLAYING') {
                if (window.confirm("Deseja sair do simulado? Seu progresso será perdido.")) {
                    return { status: 'IDLE', currentQuestionIndex: 0, answers: [], shuffledQuestions: [] };
                }
                return currentState;
            }
            return { status: 'IDLE', currentQuestionIndex: 0, answers: [], shuffledQuestions: [] };
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
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (Capacitor.isNativePlatform()) CapacitorApp.removeAllListeners();
    };
  }, []);

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
    return () => { if (timer) clearInterval(timer); };
  }, [gameState.status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startStandardGame = useCallback(() => {
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
    const shuffled = shuffle(selected);
    setGameState({ status: 'PLAYING', currentQuestionIndex: 0, answers: [], shuffledQuestions: shuffled });
    setSelectedOption(null);
    setAiError(null);
    setTimeLeft(GAME_DURATION); 
  }, []);

  const startAiGame = async () => {
    setGameState(prev => ({ ...prev, status: 'LOADING_AI' }));
    setAiError(null);
    try {
      const newQuestions = await generateQuestions(10); 
      if (newQuestions.length === 0) throw new Error("No questions generated");
      setGameState({ status: 'PLAYING', currentQuestionIndex: 0, answers: [], shuffledQuestions: newQuestions });
      setSelectedOption(null);
      setTimeLeft(GAME_DURATION); 
    } catch (err) {
      setAiError("Não foi possível gerar questões com IA no momento.");
      setGameState(prev => ({ ...prev, status: 'IDLE' }));
    }
  };

  const handleRestart = () => {
    if (gameState.status === 'PLAYING') {
      if (!window.confirm("Deseja fechar o simulado?")) return;
    }
    setGameState({ status: 'IDLE', currentQuestionIndex: 0, answers: [], shuffledQuestions: [] });
    setSelectedOption(null);
    setAiError(null);
    setTimeLeft(GAME_DURATION);
  };

  const handleReview = () => {
    setGameState(prev => ({ ...prev, status: 'REVIEW', currentQuestionIndex: 0 }));
    setSelectedOption(gameState.answers[0] !== undefined ? gameState.answers[0] : null);
  };

  const handleNextQuestion = () => {
    const isReviewing = gameState.status === 'REVIEW';
    if (isReviewing) {
       const nextIndex = gameState.currentQuestionIndex + 1;
       if (nextIndex < gameState.shuffledQuestions.length) {
         setGameState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
         setSelectedOption(gameState.answers[nextIndex] !== undefined ? gameState.answers[nextIndex] : null);
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
      setGameState(prev => ({ ...prev, answers: newAnswers, status: 'FINISHED' }));
    } else {
      if (shouldShowAd) {
         setGameState(prev => ({ ...prev, answers: newAnswers, status: 'PAUSED_FOR_AD' }));
      } else {
         setGameState(prev => ({ ...prev, answers: newAnswers, currentQuestionIndex: nextIndex }));
         setSelectedOption(newAnswers[nextIndex] !== undefined ? newAnswers[nextIndex] : null);
      }
    }
  };

  const isReviewMode = gameState.status === 'REVIEW';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans pb-16">
      <header className={`text-white p-4 shadow-md sticky top-0 z-10 transition-colors ${isReviewMode ? 'bg-yellow-600' : 'bg-blue-700'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {(gameState.status === 'PLAYING' || gameState.status === 'FINISHED' || gameState.status === 'REVIEW') ? (
            <button onClick={handleRestart} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          ) : <div className="w-10"></div>}
          <div className="flex-grow text-center">
             {gameState.status === 'PLAYING' ? <div className={`text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-300 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</div> : 
             gameState.status === 'REVIEW' ? <div className="text-xl font-bold">REVISÃO</div> : 
             <div><h1 className="text-xl font-bold leading-none uppercase italic tracking-tighter">Detran 2026</h1><p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest">Simulado Oficial</p></div>}
          </div>
          <div className="w-10 text-right">
            {(gameState.status === 'PLAYING' || gameState.status === 'REVIEW') && <p className="text-sm font-bold">{gameState.currentQuestionIndex + 1}<span className="opacity-70 text-xs">/{gameState.shuffledQuestions.length}</span></p>}
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 max-w-2xl mx-auto w-full flex flex-col items-center">
        {gameState.status === 'IDLE' && (
           <div className="flex flex-col items-center justify-center py-6 text-center space-y-6 animate-fade-in w-full">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl mb-2 transform hover:scale-105 transition-transform duration-300 border-4 border-blue-50 flex items-center justify-center w-32 h-32 overflow-hidden">
                <img 
                  src="/logo192.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Se a imagem falhar, mostra um semáforo estiloso como fallback
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="text-6xl animate-bounce">🚦</span>';
                    }
                  }}
                />
             </div>
             <div>
               <h2 className="text-3xl font-black text-gray-800 mb-1 uppercase italic tracking-tighter">Treine para sua CNH</h2>
               <p className="text-gray-500 max-w-xs mx-auto text-sm font-medium">Banco oficial com 120 questões atualizadas.</p>
             </div>
             <div className="w-full max-w-xs space-y-3">
               <button onClick={startStandardGame} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-6 rounded-2xl shadow-xl transition-all active:scale-95 uppercase italic tracking-tighter text-xl border-b-4 border-blue-800">INICIAR SIMULADO</button>
               {process.env.API_KEY && <button onClick={startAiGame} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-5 px-6 rounded-2xl shadow-xl transition-all active:scale-95 uppercase italic tracking-tighter text-sm border-b-4 border-purple-800">QUESTÕES COM IA ✨</button>}
               {aiError && <p className="text-red-500 text-xs mt-2 font-bold">{aiError}</p>}
             </div>
             
             {/* Adsterra no Início */}
             <AdsterraBanner />
           </div>
        )}

        {gameState.status === 'LOADING_AI' && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
            <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">IA Gerando Prova...</p>
          </div>
        )}

        {(gameState.status === 'PLAYING' || gameState.status === 'REVIEW') && (
          <div className="w-full flex flex-col items-center">
            <QuestionCard 
              question={gameState.shuffledQuestions[gameState.currentQuestionIndex]}
              selectedOption={selectedOption}
              onSelectOption={(idx) => setSelectedOption(idx)}
              showFeedback={gameState.status === 'REVIEW'}
            />
            <div className="w-full max-w-md mt-2 sticky bottom-4 flex gap-3">
               {gameState.currentQuestionIndex > 0 && (
                 <button onClick={() => {
                   const prevIdx = gameState.currentQuestionIndex - 1;
                   setGameState(p => ({...p, currentQuestionIndex: prevIdx}));
                   setSelectedOption(gameState.answers[prevIdx]);
                 }} className="flex-1 py-4 rounded-xl font-bold shadow-lg bg-gray-200 text-gray-700 hover:bg-gray-300">VOLTAR</button>
               )}
               <button onClick={handleNextQuestion} disabled={selectedOption === null && !isReviewMode} 
                className={`flex-[2] py-4 rounded-xl font-black shadow-lg transition-all ${ (selectedOption !== null || isReviewMode) ? (isReviewMode ? 'bg-yellow-600 text-white' : 'bg-blue-600 text-white') : 'bg-gray-300 text-gray-500 cursor-not-allowed' }`}>
                {gameState.currentQuestionIndex === gameState.shuffledQuestions.length - 1 ? 'FINALIZAR' : 'PRÓXIMA ➜'}
              </button>
            </div>
          </div>
        )}

        {gameState.status === 'PAUSED_FOR_AD' && <AdModal onClose={() => {
          const nextIdx = gameState.currentQuestionIndex + 1;
          setGameState(p => ({...p, status: 'PLAYING', currentQuestionIndex: nextIdx}));
          setSelectedOption(null);
        }} />}

        {gameState.status === 'FINISHED' && (
          <div className="w-full flex flex-col items-center">
            <ResultScreen state={gameState} onRestart={handleRestart} onReview={handleReview} totalQuestions={gameState.shuffledQuestions.length} />
            
            {/* Adsterra no Final */}
            <AdsterraBanner />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
