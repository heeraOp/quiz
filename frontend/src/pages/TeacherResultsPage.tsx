import React from "react";
import { useParams } from "react-router-dom";

import { api, ApiError } from "../api";
import type { Result } from "../types";

const TeacherResultsPage: React.FC = () => {
  const params = useParams();
  const examId = Number(params.examId);
  const [results, setResults] = React.useState<Result[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const firstResult = results[0] as (Result & { exam_code?: string }) | undefined;
  const examCode = firstResult?.exam_code ?? String(examId);

  const exportCsv = () => {
    if (results.length === 0) {
      return;
    }
    const escapeValue = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };
    const header = ["Student", "Obtained Marks", "Total Marks", "Graded At"]
      .map(escapeValue)
      .join(",");
    const rows = results.map((result) =>
      [
        result.student_username ?? "",
        result.obtained_marks,
        result.total_marks,
        result.graded_at
      ]
        .map(escapeValue)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `exam-results-${examCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    const load = async () => {
      if (!examId) {
        setError("Invalid exam id.");
        setLoading(false);
        return;
      }
      try {
        const data = await api.getResults(examId);
        setResults(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load results.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [examId]);

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-10 text-slate-100 sm:-mx-6 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Exam Results</h1>
          <p className="mt-1 text-sm text-slate-300">
            Exam ID: {Number.isNaN(examId) ? "-" : examId}
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
          type="button"
          onClick={exportCsv}
          disabled={loading || results.length === 0}
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-sm sm:p-8">
        {loading ? <p className="text-sm text-slate-300">Loading results...</p> : null}
        {error ? <p className="text-sm font-medium text-rose-300">{error}</p> : null}

        {!loading && results.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-6 text-sm text-slate-200">
            No results submitted yet.
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/50">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-800/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-200">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={`${result.student_username}-${index}`}
                    className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-100">
                      {result.student_username}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-100">
                      {result.obtained_marks} / {result.total_marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
};

export default TeacherResultsPage;
