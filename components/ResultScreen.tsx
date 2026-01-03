import React from 'react';
import { QuizState } from '../types';

interface ResultScreenProps {
  state: QuizState;
  onRestart: () => void;
  onReview: () => void;
  totalQuestions: number;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ state, onRestart, onReview, totalQuestions }) => {
  // Calculate score derived from answers
  const calculatedScore = state.answers.reduce((acc, answer, index) => {
    const question = state.shuffledQuestions[index];
    if (question && answer === question.correctAnswer) {
      return (acc || 0) + 1;
    }
    return acc || 0;
  }, 0) || 0;

  const percentage = Math.round((calculatedScore / totalQuestions) * 100);
  const isPass = percentage >= 70;

  const handleShare = () => {
    const text = `Acabei de fazer o *Simulado Detran 2026* e acertei *${calculatedScore}* de *${totalQuestions}* questões (${percentage}%)! 🚗💨\n\nBaixe agora e teste seus conhecimentos! #SimuladoDetran2026 #JapGames`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resultado Final</h2>
        
        <div className={`text-6xl font-black mb-4 ${isPass ? 'text-green-500' : 'text-red-500'}`}>
          {percentage}%
        </div>
        
        <p className="text-gray-600 mb-6">
          Você acertou <span className="font-bold text-gray-900">{calculatedScore}</span> de <span className="font-bold text-gray-900">{totalQuestions}</span> questões.
        </p>

        <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          {isPass ? (
            <div>
              <span className="text-4xl block mb-2">🏆</span>
              <p className="text-green-700 font-bold">PARABÉNS! VOCÊ PASSOU!</p>
              <p className="text-xs text-green-600 mt-1">Continue estudando para garantir sua CNH.</p>
            </div>
          ) : (
            <div>
              <span className="text-4xl block mb-2">🛑</span>
              <p className="text-red-700 font-bold">NÃO FOI DESSA VEZ</p>
              <p className="text-xs text-red-600 mt-1">Você precisa de 70% para passar. Tente novamente!</p>
            </div>
          )}
        </div>

        <button
          onClick={onReview}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg mb-3 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Revisar Respostas
        </button>

        <button
          onClick={handleShare}
          className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 mb-3 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          Compartilhar no WhatsApp
        </button>

        <button
          onClick={onRestart}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm"
        >
          Novo Simulado
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;