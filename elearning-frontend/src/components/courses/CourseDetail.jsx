import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const defaultImageUrl = 'https://placehold.co/1200x400'; // Fallback image URL

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await fetch(`http://localhost:8000/courses/${courseId}/`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }
        const data = await response.json();
        // Ensure image URLs are absolute and use fallback if not available
        if (data.thumbnail) {
          data.thumbnail = data.thumbnail.startsWith('http') ? data.thumbnail : `http://localhost:8000${data.thumbnail}`;
        } else {
          data.thumbnail = defaultImageUrl;
        }
        if (data.cover_image) {
          data.cover_image = data.cover_image.startsWith('http') ? data.cover_image : `http://localhost:8000${data.cover_image}`;
        } else {
          data.cover_image = defaultImageUrl;
        }
        setCourse(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Please try again later.');
        setLoading(false);
      }
    };

    const checkEnrollment = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('No token found, user not logged in');
          return;
        }

        // Validate token format
        if (!token.startsWith('Bearer ')) {
          const formattedToken = `Bearer ${token}`;
          localStorage.setItem('accessToken', formattedToken);
        }

        const response = await fetch(`http://localhost:8000/enrollments/check/${courseId}/`, {
          headers: {
            'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.status === 401 || response.status === 403) {
          console.log('Token expired or invalid, redirecting to login');
          localStorage.removeItem('accessToken');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          console.error('Enrollment check failed:', response.status, response.statusText);
          const errorData = await response.json();
          console.error('Error details:', errorData);
          return;
        }

        const data = await response.json();
        setIsEnrolled(data.is_enrolled);
      } catch (err) {
        console.error('Error checking enrollment:', err);
      }
    };

    fetchCourseDetails();
    checkEnrollment();
  }, [courseId, navigate]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Please log in to enroll in this course');
        navigate('/login');
        return;
      }

      // Validate token format
      if (!token.startsWith('Bearer ')) {
        const formattedToken = `Bearer ${token}`;
        localStorage.setItem('accessToken', formattedToken);
      }

      console.log('Attempting to enroll in course:', courseId);

      const response = await fetch(`http://localhost:8000/enrollments/enroll/${courseId}/`, {
        method: 'POST',
        headers: {
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401 || response.status === 403) {
        console.log('Token expired or invalid, redirecting to login');
        localStorage.removeItem('accessToken');
        setError('Please log in again to enroll in this course');
        navigate('/login');
        return;
      }

      const data = await response.json();
      console.log('Enrollment response:', { status: response.status, data });

      if (!response.ok) {
        if (data.message === 'You are already enrolled in this course') {
          setIsEnrolled(true);
          navigate('/enrollments');
          return;
        }
        throw new Error(data.message || 'Failed to enroll in course');
      }

      setIsEnrolled(true);
      alert('Successfully enrolled in course!');
      navigate('/enrollments');
    } catch (err) {
      console.error('Error enrolling in course:', err);
      if (err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(`Failed to enroll in course: ${err.message}`);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      marginBottom: '2rem',
    },
    title: {
      color: '#3a5a9b',
      fontSize: '2.5rem',
      marginBottom: '1rem',
    },
    instructor: {
      color: '#666',
      fontSize: '1.1rem',
      marginBottom: '1rem',
    },
    description: {
      fontSize: '1.1rem',
      lineHeight: '1.6',
      color: '#444',
      marginBottom: '2rem',
    },
    courseImage: {
      width: '100%',
      maxHeight: '400px',
      objectFit: 'cover',
      borderRadius: '8px',
      marginBottom: '2rem',
    },
    details: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    detailCard: {
      backgroundColor: '#f8f9fa',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    detailTitle: {
      color: '#3a5a9b',
      fontSize: '1.1rem',
      marginBottom: '0.5rem',
    },
    detailValue: {
      fontSize: '1.2rem',
      color: '#333',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#dc3545',
    },
    enrollButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      marginTop: '1rem',
      width: '100%',
      maxWidth: '200px',
    },
    enrolledButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      fontSize: '1.1rem',
      cursor: 'pointer',
      marginTop: '1rem',
      width: '100%',
      maxWidth: '200px',
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: '2rem',
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{course.title}</h1>
        <p style={styles.instructor}>Instructor: {course.instructor}</p>
      </div>

      <img 
        src={course.cover_image || course.thumbnail || defaultImageUrl} 
        alt={course.title}
        style={styles.courseImage}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultImageUrl;
        }}
      />

      <p style={styles.description}>{course.description}</p>

      <div style={styles.details}>
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Category</h3>
          <p style={styles.detailValue}>{course.category}</p>
        </div>
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Difficulty</h3>
          <p style={styles.detailValue}>{course.difficulty}</p>
        </div>
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Duration</h3>
          <p style={styles.detailValue}>{course.duration_in_weeks} weeks</p>
        </div>
        <div style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Price</h3>
          <p style={styles.detailValue}>${course.price}</p>
        </div>
      </div>

      <div style={styles.buttonContainer}>
        {isEnrolled ? (
          <button 
            style={styles.enrolledButton}
            onClick={() => navigate('/enrollments')}
          >
            View Course
          </button>
        ) : (
          <button 
            style={styles.enrollButton}
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        )}
      </div>
    </div>
  );
}

export default CourseDetail;