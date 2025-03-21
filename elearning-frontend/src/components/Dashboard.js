import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get username from local storage or JWT token
    const getUsername = () => {
      // Option 1: If you stored the username during login
      const storedUsername = localStorage.getItem('username');
      
      // Option 2: If you're using JWT tokens, decode the token
      const token = localStorage.getItem('accessToken');
      
      if (storedUsername) {
        setUsername(storedUsername);
      } else if (token) {
        // Basic JWT decoding (middle part of token contains payload)
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          setUsername(payload.username || payload.user_id || 'User');
        } catch (error) {
          console.error('Error decoding token:', error);
          setUsername('User');
        }
      } else {
        setUsername('User');
      }
      
      setLoading(false);
    };
    
    getUsername();
  }, []);

  const handleLogout = () => {
    // Clear all stored tokens and data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  // Styles object
  const styles = {
    dashboardContainer: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
    },
    header: {
      backgroundColor: '#3a5a9b',
      color: 'white',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      margin: 0,
      fontSize: '1.5rem',
    },
    logoutButton: {
      backgroundColor: 'transparent',
      border: '1px solid white',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    navbar: {
      backgroundColor: '#2c4678',
      padding: '0.5rem 1rem',
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    navLink: {
      color: 'white',
      textDecoration: 'none',
      padding: '0.75rem 1.25rem',
      margin: '0 0.5rem',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
    },
    activeNavLink: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    content: {
      flex: 1,
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      width: '100%',
      maxWidth: '800px',
      textAlign: 'center',
    },
    welcomeTitle: {
      color: '#3a5a9b',
      marginBottom: '1rem',
    },
    welcomeText: {
      fontSize: '1.1rem',
      lineHeight: '1.6',
      color: '#555',
    }
  };

  if (loading) {
    return <div style={styles.content}>Loading...</div>;
  }

  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>E-Learning Platform</h1>
        <button 
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>
      
      <nav style={styles.navbar}>
        <Link to="/dashboard" style={{...styles.navLink, ...styles.activeNavLink}}>Dashboard</Link>
        <Link to="/courses" style={styles.navLink}>Courses</Link>
        <Link to="/enrollments" style={styles.navLink}>My Enrollments</Link>
      </nav>
      
      <main style={styles.content}>
        <div style={styles.welcomeCard}>
          <h2 style={styles.welcomeTitle}>Welcome, {username}!</h2>
          <p style={styles.welcomeText}>
            You have successfully logged into the E-Learning Platform. 
            This dashboard will provide access to your courses, progress tracking, 
            and learning resources.
          </p>
          <p style={styles.welcomeText}>
            We're currently working on adding more features to enhance your learning experience.
            Stay tuned for updates!
          </p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;