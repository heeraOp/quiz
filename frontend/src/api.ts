import axios, { AxiosError, AxiosRequestConfig } from "axios";

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

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

apiClient.defaults.xsrfCookieName = "csrftoken";
apiClient.defaults.xsrfHeaderName = "X-CSRFToken";

let csrfReady = false;
let csrfPromise: Promise<void> | null = null;

const resetCsrf = () => {
  csrfReady = false;
  csrfPromise = null;
};

const ensureCsrf = async () => {
  if (csrfReady) {
    return;
  }
  if (!csrfPromise) {
    csrfPromise = apiClient
      .get("/auth/csrf/")
      .then(() => {
        csrfReady = true;
      })
      .catch((error) => {
        csrfPromise = null;
        throw error;
      });
  }
  await csrfPromise;
};

const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await apiClient.request<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status ?? 0;
      const data = axiosError.response?.data;
      const message = data?.detail || axiosError.message || "Request failed";
      throw new ApiError(message, status, data);
    }
    throw error;
  }
};

export const api = {
  csrf: () => request<{ detail: string }>({ url: "/auth/csrf/", method: "GET" }),
  login: async (username: string, password: string) => {
    resetCsrf(); // session change: force fresh CSRF before login
    await ensureCsrf();
    return request<UserProfile>({
      url: "/auth/login/",
      method: "POST",
      data: { username, password }
    });
  },
  signup: async (username: string, password: string) => {
    resetCsrf(); // session change: force fresh CSRF before signup
    await ensureCsrf();
    return request<{ success: boolean; username: string; role: UserProfile["role"] }>({
      url: "/auth/signup/",
      method: "POST",
      data: { username, password }
    });
  },
  logout: async () => {
    await ensureCsrf();
    try {
      return await request<{ detail: string }>({ url: "/auth/logout/", method: "POST" });
    } finally {
      resetCsrf(); // session change: clear CSRF after logout
    }
  },
  me: () => request<UserProfile>({ url: "/auth/me/", method: "GET" }),
  listExams: () => request<Exam[]>({ url: "/exams/", method: "GET" }),
  deleteExam: async (examId: number) => {
    await ensureCsrf();
    return request<void>({ url: `/exams/${examId}/`, method: "DELETE" });
  },
  createExam: async (payload: {
    title: string;
    exam_code: string;
    negative_marking_enabled: boolean;
    negative_marks: number;
  }) => {
    await ensureCsrf();
    return request<Exam>({ url: "/exams/", method: "POST", data: payload });
  },
  updateExamSettings: async (
    examId: number,
    payload: {
      is_active?: boolean;
      negative_marking_enabled?: boolean;
      negative_marks?: number;
    }
  ) => {
    await ensureCsrf();
    return request<Exam>({
      url: `/exams/${examId}/status/`,
      method: "PATCH",
      data: payload
    });
  },
  listQuestions: (examId: number) =>
    request<Question[]>({ url: `/exams/${examId}/questions/`, method: "GET" }),
  addQuestion: async (examId: number, payload: Omit<Question, "id">) => {
    await ensureCsrf();
    return request<Question>({
      url: `/exams/${examId}/questions/`,
      method: "POST",
      data: payload
    });
  },
  getResults: (examId: number) =>
    request<Result[]>({ url: `/exams/${examId}/results/`, method: "GET" }),
  joinExam: async (exam_code: string) => {
    await ensureCsrf();
    return request<Attempt>({
      url: "/exams/join/",
      method: "POST",
      data: { exam_code }
    });
  },
  getAttemptQuestions: (attemptId: number) =>
    request<Question[]>({
      url: `/attempts/${attemptId}/questions/`,
      method: "GET"
    }),
  submitAttempt: async (
    attemptId: number,
    answers: { question: number; selected_option: string }[]
  ) => {
    await ensureCsrf();
    return request<Result>({
      url: `/attempts/${attemptId}/submit/`,
      method: "POST",
      data: { answers }
    });
  },
  getAttemptResult: (attemptId: number) =>
    request<Result>({
      url: `/attempts/${attemptId}/result/`,
      method: "GET"
    })
};

export { ApiError };
