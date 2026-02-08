import React from "react";
import { useNavigate } from "react-router-dom";

import { api, ApiError } from "../api";
import { useAuth } from "../AuthContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<"login" | "signup">("login");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const response = await api.signup(username, password);
        setUser({ username: response.username, role: response.role });
        navigate("/student/join", { replace: true });
      } else {
        const user = await api.login(username, password);
        setUser(user);
        navigate(user.role === "TEACHER" ? "/teacher" : "/student/join", {
          replace: true
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(mode === "signup" ? "Unable to sign up." : "Unable to login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-100">
            {mode === "signup" ? "Create account" : "Sign in"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "signup"
              ? "Create a new student account."
              : "Sign in as student or teacher."}
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Username
            <input
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            Password
            <input
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm font-medium text-rose-400">{error}</p> : null}
          <button
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700"
            type="submit"
            disabled={loading}
          >
            {loading
              ? mode === "signup"
                ? "Creating account..."
                : "Signing in..."
              : mode === "signup"
                ? "Sign Up"
                : "Login"}
          </button>
        </form>
        <div className="mt-6 text-center">
          {mode === "signup" ? (
            <button
              className="text-sm font-medium text-slate-400 hover:text-slate-200"
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Already have an account? Log in
            </button>
          ) : (
            <button
              className="text-sm font-medium text-slate-400 hover:text-slate-200"
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              New user? Sign up
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
