import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { api, ApiError } from "../api";
import type { Attempt, Result } from "../types";

const StudentResultPage: React.FC = () => {
  const params = useParams();
  const attemptId = Number(params.attemptId);
  const location = useLocation();
  const [result, setResult] = React.useState<Result | null>(() => {
    const state = location.state as Result | null;
    return state || null;
  });
  const [attemptInfo, setAttemptInfo] = React.useState<Attempt | null>(null);
  const [loading, setLoading] = React.useState(!result);
  const [error, setError] = React.useState<string | null>(null);
  const breakdown = result
    ? (result as Result & {
        correct_answers?: number;
        wrong_answers?: number;
        unattempted_questions?: number;
      })
    : null;
  const hasBreakdown =
    breakdown &&
    typeof breakdown.correct_answers === "number" &&
    typeof breakdown.wrong_answers === "number" &&
    typeof breakdown.unattempted_questions === "number";

  React.useEffect(() => {
    const load = async () => {
      if (!attemptId || result) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getAttemptResult(attemptId);
        setResult(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load result.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, result]);

  React.useEffect(() => {
    if (!attemptId) {
      return;
    }
    try {
      const stored = sessionStorage.getItem(`attempt-${attemptId}`);
      if (stored) {
        setAttemptInfo(JSON.parse(stored) as Attempt);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [attemptId]);

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100 sm:-mx-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-100">Result</h1>
            <span className="text-xs font-medium text-slate-400">
              {attemptInfo?.exam_title ?? "Exam Completed"}
            </span>
          </div>

          {loading ? <p className="mt-4 text-sm text-slate-400">Loading result...</p> : null}
          {error ? <p className="mt-4 text-sm font-medium text-rose-400">{error}</p> : null}

          {result ? (
            <div className="mt-6 flex flex-col gap-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-sm text-slate-400">You scored</p>
                <div className="mt-2 text-3xl font-semibold text-slate-100">
                  {result.obtained_marks} / {result.total_marks}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Score posted immediately after submission.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                <h2 className="text-sm font-semibold text-slate-200">Score Breakdown</h2>
                {hasBreakdown ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-xs text-slate-400">Correct answers</p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {breakdown.correct_answers}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-xs text-slate-400">Wrong answers</p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {breakdown.wrong_answers}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                      <p className="text-xs text-slate-400">Unattempted</p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {breakdown.unattempted_questions}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Detailed answer breakdown is not available for this exam.
                  </p>
                )}
              </div>

              {attemptInfo?.exam_negative_marking_enabled ? (
                <p className="text-xs text-slate-400">
                  Negative marking was applied in this exam.
                </p>
              ) : null}

              <div className="flex justify-end">
                <Link
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  to="/student/join"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default StudentResultPage;
