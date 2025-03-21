import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EnrollmentList.css';

const EnrollmentList = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await fetch('http://localhost:8000/enrollments/enrolled/', {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch enrollments');
        }

        const data = await response.json();
        setEnrollments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, []);

  if (loading) {
    return <div className="loading">Loading enrolled courses...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (enrollments.length === 0) {
    return (
      <div className="no-enrollments">
        <h2>No Enrolled Courses</h2>
        <p>You haven't enrolled in any courses yet.</p>
        <Link to="/courses" className="browse-courses-btn">
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="enrollment-list">
      <h2>My Enrolled Courses</h2>
      <div className="enrollment-grid">
        {enrollments.map((enrollment) => (
          <div key={enrollment.id} className="enrollment-card">
            <div className="enrollment-image">
              {enrollment.thumbnail ? (
                <img src={enrollment.thumbnail} alt={enrollment.title} />
              ) : (
                <div className="placeholder-image">No Image</div>
              )}
            </div>
            <div className="enrollment-content">
              <h3>{enrollment.title}</h3>
              <p className="description">{enrollment.description}</p>
              <div className="enrollment-meta">
                <span className="instructor">Instructor: {enrollment.instructor}</span>
                <span className="category">{enrollment.category}</span>
                <span className="difficulty">{enrollment.difficulty}</span>
                <span className="duration">{enrollment.duration_in_weeks} weeks</span>
              </div>
              <div className="enrollment-actions">
                <Link
                  to={`/courses/${enrollment.course_id}`}
                  className="continue-btn"
                >
                  Continue Learning
                </Link>
                <Link
                  to={`/enrollments/progress/${enrollment.id}`}
                  className="progress-btn"
                >
                  View Progress
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrollmentList;