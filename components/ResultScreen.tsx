import React from 'react';
import { QuizState } from '../types';

interface ResultScreenProps {
  state: QuizState;
  onRestart: () => void;
  onReview: () => void;
  totalQuestions: number;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ state, onRestart, onReview, totalQuestions }) => {
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
    const text = `Acabei de fazer o *Simulado Detran 2026* e acertei *${calculatedScore}* de *${totalQuestions}* questões (${percentage}%)! 🚗💨\n\nBaixe agora e teste seus conhecimentos!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 text-center animate-fade-in w-full">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-black text-gray-800 mb-2 uppercase italic tracking-tighter">Resultado</h2>
        
        <div className={`text-7xl font-black mb-4 ${isPass ? 'text-green-500' : 'text-red-500'} italic`}>
          {percentage}%
        </div>
        
        <p className="text-gray-500 mb-6 font-medium">
          Você acertou <span className="font-black text-gray-900">{calculatedScore}</span> de <span className="font-bold text-gray-900">{totalQuestions}</span>.
        </p>

        <div className="mb-6 p-5 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200">
          {isPass ? (
            <div>
              <span className="text-5xl block mb-2">🏆</span>
              <p className="text-green-700 font-black uppercase italic">APROVADO!</p>
              <p className="text-[10px] text-green-600 mt-1 font-bold">Excelente desempenho. Você está pronto!</p>
            </div>
          ) : (
            <div>
              <span className="text-5xl block mb-2">🛑</span>
              <p className="text-red-700 font-black uppercase italic">REPROVADO</p>
              <p className="text-[10px] text-red-600 mt-1 font-bold">Mínimo necessário: 70%. Pratique mais!</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onReview}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black py-4 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 uppercase text-sm"
          >
            Revisar Questões
          </button>

          <button
            onClick={handleShare}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 uppercase text-sm"
          >
            Compartilhar no Whats
          </button>

          <button
            onClick={onRestart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-lg active:scale-95 uppercase text-sm"
          >
            Novo Simulado
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;