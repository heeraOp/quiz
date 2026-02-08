import React from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "../api";

const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState("");
  const [examCode, setExamCode] = React.useState("");
  const [negativeEnabled, setNegativeEnabled] = React.useState(false);
  const [negativeMarks, setNegativeMarks] = React.useState(0.25);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const exam = await api.createExam({
        title,
        exam_code: examCode,
        negative_marking_enabled: negativeEnabled,
        negative_marks: negativeEnabled ? negativeMarks : 0
      });
      navigate(`/teacher/exams/${exam.id}/questions`, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 text-slate-100">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-100">Create Exam</h1>
          <p className="text-sm text-slate-400">Set up the basics before adding questions.</p>
        </div>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Exam Title
            <input
              className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Exam Code
            <input
              className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={examCode}
              onChange={(event) => setExamCode(event.target.value.toUpperCase())}
              required
            />
          </label>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                checked={negativeEnabled}
                onChange={(event) => setNegativeEnabled(event.target.checked)}
              />
              Enable Negative Marking
            </label>
            <div className="mt-4 flex flex-col gap-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
                Negative Marks (per wrong answer)
                <input
                  className="h-11 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  type="number"
                  min={0}
                  step={0.01}
                  value={negativeMarks}
                  onChange={(event) => setNegativeMarks(Number(event.target.value))}
                  disabled={!negativeEnabled}
                  required={negativeEnabled}
                />
              </label>
              <span className="text-xs text-slate-500">
                Wrong answers deduct this value. Unattempted questions score 0.
              </span>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-rose-400">{error}</p> : null}

          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamPage;
