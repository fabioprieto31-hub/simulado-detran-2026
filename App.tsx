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

const App: React.FC = () => {
  const [gameState, setGameState] = useState<QuizState>({
    status: 'IDLE',
    currentQuestionIndex: 0,
    answers: [],
    shuffledQuestions: []
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
    setShowFeedback(false);
    setAiError(null);
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
      setShowFeedback(false);
    } catch (err) {
      setAiError("Não foi possível gerar questões com IA. Verifique sua chave API ou tente novamente.");
      setGameState(prev => ({ ...prev, status: 'IDLE' }));
    }
  };

  const handleRestart = () => {
    // Only ask for confirmation if actually playing. If finished, just exit.
    if (gameState.status === 'PLAYING') {
      if (!window.confirm("Deseja realmente sair do simulado atual? Seu progresso será perdido.")) {
         return;
      }
    }
    
    // Complete reset of the state
    setGameState({
      status: 'IDLE',
      currentQuestionIndex: 0,
      answers: [],
      shuffledQuestions: []
    });
    setSelectedOption(null);
    setShowFeedback(false);
    setAiError(null);
  };

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    setShowFeedback(true);
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
      if (prevAnswer !== undefined && prevAnswer !== null) {
        setSelectedOption(prevAnswer);
        setShowFeedback(true); // Always show feedback if going back to an answered question
      } else {
        setSelectedOption(null);
        setShowFeedback(false);
      }
    }
  };

  const handleNextQuestion = () => {
    // Save the current answer into state
    const newAnswers = [...gameState.answers];
    newAnswers[gameState.currentQuestionIndex] = selectedOption;

    const nextIndex = gameState.currentQuestionIndex + 1;
    
    // Check for Ad Interruption
    // Show ad if nextIndex is a multiple of AD_FREQUENCY, 
    // AND we are effectively moving forward into a "checkpoint"
    // We check if (nextIndex) % 5 == 0. 
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
         // Check if we already have an answer for the next question (if user went back then fwd)
         if (newAnswers[nextIndex] !== undefined && newAnswers[nextIndex] !== null) {
           setSelectedOption(newAnswers[nextIndex]);
           setShowFeedback(true);
         } else {
           setSelectedOption(null);
           setShowFeedback(false);
         }
      }
    }
  };

  const handleAdClosed = () => {
    // Resume game and move index forward
    const nextIndex = gameState.currentQuestionIndex + 1;
    
    // Ensure we don't go out of bounds if ad happened at the very end (unlikely with current logic but safe)
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
        if (existingAnswer !== undefined && existingAnswer !== null) {
          setSelectedOption(existingAnswer);
          setShowFeedback(true);
        } else {
          setSelectedOption(null);
          setShowFeedback(false);
        }
    }
  };

  // Render Logic
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
             <h1 className="text-xl font-bold tracking-tight">Simulado Detran 2026</h1>
             <p className="text-blue-200 text-xs">Prova Teórica</p>
          </div>
          <div className="flex items-center gap-4">
            {gameState.status === 'PLAYING' && (
              <div className="text-right mr-2">
                <p className="text-sm font-medium">
                  {gameState.currentQuestionIndex + 1} / {gameState.shuffledQuestions.length}
                </p>
                <p className="text-xs text-blue-200">Questão</p>
              </div>
            )}
            {/* Restart/Quit Button */}
            {(gameState.status === 'PLAYING' || gameState.status === 'FINISHED') && (
              <button 
                onClick={handleRestart}
                className="bg-blue-800 p-2 rounded-full hover:bg-blue-600 transition-colors"
                title="Sair / Reiniciar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 max-w-2xl mx-auto w-full flex flex-col items-center">
        
        {/* IDLE SCREEN */}
        {gameState.status === 'IDLE' && (
           <div className="flex flex-col items-center justify-center py-10 text-center space-y-8 animate-fade-in">
             <div className="bg-white p-6 rounded-full shadow-lg mb-4">
                <span className="text-6xl">🚦</span>
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-800 mb-2">Prepare-se para a prova!</h2>
               <p className="text-gray-600 max-w-xs mx-auto">
                 Teste seus conhecimentos com questões variadas de um banco de 120 perguntas.
               </p>
             </div>

             <div className="w-full max-w-xs space-y-3">
               <button 
                 onClick={startStandardGame}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
               >
                 <span>▶️</span> INICIAR SIMULADO
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

        {/* GAME SCREEN */}
        {gameState.status === 'PLAYING' && (
          <div className="w-full flex flex-col items-center">
            <QuestionCard 
              question={gameState.shuffledQuestions[gameState.currentQuestionIndex]}
              selectedOption={selectedOption}
              onSelectOption={handleOptionSelect}
              showFeedback={showFeedback}
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
              {!showFeedback ? (
                <button
                  onClick={handleConfirmAnswer}
                  disabled={selectedOption === null}
                  className={`flex-[2] py-4 rounded-xl font-bold shadow-lg transition-all ${
                    selectedOption !== null 
                      ? 'bg-blue-600 text-white hover:bg-blue-500' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  CONFIRMAR
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="flex-[2] py-4 rounded-xl font-bold shadow-lg bg-green-600 text-white hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                >
                  PRÓXIMA ➜
                </button>
              )}
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
            totalQuestions={gameState.shuffledQuestions.length}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;