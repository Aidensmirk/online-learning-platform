// src/components/EmailVerification.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../Services/api';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [searchParams]);

  const verifyEmail = async (token) => {
    try {
      await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage('Email verified successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-800">Verifying your email...</h2>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}