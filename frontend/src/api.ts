import type { Attempt, Exam, Question, Result, UserProfile } from "./types";

class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const API_BASE =
  import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE ?? "/api";

const getCookie = (name: string) => {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : "";
};

const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined)
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (options.method && options.method !== "GET") {
    const csrf = getCookie("csrftoken");
    if (csrf) {
      headers["X-CSRFToken"] = csrf;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const message = data?.detail || "Request failed";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
};

export const api = {
  csrf: () => request<{ detail: string }>("/auth/csrf/"),
  login: (username: string, password: string) =>
    request<UserProfile>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password })
    }),
  signup: (username: string, password: string) =>
    request<{ success: boolean; username: string; role: UserProfile["role"] }>(
      "/auth/signup/",
      {
        method: "POST",
        body: JSON.stringify({ username, password })
      }
    ),
  logout: () => request<{ detail: string }>("/auth/logout/", { method: "POST" }),
  me: () => request<UserProfile>("/auth/me/"),
  listExams: () => request<Exam[]>("/exams/"),
  deleteExam: (examId: number) =>
    request<void>(`/exams/${examId}/`, { method: "DELETE" }),
  createExam: (payload: {
    title: string;
    exam_code: string;
    negative_marking_enabled: boolean;
    negative_marks: number;
  }) =>
    request<Exam>("/exams/", { method: "POST", body: JSON.stringify(payload) }),
  updateExamSettings: (
    examId: number,
    payload: {
      is_active?: boolean;
      negative_marking_enabled?: boolean;
      negative_marks?: number;
    }
  ) =>
    request<Exam>(`/exams/${examId}/status/`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  listQuestions: (examId: number) =>
    request<Question[]>(`/exams/${examId}/questions/`),
  addQuestion: (examId: number, payload: Omit<Question, "id">) =>
    request<Question>(`/exams/${examId}/questions/`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getResults: (examId: number) =>
    request<Result[]>(`/exams/${examId}/results/`),
  joinExam: (exam_code: string) =>
    request<Attempt>("/exams/join/", {
      method: "POST",
      body: JSON.stringify({ exam_code })
    }),
  getAttemptQuestions: (attemptId: number) =>
    request<Question[]>(`/attempts/${attemptId}/questions/`),
  submitAttempt: (
    attemptId: number,
    answers: { question: number; selected_option: string }[]
  ) =>
    request<Result>(`/attempts/${attemptId}/submit/`, {
      method: "POST",
      body: JSON.stringify({ answers })
    }),
  getAttemptResult: (attemptId: number) =>
    request<Result>(`/attempts/${attemptId}/result/`)
};

export { ApiError };
