import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type { Comment } from '../../types';
import { MessageSquare, Send } from 'lucide-react';

interface CommentThreadProps {
  parentType: 'question' | 'answer';
  parentId: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ parentType, parentId }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await api.getComments(parentType, parentId);
      setComments(data);
    } catch {
      // Ignored if offline
    }
  };

  useEffect(() => {
    fetchComments();
  }, [parentType, parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentBody.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await api.createComment({
        parentType,
        parentId,
        body: newCommentBody.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewCommentBody('');
      setIsAdding(false);
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {comments.length > 0 && (
        <div style={styles.commentsList}>
          {comments.map((c) => (
            <div key={c.id} style={styles.commentRow}>
              <span style={styles.commentBody}>{c.body}</span>
              <span style={styles.commentAuthor}>
                – <strong style={{ color: '#2563eb' }}>{c.author_name}</strong>{' '}
                <span style={styles.commentDate}>
                  {new Date(c.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <form onSubmit={handleSubmit} style={styles.addForm}>
          <input
            type="text"
            placeholder="Use comments to ask for clarification or suggest improvements (min 5 chars)..."
            value={newCommentBody}
            onChange={(e) => setNewCommentBody(e.target.value)}
            minLength={5}
            maxLength={1000}
            required
            autoFocus
            style={styles.commentInput}
          />
          <div style={styles.formActions}>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              <Send size={14} />
              <span>{isSubmitting ? 'Posting...' : 'Add Comment'}</span>
            </button>
            <button type="button" onClick={() => setIsAdding(false)} style={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('login');
              return;
            }
            setIsAdding(true);
          }}
          style={styles.addCommentTrigger}
        >
          <MessageSquare size={13} />
          <span>Add a comment</span>
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f1f5f9',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  commentRow: {
    fontSize: '0.8125rem',
    lineHeight: 1.45,
    color: '#334155',
    padding: '0.25rem 0',
    borderBottom: '1px dotted #e2e8f0',
  },
  commentBody: {
    marginRight: '0.5rem',
  },
  commentAuthor: {
    color: '#64748b',
    fontSize: '0.75rem',
  },
  commentDate: {
    color: '#94a3b8',
  },
  addCommentTrigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    color: '#64748b',
    padding: '0.25rem 0',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  commentInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  cancelBtn: {
    padding: '0.375rem 0.75rem',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '0.75rem',
    cursor: 'pointer',
    border: 'none',
  },
};
