import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface FollowButtonProps {
  targetType: 'user' | 'tag' | 'question';
  targetId: string;
  size?: 'sm' | 'md';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetType,
  targetId,
  size = 'md',
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && targetId && (targetType !== 'user' || user?.id !== targetId)) {
      api.getFollowStatus(targetType, targetId)
        .then((res) => setIsFollowing(res.isFollowing))
        .catch(() => {});
    }
  }, [targetType, targetId, isAuthenticated, user?.id]);

  if (targetType === 'user' && user?.id === targetId) {
    return null; // Cannot follow yourself
  }

  const handleToggle = async () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await api.toggleFollow(targetType, targetId);
      setIsFollowing(res.isFollowing);
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
        ...styles.btn,
        ...(isFollowing ? styles.followingBtn : styles.followBtn),
        padding: size === 'sm' ? '0.25rem 0.625rem' : '0.5rem 1rem',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
      }}
    >
      {isFollowing ? (
        <>
          <UserCheck size={size === 'sm' ? 13 : 15} />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus size={size === 'sm' ? 13 : 15} />
          <span>Follow</span>
        </>
      )}
    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
  },
  followBtn: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
  },
  followingBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
  },
};
