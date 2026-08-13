import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('superadmin@qstack.dev');
  const [password, setPassword] = useState('SuperAdmin@QStack2026!');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Invalid administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconCircle}>
          <ShieldCheck size={32} color="#ffffff" />
        </div>

        <h1 style={styles.title}>QStack Administration</h1>
        <p style={styles.subtitle}>
          Authorized access only for platform moderators, admins, and super administrators.
        </p>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Admin Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="#94a3b8" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#94a3b8" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...styles.submitBtn,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Admin Console</span>
            )}
          </button>
        </form>
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
    backgroundColor: '#0f172a',
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '0.375rem',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  errorAlert: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#450a0a',
    border: '1px solid #7f1d1d',
    color: '#f87171',
    borderRadius: '8px',
    fontSize: '0.8125rem',
    marginBottom: '1.25rem',
    boxSizing: 'border-box',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '0.375rem',
    display: 'block',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.625rem 0.875rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
  },
  input: {
    background: 'none',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '0.875rem',
    flexGrow: 1,
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
};
