import React from "react";
import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./AuthContext";
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CreateExamPage from "./pages/CreateExamPage";
import AddQuestionsPage from "./pages/AddQuestionsPage";
import TeacherResultsPage from "./pages/TeacherResultsPage";
import StudentJoinPage from "./pages/StudentJoinPage";
import StudentExamPage from "./pages/StudentExamPage";
import StudentResultPage from "./pages/StudentResultPage";

const RequireAuth: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="page">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const RequireRole: React.FC<{ role: "TEACHER" | "STUDENT" }> = ({ role }) => {
  const { user } = useAuth();
  if (!user) {
    return null;
  }
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 w-full border-b border-slate-800 bg-slate-950">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link className="text-lg font-semibold text-slate-100" to="/">
              School Quiz
            </Link>
            <nav className="hidden items-center gap-4 sm:flex">
              {user?.role === "TEACHER" ? (
                <>
                  <NavLink
                    to="/teacher"
                    className={({ isActive }) =>
                      `border-b-2 px-1 py-1 text-sm font-medium ${
                        isActive
                          ? "border-indigo-400 text-indigo-300"
                          : "border-transparent text-slate-300 hover:text-slate-100"
                      }`
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/teacher/exams/new"
                    className={({ isActive }) =>
                      `border-b-2 px-1 py-1 text-sm font-medium ${
                        isActive
                          ? "border-indigo-400 text-indigo-300"
                          : "border-transparent text-slate-300 hover:text-slate-100"
                      }`
                    }
                  >
                    Create Exam
                  </NavLink>
                </>
              ) : (
                <NavLink
                  to="/student/join"
                  className={({ isActive }) =>
                    `border-b-2 px-1 py-1 text-sm font-medium ${
                      isActive
                        ? "border-indigo-400 text-indigo-300"
                        : "border-transparent text-slate-300 hover:text-slate-100"
                    }`
                  }
                >
                  Join Exam
                </NavLink>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-200">
              {user?.username}
              <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                {user?.role}
              </span>
            </span>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-indigo-400 hover:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Navigate to={user.role === "TEACHER" ? "/teacher" : "/student/join"} replace />
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<RequireRole role="TEACHER" />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/exams/new" element={<CreateExamPage />} />
          <Route path="/teacher/exams/:examId/questions" element={<AddQuestionsPage />} />
          <Route path="/teacher/exams/:examId/results" element={<TeacherResultsPage />} />
        </Route>
        <Route element={<RequireRole role="STUDENT" />}>
          <Route path="/student/join" element={<StudentJoinPage />} />
          <Route path="/student/exams/:attemptId" element={<StudentExamPage />} />
          <Route path="/student/results/:attemptId" element={<StudentResultPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
