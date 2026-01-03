export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number; // Index 0-3
  category?: string;
  explanation?: string;
}

export interface QuizState {
  status: 'IDLE' | 'PLAYING' | 'PAUSED_FOR_AD' | 'FINISHED' | 'LOADING_AI';
  currentQuestionIndex: number;
  answers: (number | null)[]; // Stores user answers
  shuffledQuestions: Question[];
}

export enum GameMode {
  STANDARD = 'STANDARD',
  AI_GENERATED = 'AI_GENERATED'
}
