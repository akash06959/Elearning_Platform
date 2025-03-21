import React, { useState } from 'react';

function LoginPage() {
  // Styles object - moved to the top before any references
  const styles = {
    loginContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f7fa',
    },
    loginBox: {
      width: '400px',
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    },
    title: {
      textAlign: 'center',
      color: '#3a5a9b',
      marginBottom: '25px',
      fontWeight: '500',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#555',
      fontWeight: '500',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '16px',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#3a5a9b',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    buttonHover: {
      backgroundColor: '#2c4578',
    },
    errorMessage: {
      color: '#d9534f',
      textAlign: 'center',
      marginTop: '15px',
    },
    registerLink: {
      marginTop: '20px',
      textAlign: 'center',
      fontSize: '14px',
    },
    link: {
      color: '#3a5a9b',
      textDecoration: 'none',
      fontWeight: '500',
    }
  };

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Make API call to your Django backend
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store tokens
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        
        // Store username (extract from JWT or directly from response)
        localStorage.setItem('username', credentials.username);
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      
      } else {
        // Authentication failed
        setError('Invalid username or password.');
      }

    } catch (error) {
      console.error('Error during login:', error);
      setError('Network error. Please try again later.');
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>Login to E-Learning Platform</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="username">Username</label>
            <input
              style={styles.input}
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input
              style={styles.input}
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <button 
            type="submit" 
            style={styles.button}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
          >
            Login
          </button>
          {error && <p style={styles.errorMessage}>{error}</p>}
          
          <div style={styles.registerLink}>
            Don't have an account? <a href="/register" style={styles.link}>Register</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;