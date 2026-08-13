import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';

interface VoteControlProps {
  targetType: 'question' | 'answer';
  targetId: string;
  initialScore: number;
  initialUserVote?: number | null;
  size?: 'normal' | 'large';
  orientation?: 'vertical' | 'horizontal';
}

export const VoteControl: React.FC<VoteControlProps> = ({
  targetType,
  targetId,
  initialScore,
  initialUserVote = null,
  size = 'normal',
  orientation = 'vertical',
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    // Optimistic calculate delta
    let delta = 0;
    let nextVote: number | null = null;

    if (userVote === value) {
      // Toggle off
      delta = -value;
      nextVote = null;
    } else if (userVote !== null) {
      // Switch
      delta = value - userVote;
      nextVote = value;
    } else {
      // New vote
      delta = value;
      nextVote = value;
    }

    const previousScore = score;
    const previousVote = userVote;

    setScore((prev) => prev + delta);
    setUserVote(nextVote);

    try {
      const result = await api.castVote({
        targetType,
        targetId,
        value,
      });
      setScore(result.newScore);
      setUserVote(result.userVote);
    } catch (err) {
      // Revert on failure
      setScore(previousScore);
      setUserVote(previousVote);
    } finally {
      setIsVoting(false);
    }
  };

  const isVertical = orientation === 'vertical';
  const iconSize = size === 'large' ? 24 : 20;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        gap: isVertical ? '0.25rem' : '0.5rem',
      }}
    >
      <button
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label="Upvote"
        style={{
          ...styles.voteBtn,
          color: userVote === 1 ? '#2563eb' : '#64748b',
          backgroundColor: userVote === 1 ? '#eff6ff' : 'transparent',
          borderColor: userVote === 1 ? '#bfdbfe' : 'transparent',
        }}
      >
        <ChevronUp size={iconSize} strokeWidth={userVote === 1 ? 2.5 : 2} />
      </button>

      <span
        style={{
          ...styles.score,
          fontSize: size === 'large' ? '1.25rem' : '0.95rem',
          fontWeight: 700,
          color: userVote === 1 ? '#2563eb' : userVote === -1 ? '#ef4444' : '#0f172a',
        }}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label="Downvote"
        style={{
          ...styles.voteBtn,
          color: userVote === -1 ? '#ef4444' : '#64748b',
          backgroundColor: userVote === -1 ? '#fef2f2' : 'transparent',
          borderColor: userVote === -1 ? '#fecaca' : 'transparent',
        }}
      >
        <ChevronDown size={iconSize} strokeWidth={userVote === -1 ? 2.5 : 2} />
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  voteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
    borderRadius: '6px',
    border: '1px solid transparent',
    transition: 'all 0.15s ease',
  },
  score: {
    minWidth: '24px',
    textAlign: 'center',
    userSelect: 'none',
  },
};
