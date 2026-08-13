import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!token) {
      setError('OAuth authentication did not return a valid session token.');
      return;
    }

    localStorage.setItem('qstack_token', token);
    if (refreshToken) {
      localStorage.setItem('qstack_refresh_token', refreshToken);
    }

    refreshUser()
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize authenticated session.');
      });
  }, [searchParams]);

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <AlertCircle size={36} color="#ef4444" />
          <h2 style={styles.title}>Authentication Failed</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={() => navigate('/')} style={styles.homeBtn}>
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Loader2 size={36} style={styles.spinner} />
        <h2 style={styles.title}>Completing authentication...</h2>
        <p style={styles.subtitle}>Setting up your QStack developer profile...</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '1.5rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.875rem',
    maxWidth: '420px',
    width: '100%',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
  },
  errorText: {
    fontSize: '0.875rem',
    color: '#ef4444',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#2563eb',
  },
  homeBtn: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
