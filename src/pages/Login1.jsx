import React, { useState } from 'react';
import { signInWithEmailPassword, signInWithGoogle } from '../Services/authService';
import { useNavigate } from 'react-router-dom';

const Login1 = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await signInWithEmailPassword(email, password);
      if (user?.role === 'admin') {
        // Redirect admins to the Django admin panel
        window.location.href = '/admin/';
        return;
      }
      // Use selected role for navigation (user's actual role is in the database)
      // Navigate based on selected role, but verify user has permission
      if (role === 'student') {
        navigate('/student-dashboard');
      } else if (role === 'instructor') {
        // Check if user is actually an instructor
        if (user?.role === 'instructor') {
          navigate('/instructor-dashboard');
        } else {
          setError('You do not have instructor access. Please select Student role.');
          setLoading(false);
          return;
        }
      } else {
        // Default to student dashboard
        navigate('/student-dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.non_field_errors?.[0] 
        || error.response?.data?.message 
        || error.message 
        || 'Invalid credentials or user not found';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (role === 'student') {
        navigate('/student-dashboard');
      } else if (role === 'instructor') {
        navigate('/instructor-dashboard');
      }
    } catch (error) {
      setError('Google login failed. Please try again.');
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!email) {
      setError('Please enter your email');
      return false;
    }
    if (!password) {
      setError('Please enter your password');
      return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary text-white">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-primary mb-6">Login</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className="w-full p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              className="w-full p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="absolute inset-y-0 right-0 flex items-center px-3">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
          <p className="text-xs text-gray-500">Select your role to navigate to the correct dashboard</p>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white py-3 rounded hover:bg-primary-dark transition w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center bg-secondary text-white rounded hover:bg-secondary-dark transition w-full py-3"
          >
            <svg
              className="w-5 h-5 mr-2"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.4 87.2-4.7 162-64.8 162-141.9V261.6z"
              ></path>
            </svg>
            Login with Google
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex items-center justify-center bg-gray-500 text-white rounded hover:bg-gray-600 transition w-full py-3"
          >
            Don't have an account? Register
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center bg-gray-500 text-white rounded hover:bg-gray-600 transition w-full py-3 mt-2"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login1;