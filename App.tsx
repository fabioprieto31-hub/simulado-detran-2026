import React, { useState, useEffect, useCallback } from 'react';
import { STATIC_QUESTIONS } from './constants';
import { Question, QuizState } from './types';
import QuestionCard from './components/QuestionCard';
import AdModal from './components/AdModal';
import ResultScreen from './components/ResultScreen';
import Footer from './components/Footer';
import { generateQuestions } from './services/geminiService';

// How many questions per simulation?
const TOTAL_QUESTIONS_PER_ROUND = 30;
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

  // Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (gameState.status === 'PLAYING') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time expired
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

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize Standard Game (Static Questions)
  const startStandardGame = useCallback(() => {
    // Shuffle the full bank and take the first N questions
    const shuffled = [...STATIC_QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, TOTAL_QUESTIONS_PER_ROUND);

    setGameState({
      status: 'PLAYING',
      currentQuestionIndex: 0,
      answers: [],
      shuffledQuestions: shuffled
    });
    setSelectedOption(null);
    setAiError(null);
    setTimeLeft(GAME_DURATION); // Reset timer
  }, []);

  // Initialize AI Game
  const startAiGame = async () => {
    setGameState(prev => ({ ...prev, status: 'LOADING_AI' }));
    setAiError(null);
    try {
      const newQuestions = await generateQuestions(10); // Generate 10 fresh questions
      if (newQuestions.length === 0) throw new Error("No questions generated");
      
      setGameState({
        status: 'PLAYING',
        currentQuestionIndex: 0,
        answers: [],
        shuffledQuestions: newQuestions
      });
      setSelectedOption(null);
      setTimeLeft(GAME_DURATION); // Reset timer
    } catch (err) {
      setAiError("Não foi possível gerar questões com IA. Verifique sua chave API ou tente novamente.");
      setGameState(prev => ({ ...prev, status: 'IDLE' }));
    }
  };

  const handleRestart = () => {
    // Confirmação apenas se o jogo estiver rolando (PLAYING)
    if (gameState.status === 'PLAYING') {
      if (!window.confirm("Deseja fechar o simulado? Todo o progresso será perdido.")) {
         return;
      }
    }
    
    // Complete reset of the state to Home
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

  // Switch to Review Mode
  const handleReview = () => {
    setGameState(prev => ({
      ...prev,
      status: 'REVIEW',
      currentQuestionIndex: 0
    }));
    // In review mode, we load the user's answer for the first question
    const firstAnswer = gameState.answers[0];
    setSelectedOption(firstAnswer !== undefined ? firstAnswer : null);
  };

  const handleOptionSelect = (index: number) => {
    // Prevent changing answer if in Review mode
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

      // Restore previous state
      const prevAnswer = gameState.answers[prevIndex];
      setSelectedOption(prevAnswer !== undefined && prevAnswer !== null ? prevAnswer : null);
    }
  };

  const handleNextQuestion = () => {
    const isReviewing = gameState.status === 'REVIEW';

    // If reviewing, we just move forward without ad checks or saving answers
    if (isReviewing) {
       const nextIndex = gameState.currentQuestionIndex + 1;
       if (nextIndex < gameState.shuffledQuestions.length) {
         setGameState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
         const nextAnswer = gameState.answers[nextIndex];
         setSelectedOption(nextAnswer !== undefined ? nextAnswer : null);
       } else {
         // End of review, go back to results
         setGameState(prev => ({ ...prev, status: 'FINISHED' }));
       }
       return;
    }

    // GAMEPLAY LOGIC (PLAYING)
    // Save the current answer into state
    const newAnswers = [...gameState.answers];
    newAnswers[gameState.currentQuestionIndex] = selectedOption;

    const nextIndex = gameState.currentQuestionIndex + 1;
    
    // Check for Ad Interruption
    const shouldShowAd = nextIndex > 0 && nextIndex % AD_FREQUENCY === 0;

    // Check for End of Game
    if (nextIndex >= gameState.shuffledQuestions.length) {
      setGameState(prev => ({
        ...prev,
        answers: newAnswers,
        status: 'FINISHED'
      }));
    } else {
      // Logic for moving to next question
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
         
         // Setup UI for next question
         if (newAnswers[nextIndex] !== undefined && newAnswers[nextIndex] !== null) {
           setSelectedOption(newAnswers[nextIndex]);
         } else {
           setSelectedOption(null);
         }
      }
    }
  };

  const handleAdClosed = () => {
    // Resume game and move index forward
    const nextIndex = gameState.currentQuestionIndex + 1;
    
    if (nextIndex >= gameState.shuffledQuestions.length) {
        setGameState(prev => ({ ...prev, status: 'FINISHED' }));
    } else {
        setGameState(prev => ({
          ...prev,
          status: 'PLAYING',
          currentQuestionIndex: nextIndex
        }));
        
        // Check if next was already answered
        const existingAnswer = gameState.answers[nextIndex];
        setSelectedOption(existingAnswer !== undefined && existingAnswer !== null ? existingAnswer : null);
    }
  };

  const isReviewMode = gameState.status === 'REVIEW';

  // Render Logic
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* Header */}
      <header className={`text-white p-4 shadow-md sticky top-0 z-10 transition-colors ${isReviewMode ? 'bg-yellow-600' : 'bg-blue-700'}`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          
          {/* Left: Close Button */}
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

          {/* Center: Title or Timer */}
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

          {/* Right: Question Counter */}
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
           <div className="flex flex-col items-center justify-center py-10 text-center space-y-8 animate-fade-in w-full">
             <div className="bg-white p-6 rounded-3xl shadow-xl mb-4 transform hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo192.png" 
                  alt="Logo Simulado Detran" 
                  className="w-32 h-32 object-contain"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-6xl">🚦</span>';
                  }}
                />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-800 mb-2">Prepare-se para a prova!</h2>
               <p className="text-gray-600 max-w-xs mx-auto mb-2">
                 Você terá <strong>40 minutos</strong> para responder <strong>30 questões</strong>.
               </p>
               <p className="text-sm text-gray-500">
                 Acerto mínimo: 70% (21 questões).
               </p>
             </div>

             <div className="w-full max-w-xs space-y-3">
               <button 
                 onClick={startStandardGame}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
               >
                 <span>▶️</span> INICIAR PROVA
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
               {/* Back Button */}
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

              {/* Main Action Button */}
              <button
                onClick={handleNextQuestion}
                disabled={selectedOption === null && !isReviewMode} // Can click next in review mode even if null (unanswered)
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

        {/* AD OVERLAY */}
        {gameState.status === 'PAUSED_FOR_AD' && (
          <AdModal onClose={handleAdClosed} />
        )}

        {/* RESULT SCREEN */}
        {gameState.status === 'FINISHED' && (
          <ResultScreen 
            state={gameState} 
            onRestart={handleRestart} 
            onReview={handleReview}
            totalQuestions={gameState.shuffledQuestions.length}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;