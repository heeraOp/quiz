import React from "react";
import { useParams } from "react-router-dom";

import { api, ApiError } from "../api";
import type { Question } from "../types";

const AddQuestionsPage: React.FC = () => {
  const params = useParams();
  const examId = Number(params.examId);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [questionText, setQuestionText] = React.useState("");
  const [optionA, setOptionA] = React.useState("");
  const [optionB, setOptionB] = React.useState("");
  const [optionC, setOptionC] = React.useState("");
  const [optionD, setOptionD] = React.useState("");
  const [optionE, setOptionE] = React.useState("");
  const [correctOption, setCorrectOption] = React.useState("A");
  const [marks, setMarks] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const loadQuestions = React.useCallback(async () => {
    if (!examId) {
      setError("Invalid exam id.");
      setLoading(false);
      return;
    }
    try {
      const data = await api.listQuestions(examId);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load questions.");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  React.useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const resetForm = () => {
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setOptionE("");
    setCorrectOption("A");
    setMarks(1);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!optionE && correctOption === "E") {
      setFormError("Add an option E before selecting it as correct.");
      return;
    }

    setSaving(true);
    try {
      await api.addQuestion(examId, {
        exam: examId,
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        option_e: optionE,
        correct_option: correctOption as Question["correct_option"],
        marks
      });
      resetForm();
      await loadQuestions();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to add question.");
    } finally {
      setSaving(false);
    }
  };

  const choiceOptions = ["A", "B", "C", "D", ...(optionE ? ["E"] : [])];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Add Questions</h1>
        <p className="text-sm text-slate-500">Exam ID: {Number.isNaN(examId) ? "-" : examId}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">New Question</h2>
        </div>
        <form className="mt-5 flex flex-col gap-5" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Question Prompt
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Option A
              <input
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={optionA}
                onChange={(event) => setOptionA(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Option B
              <input
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={optionB}
                onChange={(event) => setOptionB(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Option C
              <input
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={optionC}
                onChange={(event) => setOptionC(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Option D
              <input
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={optionD}
                onChange={(event) => setOptionD(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span className="flex items-center gap-2">
                Option E
                <span className="text-xs font-normal text-slate-500">(optional)</span>
              </span>
              <input
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={optionE}
                onChange={(event) => setOptionE(event.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Correct Answer
              <select
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                value={correctOption}
                onChange={(event) => setCorrectOption(event.target.value)}
              >
                {choiceOptions.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Marks
              <input
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                type="number"
                min={1}
                value={marks}
                onChange={(event) => setMarks(Number(event.target.value))}
                required
              />
            </label>
          </div>

          {formError ? <p className="text-sm font-medium text-red-600">{formError}</p> : null}

          <div className="flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Question"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Existing Questions</h2>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-500">Loading...</p> : null}
        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
        <ol className="mt-4 flex flex-col gap-3">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
            >
              <span className="mr-2 font-semibold text-slate-500">{index + 1}.</span>
              {question.question_text}
            </li>
          ))}
        </ol>
        {!loading && questions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No questions yet.</p>
        ) : null}
      </div>
    </div>
  );
};

export default AddQuestionsPage;
