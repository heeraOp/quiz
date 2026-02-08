import React from "react";
import { Link } from "react-router-dom";

import { api, ApiError } from "../api";
import type { Exam } from "../types";

type ExamResult = {
  obtained_marks?: string | number;
  total_marks?: string | number;
};

const getExamStatus = (exam: Exam) => {
  const hasClosedFlag =
    "is_closed" in exam && Boolean((exam as Exam & { is_closed?: boolean }).is_closed);
  if (hasClosedFlag) {
    return {
      label: "CLOSED",
      classes: "bg-amber-50 text-amber-700 ring-amber-200"
    };
  }
  if (exam.is_active) {
    return {
      label: "LIVE",
      classes: "bg-emerald-50 text-emerald-700 ring-emerald-200"
    };
  }
  return {
    label: "DRAFT",
    classes: "bg-slate-100 text-slate-700 ring-slate-200"
  };
};

const TeacherDashboard: React.FC = () => {
  const [exams, setExams] = React.useState<Exam[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [settings, setSettings] = React.useState<
    Record<number, { enabled: boolean; negativeMarks: number }>
  >({});
  const [savingId, setSavingId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [closingId, setClosingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listExams();
        setExams(data);
        const nextSettings: Record<number, { enabled: boolean; negativeMarks: number }> = {};
        data.forEach((exam) => {
          nextSettings[exam.id] = {
            enabled: exam.negative_marking_enabled,
            negativeMarks: Number(exam.negative_marks)
          };
        });
        setSettings(nextSettings);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load exams.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSetting = (
    examId: number,
    changes: Partial<{ enabled: boolean; negativeMarks: number }>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [examId]: { ...prev[examId], ...changes }
    }));
  };

  const saveSettings = async (examId: number) => {
    const current = settings[examId];
    if (!current) {
      return;
    }
    setSavingId(examId);
    setError(null);
    try {
      const updated = await api.updateExamSettings(examId, {
        negative_marking_enabled: current.enabled,
        negative_marks: current.enabled ? current.negativeMarks : 0
      });
      setExams((prev) => prev.map((exam) => (exam.id === examId ? updated : exam)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update exam.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteExam = async (examId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this exam? This action cannot be undone."
    );
    if (!confirmed) {
      return;
    }
    setDeletingId(examId);
    setError(null);
    try {
      await api.deleteExam(examId);
      setExams((prev) => prev.filter((exam) => exam.id !== examId));
      setSettings((prev) => {
        const next = { ...prev };
        delete next[examId];
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to delete exam.");
    } finally {
      setDeletingId(null);
    }
  };

  const closeExam = async (examId: number) => {
    setClosingId(examId);
    setError(null);
    try {
      const updated = await api.updateExamSettings(examId, { is_active: false });
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === examId ? ({ ...updated, is_closed: true } as Exam) : exam
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to close exam.");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Teacher Dashboard</h1>
          <p className="text-sm text-slate-500">Manage exams, settings, and results.</p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          to="/teacher/exams/new"
        >
          Create Exam
        </Link>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading exams...</p> : null}
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-6">
        {exams.map((exam) => {
          const status = getExamStatus(exam);
          const hasQuestions = (exam.question_count ?? 0) > 0;
          const primaryAction = hasQuestions
            ? { label: "View Results", to: `/teacher/exams/${exam.id}/results` }
            : { label: "Add Questions", to: `/teacher/exams/${exam.id}/questions` };
          const secondaryAction = hasQuestions
            ? { label: "Add Questions", to: `/teacher/exams/${exam.id}/questions` }
            : { label: "View Results", to: `/teacher/exams/${exam.id}/results` };
          const isDraft = status.label === "DRAFT";
          const settingsLocked = !isDraft;
          const settingsEnabled = settings[exam.id]?.enabled ?? false;
          const resultsArray = Array.isArray(
            (exam as Exam & { results?: ExamResult[] }).results
          )
            ? (exam as Exam & { results?: ExamResult[] }).results
            : null;
          const resultsCount = resultsArray ? resultsArray.length : null;
          const averageScore =
            resultsArray && resultsArray.length > 0
              ? resultsArray.reduce((sum, entry) => {
                  const obtained = Number(
                    (entry as { obtained_marks?: string | number }).obtained_marks ?? 0
                  );
                  return sum + (Number.isNaN(obtained) ? 0 : obtained);
                }, 0) / resultsArray.length
              : resultsArray
                ? 0
                : null;

          return (
            <section
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={exam.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{exam.title}</h2>
                  <p className="text-sm text-slate-500">Created exam settings and results.</p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.classes}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Exam Code
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {exam.exam_code}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(exam.exam_code).catch(() => {});
                        }
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                      aria-label="Copy exam code"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 7.5V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1.5M8 7.5H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-1.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Questions
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {exam.question_count ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total Marks
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {exam.total_marks}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Negative Marking
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {exam.negative_marking_enabled ? "On" : "Off"}
                  </p>
                </div>
              </div>
              {resultsCount !== null ? (
                <p className="mt-3 text-sm text-slate-500">
                  Students attempted: {resultsCount}
                  {averageScore !== null ? ` · Average score: ${averageScore.toFixed(2)}` : ""}
                </p>
              ) : null}

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Negative Marking Settings
                    </h3>
                    <p className="text-sm text-slate-500">
                      Wrong answers deduct this value. Unattempted questions score 0.
                    </p>
                  </div>
                  {!isDraft ? (
                    <p className="text-xs font-medium text-slate-500">
                      Settings are locked once the exam is live.
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      checked={settingsEnabled}
                      onChange={(event) =>
                        updateSetting(exam.id, { enabled: event.target.checked })
                      }
                      disabled={settingsLocked}
                    />
                    Enable Negative Marking
                  </label>

                  {settingsEnabled ? (
                    <label className="flex w-full flex-col gap-2 text-sm font-medium text-slate-700 sm:max-w-xs">
                      Negative Marks (per wrong answer)
                      <input
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100"
                        type="number"
                        min={0}
                        step={0.01}
                        value={settings[exam.id]?.negativeMarks ?? 0}
                        onChange={(event) =>
                          updateSetting(exam.id, {
                            negativeMarks: Number(event.target.value)
                          })
                        }
                        disabled={settingsLocked}
                        required={settingsEnabled}
                      />
                    </label>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  to={primaryAction.to}
                >
                  {primaryAction.label}
                </Link>
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  type="button"
                  disabled={savingId === exam.id || settingsLocked || deletingId === exam.id}
                  onClick={() => saveSettings(exam.id)}
                >
                  {savingId === exam.id ? "Saving..." : "Save Settings"}
                </button>
                <Link
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
                  to={secondaryAction.to}
                >
                  {secondaryAction.label}
                </Link>
                {exam.is_active ? (
                  <button
                    className="inline-flex items-center justify-center rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:border-amber-300 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-amber-200 disabled:text-amber-300"
                    type="button"
                    disabled={closingId === exam.id}
                    onClick={() => closeExam(exam.id)}
                  >
                    {closingId === exam.id ? "Closing..." : "Close Exam"}
                  </button>
                ) : null}
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-rose-200 disabled:text-rose-300"
                  type="button"
                  disabled={deletingId === exam.id || exam.is_active}
                  onClick={() => deleteExam(exam.id)}
                  title={exam.is_active ? "Close exam before deleting" : undefined}
                >
                  {deletingId === exam.id ? "Deleting..." : "Delete Exam"}
                </button>
              </div>
            </section>
          );
        })}
        {!loading && exams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">No exams yet. Create your first exam.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TeacherDashboard;
