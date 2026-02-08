import React from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "../api";

const StudentJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [examCode, setExamCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const attempt = await api.joinExam(examCode.toUpperCase());
      try {
        sessionStorage.setItem(`attempt-${attempt.id}`, JSON.stringify(attempt));
      } catch {
        // Ignore storage errors (private mode, quota, etc.).
      }
      navigate(`/student/exams/${attempt.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to join exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 py-10 text-slate-100 sm:-mx-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-100">Join Exam</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your exam code to begin.</p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Exam Code
            <input
              className="h-12 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 uppercase placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={examCode}
              onChange={(event) => setExamCode(event.target.value)}
              required
            />
          </label>
          {error ? (
            error === "Already attempted." ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                You have already attempted this exam.
              </div>
            ) : (
              <p className="text-sm font-medium text-rose-400">{error}</p>
            )
          ) : null}
          <button
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
            type="submit"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Exam"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentJoinPage;
