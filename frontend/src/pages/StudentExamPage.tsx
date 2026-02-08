import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { api, ApiError } from "../api";
import type { Attempt, Question } from "../types";

const StudentExamPage: React.FC = () => {
  const params = useParams();
  const attemptId = Number(params.attemptId);
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attemptInfo, setAttemptInfo] = React.useState<Attempt | null>(() => {
    const state = location.state as { attempt?: Attempt } | null;
    if (state?.attempt) {
      return state.attempt;
    }
    return null;
  });

  React.useEffect(() => {
    if (attemptInfo || !attemptId) {
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
  }, [attemptId, attemptInfo]);

  React.useEffect(() => {
    const load = async () => {
      if (!attemptId) {
        setError("Invalid attempt id.");
        setLoading(false);
        return;
      }
      try {
        const existing = await api.getAttemptResult(attemptId);
        navigate(`/student/results/${attemptId}`, { state: existing, replace: true });
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status !== 404) {
          setError(err.message);
          setLoading(false);
          return;
        }
      }

      try {
        const data = await api.getAttemptQuestions(attemptId);
        setQuestions(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load exam.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId, navigate]);

  React.useEffect(() => {
    if (questions.length === 0) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [questions.length]);

  const onSelect = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const payload = questions.map((question) => ({
        question: question.id,
        selected_option: answers[question.id]
      }));
      const result = await api.submitAttempt(attemptId, payload);
      navigate(`/student/results/${attemptId}`, { state: result });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to submit exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter((key) => answers[Number(key)]).length;
  const currentIndex = Math.max(
    0,
    questions.findIndex((question) => !answers[question.id])
  );
  const progressIndex = totalQuestions > 0 ? Math.min(currentIndex + 1, totalQuestions) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-400">Exam</span>
            <h1 className="text-base font-semibold text-slate-100">
              {attemptInfo?.exam_title ?? "Student Exam"}
            </h1>
          </div>
          <div className="text-sm text-slate-300">
            {totalQuestions > 0
              ? `Question ${progressIndex} of ${totalQuestions}`
              : "Preparing questions"}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        {loading ? <p className="text-sm text-slate-400">Loading questions...</p> : null}
        {error ? <p className="text-sm font-medium text-rose-400">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-6">
          {questions.map((question, index) => (
            <div
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              key={question.id}
            >
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>
                  Question {index + 1} of {totalQuestions}
                </span>
                <span>{answeredCount} answered</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-100">
                {question.question_text}
              </h3>
              {attemptInfo?.exam_negative_marking_enabled ? (
                <p className="mt-2 text-xs font-medium text-amber-300/80">
                  Negative marking is enabled for this exam.
                </p>
              ) : null}

              <div className="mt-5 flex flex-col gap-3">
                {([
                  ["A", question.option_a],
                  ["B", question.option_b],
                  ["C", question.option_c],
                  ["D", question.option_d],
                  ["E", question.option_e]
                ] as [string, string][])
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <label
                      key={label}
                      className="group flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 hover:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500"
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={label}
                        checked={answers[question.id] === label}
                        onChange={() => onSelect(question.id, label)}
                        className="mt-1 h-4 w-4 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span className="leading-relaxed">
                        <span className="mr-2 font-semibold text-slate-300">{label}.</span>
                        {value}
                      </span>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
            onClick={onSubmit}
            disabled={loading || !allAnswered || submitting}
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentExamPage;
