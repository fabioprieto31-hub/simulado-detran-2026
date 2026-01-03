import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  selectedOption: number | null;
  onSelectOption: (index: number) => void;
  showFeedback: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  selectedOption, 
  onSelectOption,
  showFeedback 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-4 w-full max-w-md animate-fade-in">
      <div className="mb-4">
        <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded mb-2">
          {question.category || 'Geral'}
        </span>
        <h2 className="text-lg font-bold text-gray-800 leading-tight">
          {question.text}
        </h2>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 text-sm ";
          
          if (showFeedback) {
            if (index === question.correctAnswer) {
              buttonClass += "border-green-500 bg-green-50 text-green-900 font-semibold";
            } else if (index === selectedOption && index !== question.correctAnswer) {
              buttonClass += "border-red-500 bg-red-50 text-red-900";
            } else {
              buttonClass += "border-gray-200 opacity-60";
            }
          } else {
            if (selectedOption === index) {
              buttonClass += "border-blue-500 bg-blue-50 text-blue-900 font-medium transform scale-[1.02]";
            } else {
              buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700";
            }
          }

          return (
            <button
              key={index}
              onClick={() => !showFeedback && onSelectOption(index)}
              disabled={showFeedback}
              className={buttonClass}
            >
              <div className="flex items-start">
                <span className="mr-3 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-current text-xs">
                  {['A', 'B', 'C', 'D'][index]}
                </span>
                <span>{option}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      {showFeedback && question.explanation && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded border-l-4 border-blue-500 animate-slide-up">
          <strong>Explicação:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
