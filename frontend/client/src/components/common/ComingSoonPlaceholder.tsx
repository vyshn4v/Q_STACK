import React from 'react';
import { Construction, Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
  phase?: string;
  backPath?: string;
}

export const ComingSoonPlaceholder: React.FC<ComingSoonPlaceholderProps> = ({
  title,
  description,
  phase = 'Upcoming Phase',
  backPath = '/',
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.iconContainer}>
        <Construction size={36} color="#2563eb" />
      </div>

      <div style={styles.badge}>
        <Sparkles size={13} color="#2563eb" />
        <span>{phase}</span>
      </div>

      <h2 style={styles.title}>{title}</h2>
      <p style={styles.description}>{description}</p>

      <div style={styles.footer}>
        <Link to={backPath} style={styles.backButton}>
          <ArrowLeft size={16} />
          <span>Return to Feed</span>
        </Link>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '4rem 1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px dashed #cbd5e1',
    maxWidth: '560px',
    margin: '2rem auto',
    gap: '1rem',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.25rem 0.625rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: 700,
    border: '1px solid #bfdbfe',
  },
  title: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  description: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.6,
    maxWidth: '440px',
  },
  footer: {
    marginTop: '0.5rem',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
