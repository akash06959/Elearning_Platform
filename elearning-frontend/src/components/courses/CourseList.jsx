import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CourseList() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('http://localhost:8000/courses/', {
          headers: {
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        const processedData = data.map(course => ({
          ...course,
          thumbnail: course.thumbnail && !course.thumbnail.startsWith('http') 
            ? `http://localhost:8000${course.thumbnail}` 
            : course.thumbnail,
          cover_image: course.cover_image && !course.cover_image.startsWith('http') 
            ? `http://localhost:8000${course.cover_image}` 
            : course.cover_image
        }));
        setCourses(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    heading: {
      color: '#3a5a9b',
      marginBottom: '1.5rem',
      fontSize: '2rem',
    },
    courseGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
    },
    courseCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'transform 0.3s ease',
    },
    courseImage: {
      width: '100%',
      height: '160px',
      objectFit: 'cover',
      backgroundColor: '#e9ecef',
    },
    courseContent: {
      padding: '1.5rem',
    },
    courseTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#3a5a9b',
      marginBottom: '0.5rem',
    },
    courseDescription: {
      fontSize: '0.9rem',
      color: '#555',
      marginBottom: '1rem',
      lineHeight: '1.5',
    },
    courseDetails: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '1rem',
    },
    courseInstructor: {
      fontSize: '0.85rem',
      color: '#777',
    },
    courseButton: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      textDecoration: 'none',
      fontSize: '0.9rem',
      display: 'inline-block',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '2rem',
    },
    errorContainer: {
      textAlign: 'center',
      padding: '2rem',
      color: '#dc3545',
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Available Courses</h1>
        <div style={styles.loadingContainer}>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1 style={styles.heading}>Available Courses</h1>
        <div style={styles.errorContainer}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Available Courses</h1>
      
      <div style={styles.courseGrid}>
        {courses.length > 0 ? (
          courses.map(course => (
            <div 
              key={course.id} 
              style={styles.courseCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              <img 
                src={course.thumbnail || course.cover_image || 'https://via.placeholder.com/300x160'} 
                alt={course.title} 
                style={styles.courseImage}
              />
              <div style={styles.courseContent}>
                <h2 style={styles.courseTitle}>{course.title}</h2>
                <p style={styles.courseDescription}>{course.description}</p>
                <div style={styles.courseDetails}>
                  <span style={styles.courseInstructor}>Instructor: {course.instructor}</span>
                  <Link to={`/courses/${course.id}`} style={styles.courseButton}>
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No courses available at this time.</p>
        )}
      </div>
    </div>
  );
}

export default CourseList;