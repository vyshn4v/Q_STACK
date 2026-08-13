import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface BookmarkButtonProps {
  questionId: string;
  initialIsBookmarked?: boolean;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  questionId,
  initialIsBookmarked = false,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !initialIsBookmarked) {
      api.getBookmarkStatus(questionId)
        .then((res) => setIsBookmarked(res.isBookmarked))
        .catch(() => {});
    }
  }, [questionId, isAuthenticated]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await api.toggleBookmark(questionId);
      setIsBookmarked(res.isBookmarked);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      style={{
        ...styles.button,
        ...(isBookmarked ? styles.buttonActive : {}),
      }}
      title={isBookmarked ? 'Remove from saved bookmarks' : 'Bookmark this question'}
    >
      <Bookmark
        size={15}
        color={isBookmarked ? '#2563eb' : '#64748b'}
        fill={isBookmarked ? '#2563eb' : 'none'}
      />
      <span>{isBookmarked ? 'Saved' : 'Save'}</span>
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.625rem',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  buttonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    color: '#2563eb',
  },
};
