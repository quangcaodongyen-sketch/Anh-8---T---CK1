
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  ORDERING = 'ORDERING',
  ERROR_ID = 'ERROR_ID'
}

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  choices?: Choice[];
  correctAnswer: string;
  explanation?: string;
}

export interface QuizSession {
  title: string;
  description: string;
  listeningScript?: string;
  isMultiSpeaker?: boolean;
  speakerConfigs?: { speaker: string; voice: string }[];
  questions: Question[];
}

export enum AppState {
  WELCOME = 'WELCOME',
  PART_1 = 'PART_1', // Listening 1
  PART_2 = 'PART_2', // Listening 2 + 45 MC Questions
  SUMMARY = 'SUMMARY'
}
