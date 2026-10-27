import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import ManageCourses from "./pages/admin/ManageCourses";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ExaminerDashboard from "./pages/examiner/ExaminerDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ManageExaminers from "./pages/admin/ManageExaminers";
import ManageExaminations from "./pages/admin/ManageExaminations";
import ManageSlots from "./pages/examiner/ManageSlots";
function Unauthorized() {
  return (
    <main className="simple-page">
      <h1>Access denied</h1>
      <p>You don't have permission to access this page.</p>
      <a href="/login">Return to login</a>
    </main>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>This section will be connected to the backend in the next step.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/courses" element={<ManageCourses />} />
          <Route
            path="/admin/examinations"
            element={<ManageExaminations />}
          />
          <Route
            path="/admin/examiners"
            element={<ManageExaminers />}
          />
          <Route
            path="/admin/results"
            element={<ComingSoon title="Manage Results" />}
          />
        </Route>
      </Route>

      {/* Examiner routes */}
      <Route element={<ProtectedRoute allowedRoles={["examiner"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/examiner" element={<ExaminerDashboard />} />
          <Route path="/examiner/slots" element={<ManageSlots />} />
          <Route
            path="/examiner/evaluate"
            element={<ComingSoon title="Evaluate Students" />}
          />
        </Route>
      </Route>

      {/* Student routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route
            path="/student/examinations"
            element={<ComingSoon title="Available Examinations" />}
          />
          <Route
            path="/student/bookings"
            element={<ComingSoon title="My Bookings" />}
          />
          <Route
            path="/student/results"
            element={<ComingSoon title="My Results" />}
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <main className="simple-page">
            <h1>404 — Page not found</h1>
            <button
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Return to login
            </button>
          </main>
        }
      />
    </Routes>
  );
}
