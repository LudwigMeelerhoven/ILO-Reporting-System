
export interface ConventionProtocol {
  id: string; // e.g., "C.155"
  name: string; // e.g., "C.155 / P.155"
  isActive?: boolean; // For UI state
}

export interface ThematicArea {
  id: number;
  title: string;
  conventions: string[]; // Raw strings from requirements
  processedConventions?: ConventionProtocol[]; // For UI state
}

export interface QuestionContent {
  id: string; // e.g., "R001"
  text: string;
  provisions?: string; // e.g. "Articles 2, 4 and 5 C102 - Articles 2, 3 and 5 C128 Guidance"
  hasGuidance?: boolean;
}

export interface QuestionSubSection {
  title: string;
  topic?: string;
  questions: QuestionContent[];
}

export interface QuestionSection {
  title: string;
  introduction?: string;
  subSections: QuestionSubSection[];
}

export interface Answer {
  value: string;
  isUpdated: boolean;
  ceacrSession?: string; // Added to store CEACR session
  legalAnalysis?: string; // Added for ILO staff legal analysis
  dlcComment?: string;
  governmentReply?: string;
  q010StaticCeacrReply?: string; // For Q010 specific CEACR comment reply
  q010StaticCeacrReplyUpdated?: boolean; // Status for Q010 specific CEACR comment reply
  q146PendingCommentReplyUpdated?: boolean; // Status for Q146 pending comment reply
  followUpCasReply?: string; // For the new CAS follow-up section reply
  followUpCasReplyUpdated?: boolean; // Status for the new CAS follow-up section reply
}

export interface AnswersState {
  [questionId: string]: Answer;
}

export enum Page {
  Login = 'login',
  Landing = 'landing',
  Questionnaire = 'questionnaire',
}