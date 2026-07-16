export interface Cabinet {
  id: string;
  name: string;
  classRangeStart: number;
  classRangeEnd: number;
  enabled: boolean;
}

export interface Post {
  id: string;
  cabinetId: string;
  title: string;
  vacancies: number;
  genderRule: 'boy' | 'girl' | 'any';
  eligibleClasses: number[]; // e.g. [11] for Class XI, [6,7,8,9,10,11] for all senior
  enabled: boolean;
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  maxMarks: number;
  enabled: boolean;
  description: string;
}

export interface AchievementMatrixItem {
  level: 'School' | 'District' | 'State' | 'National';
  rank: 'Gold' | 'Silver' | 'Bronze';
  marks: number;
}

export interface Achievement {
  level: 'School' | 'District' | 'State' | 'National';
  rank: 'Gold' | 'Silver' | 'Bronze';
  title: string;
  year: string;
  certFileName?: string;
  certData?: string; // base64 representation of certificate file
}

export interface StudentApplication {
  id: string;
  name: string;
  admissionNumber: string;
  class: number;
  section: string;
  rollNumber: string;
  gender: 'Boy' | 'Girl';
  dob: string;
  admissionDate: string;
  house: 'Radhakrishnan' | 'Tagore' | 'Vivekanand' | 'Teresa';
  mobile: string;
  parentName: string;
  parentMobile: string;
  email: string;
  photo?: string; // base64 or URL
  leadershipExperience: string;
  achievements: Achievement[];
  firstChoicePostId: string;
  secondChoicePostId: string;
  sop: string;
  declaration: boolean;
  submittedAt: string;
  status: 'Pending' | 'Interview Scheduled' | 'Under Evaluation' | 'Selected' | 'Waitlisted' | 'Rejected';
  interviewDate?: string;
  interviewTime?: string;
  
  // Evaluation scores
  interviewMarks?: number; // 0-10
  attendancePercentage?: number; // average % last 3 years, e.g. 94.5
  attendanceMarks?: number; // 0-10
  academicMarks?: number; // 0-10
  yearsInSchool?: number; // derived
  yearsScore?: number; // 0-10
  achievementScore?: number; // 0-10
  disciplineMarks?: number; // 0-10
  finalScore?: number; // 0-50 (or dynamic based on criteria sum)
  remarks?: string;
  recommendation?: 'Highly Recommended' | 'Recommended' | 'Waitlisted' | 'Not Recommended';
  
  // Dynamic metrics / ranking
  rankOverall?: number;
  rankPost?: number;
  rankHouse?: number;
  rankGender?: number;

  // AI-generated analysis
  aiRecommendation?: {
    strengths: string[];
    weaknesses: string[];
    leadershipScore: number; // 0-100
    confidenceScore: number; // 0-100
    suitabilityScore: number; // 0-100
    recommendationSummary: string;
    tieBreakerVerdict: string;
    riskAnalysis: string;
    generatedAt: string;
  };
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export interface SchoolBranding {
  name: string;
  tagline: string;
  logo: string; // base64 or SVG
  primaryColor: string; // hex
  secondaryColor: string; // hex
  academicSession: string; // e.g. "2026-2027"
  studentPassword?: string;
  teacherPassword?: string;
  adminPassword?: string;
}

export interface SystemConfig {
  cabinets: Cabinet[];
  posts: Post[];
  criteria: EvaluationCriterion[];
  achievementMatrix: AchievementMatrixItem[];
  branding: SchoolBranding;
  applicationDeadline: string;
  otpEnabled?: boolean;
}

export interface RegisteredStudent {
  id: string;
  admissionNumber: string;
  name: string;
  class: number;
  section: string;
  rollNumber?: string;
  gender?: 'Boy' | 'Girl';
}

export interface SupabaseConfig {
  connectionString?: string;
  url?: string;
  anonKey?: string;
  connected: boolean;
  useSupabase: boolean;
  lastSyncedAt?: string;
  error?: string;
}

export interface AppState {
  config: SystemConfig;
  applications: StudentApplication[];
  emailLogs: EmailLog[];
  registeredStudents: RegisteredStudent[];
  supabaseConfig: SupabaseConfig;
}

export function getBackendUrl(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.includes("asia-southeast1.run.app")
  ) {
    return "";
  }
  return "https://ais-pre-6njs6jipxrgcxl7rmcbz37-404659537340.asia-southeast1.run.app";
}
