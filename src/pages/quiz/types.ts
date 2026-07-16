export interface Subject {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  quizzesCount: number;
  questionsCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  createdAt: any;
}

export interface Quiz {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  coverImage: string;
  type: 'daily' | 'practice' | 'chapter' | 'timed' | 'mock' | 'subject' | 'image' | 'audio' | 'mixed' | 'random';
  timeLimit: number; // in seconds
  questionsCount: number;
  points: number;
  isPublished: boolean;
  isTodayQuiz: boolean;
  scheduleDate?: string;
  createdAt: any;
}

export interface Question {
  id: string;
  quizId: string;
  subjectId: string;
  text: string;
  type: 'mcq' | 'true_false' | 'image' | 'audio' | 'match' | 'fill_blank' | 'multiple_correct';
  options: string[];
  correctAnswer: string | string[]; // for multiple correct answers, this is an array of options
  explanation?: string;
  scriptureRef?: string;
  chapter?: string;
  chapterId?: string;
  language?: string;
  verse?: string;
  imageUrl?: string;
  audioUrl?: string;
  relatedVideo?: string;
  relatedPdf?: string;
  relatedQuote?: string;
}

export interface QuizProgress {
  id: string;
  quizId: string;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string | string[]>;
  bookmarks: string[];
  isCompleted: boolean;
  lastActive: any;
}

export interface QuizHistory {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  quizId: string;
  quizName: string;
  completedAt: any;
  score: number;
  percentage: number;
  timeTaken: number; // in seconds
  rank?: number;
  certificateId?: string | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  answers: Record<string, { selected: string | string[]; isCorrect: boolean }>;
  language?: string;
  userDisplayName?: string;
}

export interface LeaderboardEntry {
  id: string;
  quizId: string;
  userId: string;
  userName: string;
  profileImage: string;
  score: number;
  percentage: number;
  timeTaken: number;
  completedAt: any;
  badges?: string[];
}

export interface Achievement {
  id: string;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: any;
}

export interface Certificate {
  id: string;
  quizId: string;
  quizName: string;
  userName: string;
  score: number;
  percentage: number;
  completedAt: any;
}
