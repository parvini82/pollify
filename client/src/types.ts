export type Id = string
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE' | 'RATING'
export type ConditionalOperator = 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN'
export type ConditionalAction = 'GO_TO' | 'SKIP_TO' | 'END_SURVEY'
export type UserRole = 'ADMIN' | 'USER'

export interface Choice { 
  id: Id; 
  label: string; 
  value: string; 
  order: number 
}

// Base interface for all logic rules
export interface BaseLogicRule {
  id: Id;
  dependsOnQuestionId: string;
  operator: ConditionalOperator;
  value: string;
  order: number;
}

// Rule for showing/hiding questions
export interface VisibilityRule extends BaseLogicRule {
  type: 'VISIBILITY';
  subjectQuestionId: string; // The question to show/hide
  showQuestion: boolean; // true = show when condition met, false = hide when condition met
}

// Rule for navigation (skip logic)
export interface NavigationRule extends BaseLogicRule {
  type: 'NAVIGATION';
  fromQuestionId: string; // The question that triggers the navigation
  action: ConditionalAction;
  targetQuestionId?: string; // Required for GO_TO/SKIP_TO actions
}

export type LogicRule = VisibilityRule | NavigationRule;

// Legacy interface for backward compatibility
export interface ConditionalLogic {
  id: Id;
  dependsOnQuestionId: string;
  operator: ConditionalOperator;
  value: string;
  action: ConditionalAction;
  targetQuestionId?: string;
  showQuestion: boolean;
  order: number;
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
  conditionalLogic: ConditionalLogic[]; // Keep for backward compatibility
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
  logicRules?: LogicRule[]; // New centralized logic rules
  _count?: { responses: number };
  createdAt?: string;
  createdBy?: {
    name: string;
    email: string;
  };
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
  submittedBy?: {
    name: string;
    email: string;
  };
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

export interface User {
  id: Id;
  email: string;
  name?: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}
