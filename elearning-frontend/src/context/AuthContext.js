// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);
    
    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get('http://localhost:8000/api/users/profile/', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        } finally {
            setLoading(false);
        }
    };
    
    const login = async (credentials) => {
        try {
            const response = await axios.post('http://localhost:8000/api/users/token/', credentials);
            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            await fetchUserProfile();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };
    
    const register = async (userData) => {
        try {
            const response = await axios.post('http://localhost:8000/api/users/register/', userData);
            localStorage.setItem('accessToken', response.data.access);
            localStorage.setItem('refreshToken', response.data.refresh);
            setUser(response.data.user);
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    };
    
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };
    
    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};