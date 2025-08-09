export type Id = string
export type QuestionType = 'TEXT' | 'MULTIPLE_CHOICE'
export interface Choice { id: Id; label: string; value: string; order: number }
export interface Question { id: Id; title: string; type: QuestionType; required: boolean; order: number; choices: Choice[] }
export interface Form { id: Id; title: string; description?: string|null; isPublic: boolean; questions: Question[]; _count?: { responses: number } }
