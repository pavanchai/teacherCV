export type GradeLevel =
  | "PRIMARY_1_5"
  | "UPPER_PRIMARY_6_8"
  | "SECONDARY_9_10"
  | "SR_SECONDARY_11_12";

export type Subject =
  | "Mathematics"
  | "Science"
  | "Physics"
  | "Chemistry"
  | "Biology"
  | "English"
  | "Hindi"
  | "Social Science"
  | "History"
  | "Geography"
  | "Political Science"
  | "Economics"
  | "Computer Science"
  | "Physical Education"
  | "Art & Craft"
  | "Music"
  | "General";

export interface CBSEBenchmark {
  gradeLevel: GradeLevel;
  gradeLevelLabel: string;
  subjects: SubjectBenchmark[];
}

export interface SubjectBenchmark {
  subject: string;
  minQualification: string;
  preferredQualification: string;
  requiredCertifications: string[];
  minExperienceYears: number;
  description: string;
}

export interface EvaluationResult {
  overallScore: number;
  qualificationScore: number;
  experienceScore: number;
  subjectScore: number;
  softSkillScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: "STRONGLY_RECOMMENDED" | "RECOMMENDED" | "CONSIDER" | "NOT_RECOMMENDED";
  meetsBenchmark: boolean;
  aiSummary: string;
  detailedAnalysis: string;
}

export interface ParsedCV {
  name: string;
  email: string;
  phone?: string;
  text: string;
  qualifications: string[];
  experience: string[];
  subjects: string[];
  certifications: string[];
}

export interface PositionFormData {
  title: string;
  subject: string;
  gradeLevel: string;
  description?: string;
  requirements: string;
  minQualification: string;
  experience: number;
  benchmark: string;
}

export interface CandidateWithEval {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cvFileName?: string | null;
  linkedinUrl?: string | null;
  evaluations: EvalSummary[];
  createdAt: Date | string;
}

export interface EvalSummary {
  id: string;
  positionId: string;
  overallScore: number;
  qualificationScore: number;
  experienceScore: number;
  subjectScore: number;
  softSkillScore: number;
  strengths: string;
  weaknesses: string;
  recommendation: string;
  meetsBenchmark: boolean;
  aiSummary: string;
  createdAt: Date | string;
}

export interface CompareCandidate {
  candidate: CandidateWithEval;
  eval: EvalSummary;
}
