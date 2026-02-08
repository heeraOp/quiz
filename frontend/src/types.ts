export type Role = "TEACHER" | "STUDENT";

export type UserProfile = {
  username: string;
  role: Role;
};

export type Exam = {
  id: number;
  title: string;
  exam_code: string;
  is_active: boolean;
  negative_marking_enabled: boolean;
  negative_marks: number;
  total_marks: number;
  created_at: string;
  question_count?: number;
};

export type Question = {
  id: number;
  exam?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option?: "A" | "B" | "C" | "D" | "E";
  marks?: number;
};

export type Attempt = {
  id: number;
  exam: number;
  exam_title: string;
  exam_code: string;
  exam_negative_marking_enabled?: boolean;
  exam_negative_marks?: string;
  started_at: string;
  submitted_at: string | null;
};

export type Result = {
  student_username?: string;
  total_marks: string;
  obtained_marks: string;
  graded_at: string;
};
