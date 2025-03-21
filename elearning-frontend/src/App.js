  import { BrowserRouter, Routes, Route } from 'react-router-dom';
  import LoginPage from './components/LoginPage';
  import Dashboard from './components/Dashboard';
  import RegistrationPage from './components/RegistrationPage';
  import CourseList from './components/courses/CourseList';
  import CourseDetail from './components/courses/CourseDetail';
  import EnrollmentList from './components/enrollments/EnrollmentList';
  import CourseLearning from './components/courses/CourseLearning';

  function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/enrollments" element={<EnrollmentList />} />
          <Route path="/learning/:courseId" element={<CourseLearning />} />
        </Routes>
      </BrowserRouter>
    );
  }

  export default App;