import React, { useState } from 'react';
import { Check, Flag } from 'lucide-react';
import type { Answer } from '../../types';
import { VoteControl } from './VoteControl';
import { CommentThread } from './CommentThread';
import { RichTextRenderer } from '../common/RichTextRenderer';
import { ReportModal } from '../common/ReportModal';

interface AnswerCardProps {
  answer: Answer;
  isQuestionAuthor: boolean;
  onAccept?: (answerId: string) => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  isQuestionAuthor,
  onAccept,
}) => {
  const [isReportOpen, setIsReportOpen] = useState(false);

  const formattedDate = new Date(answer.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        ...styles.card,
        borderColor: answer.is_accepted ? '#a7f3d0' : '#e2e8f0',
        backgroundColor: answer.is_accepted ? '#f0fdf4' : '#ffffff',
      }}
    >
      <div style={styles.mainLayout}>
        {/* Left Voting & Accepted Indicator */}
        <div style={styles.leftColumn}>
          <VoteControl
            targetType="answer"
            targetId={answer.id}
            initialScore={answer.score}
            initialUserVote={answer.user_vote}
            size="normal"
          />

          {answer.is_accepted && (
            <div style={styles.acceptedBadge} title="Author accepted this answer as the solution">
              <Check size={22} color="#059669" strokeWidth={3} />
            </div>
          )}

          {!answer.is_accepted && isQuestionAuthor && onAccept && (
            <button
              onClick={() => onAccept(answer.id)}
              style={styles.acceptButton}
              title="Click to accept as solution"
            >
              <Check size={18} color="#94a3b8" />
            </button>
          )}
        </div>

        {/* Right Content */}
        <div style={styles.rightColumn}>
          <div style={styles.bodyContent}>
            <RichTextRenderer content={answer.body} />
          </div>

          {/* Author Footnote & Actions */}
          <div style={styles.authorFootnote}>
            <button
              onClick={() => setIsReportOpen(true)}
              style={styles.reportBtn}
              title="Report this answer"
            >
              <Flag size={13} color="#94a3b8" />
              <span>Report</span>
            </button>

            <div style={styles.authorMiniCard}>
              <div style={styles.avatar}>
                {answer.author_avatar ? (
                  <img src={answer.author_avatar} alt={answer.author_name} style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarFallback}>
                    {answer.author_name ? answer.author_name[0].toUpperCase() : 'U'}
                  </span>
                )}
              </div>
              <div style={styles.authorDetails}>
                <span style={styles.answeredLabel}>answered {formattedDate}</span>
                <span style={styles.authorName}>{answer.author_name}</span>
                <span style={styles.reputation}>{answer.author_reputation} rep</span>
              </div>
            </div>
          </div>

          {/* Unified Comment Thread */}
          <CommentThread parentType="answer" parentId={answer.id} />
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="answer"
        targetId={answer.id}
        targetTitle={`Answer by ${answer.author_name}`}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '1.25rem',
    transition: 'border-color 0.15s ease',
  },
  mainLayout: {
    display: 'flex',
    gap: '1.5rem',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '40px',
  },
  acceptedBadge: {
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    marginTop: '0.25rem',
    background: 'none',
    border: '1px dashed #cbd5e1',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  rightColumn: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  bodyContent: {
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    color: '#1e293b',
  },
  authorFootnote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f1f5f9',
  },
  reportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  authorMiniCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.875rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarFallback: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#475569',
  },
  authorDetails: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.75rem',
  },
  answeredLabel: {
    color: '#94a3b8',
    fontSize: '0.6875rem',
  },
  authorName: {
    fontWeight: 600,
    color: '#1e293b',
  },
  reputation: {
    fontWeight: 600,
    color: '#2563eb',
  },
};
