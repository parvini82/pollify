export type Id = string
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'RATING'
export type ConditionalOperator = 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN'

export interface Choice { 
  id: Id; 
  label: string; 
  value: string; 
  order: number 
}

export interface ConditionalLogic {
  id: Id;
  dependsOnQuestionId: string;
  operator: ConditionalOperator;
  value: string;
  skipToQuestionId?: string;
  showQuestion: boolean;
}

export interface Question { 
  id: Id; 
  title: string; 
  type: QuestionType; 
  required: boolean; 
  order: number; 
  minRating?: number;
  maxRating?: number;
  ratingLabels?: string;
  conditionalLogic?: ConditionalLogic;
  choices: Choice[] 
}

export interface Form { 
  id: Id; 
  title: string; 
  description?: string|null; 
  isPublic: boolean; 
  maxResponses?: number;
  allowMultipleResponses: boolean;
  questions: Question[]; 
  _count?: { responses: number };
  createdAt?: string;
}

export interface ResponseItem {
  id: Id;
  questionId: Id;
  valueText?: string;
  valueChoiceId?: string;
  valueRating?: number;
  timeSpent?: number;
  changedAnswers: number;
}

export interface Response {
  id: Id;
  formId: Id;
  submittedAt: string;
  totalTime?: number;
  items: ResponseItem[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}

export interface BehavioralAnalysis {
  averageTimePerQuestion: { [questionId: string]: number };
  questionChangeRates: { [questionId: string]: number };
  timeDistribution: { [questionId: string]: { min: number; max: number; avg: number } };
  completionRates: { [questionId: string]: number };
}
