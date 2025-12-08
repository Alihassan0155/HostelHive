// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/Student/Dashboard';
import MyIssues from './pages/Student/MyIssues';
import ReportIssue from './pages/Student/ReportIssue';
import AdminDashboard from './pages/Admin/Dashboard';
import ManageIssues from './pages/Admin/ManageIssues';
import IssueDetails from './pages/Admin/IssueDetails';
import ManageUsers from './pages/Admin/ManageUsers';
import ManageHostels from './pages/Admin/ManageHostels';
import ManageWorkers from './pages/Admin/ManageWorkers';
import WorkerDashboard from './pages/Worker/Dashboard';
import MyTasks from './pages/Worker/MyTasks';
import TaskDetails from './pages/Worker/TaskDetails';
import PrivateRoute from './context/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <PrivateRoute role="student">
                <StudentDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/student" 
            element={<Navigate to="/student/dashboard" replace />}
          />
          <Route 
            path="/student/my-issues" 
            element={
              <PrivateRoute role="student">
                <MyIssues />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/student/report-issue" 
            element={
              <PrivateRoute role="student">
                <ReportIssue />
              </PrivateRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/dashboard/admin" 
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/manage-issues" 
            element={
              <PrivateRoute role="admin">
                <ManageIssues />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/issue/:id" 
            element={
              <PrivateRoute role="admin">
                <IssueDetails />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/manage-users" 
            element={
              <PrivateRoute role="admin">
                <ManageUsers />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/manage-hostels" 
            element={
              <PrivateRoute role="admin">
                <ManageHostels />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/manage-workers" 
            element={
              <PrivateRoute role="admin">
                <ManageWorkers />
              </PrivateRoute>
            } 
          />
          
          {/* Worker Routes */}
          <Route 
            path="/dashboard/worker" 
            element={
              <PrivateRoute role="worker">
                <WorkerDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/worker/my-tasks" 
            element={
              <PrivateRoute role="worker">
                <MyTasks />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/worker/task/:id" 
            element={
              <PrivateRoute role="worker">
                <TaskDetails />
              </PrivateRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;