import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { RichMarkdownEditor } from '../components/common/RichMarkdownEditor';
import { HelpCircle, Send, X, AlertCircle, Lock, LogIn } from 'lucide-react';

export const AskQuestionPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <AppShell showRightRail={false}>
        <div style={styles.authLockContainer}>
          <div style={styles.authLockCard}>
            <div style={styles.lockIconWrapper}>
              <Lock size={32} color="#2563eb" />
            </div>
            <h2 style={styles.authLockTitle}>Sign in to Ask a Question</h2>
            <p style={styles.authLockDesc}>
              Joining QStack enables you to ask technical questions, receive peer-reviewed solutions from verified developers, and earn community reputation.
            </p>
            <div style={styles.authLockActions}>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                style={styles.signInBtn}
              >
                <LogIn size={16} />
                <span>Sign In / Create Account</span>
              </button>
              <Link to="/questions" style={styles.browseLink}>
                Browse Public Questions Instead
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleAddTag = (e: React.KeyboardEvent | React.FocusEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();

    const sanitized = tagInput.toLowerCase().trim().replace(/[^a-z0-9-+#.]/g, '');
    if (sanitized && !tags.includes(sanitized) && tags.length < 5) {
      setTags([...tags, sanitized]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters long.');
      return;
    }

    // Strip HTML tags to verify actual text length
    const plainText = body.replace(/<[^>]*>/g, '').trim();
    if (plainText.length < 20) {
      setError('Question body must be at least 20 characters long.');
      return;
    }

    if (tags.length === 0) {
      setError('Please add at least 1 tag.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.createQuestion({
        title: title.trim(),
        body: body.trim(),
        tags,
      });
      navigate(`/questions/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit question.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell showRightRail={false}>
      <div style={styles.pageContainer}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Ask a Public Question</h1>
          <p style={styles.subheading}>
            Be specific and imagine you are asking a question to another developer.
          </p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="ask-composer-layout" style={styles.composerLayout}>
          {/* Main Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Title Section */}
            <div className="ask-field-card" style={styles.fieldCard}>
              <label style={styles.fieldLabel}>Title</label>
              <p style={styles.fieldDesc}>
                Be specific and clear. Imagine you're summarizing the issue in a single headline.
              </p>
              <input
                type="text"
                placeholder="e.g. How to implement Redis Streams consumer groups in NestJS?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                minLength={10}
                maxLength={255}
                required
                style={styles.textInput}
              />
            </div>

            {/* Rich Editor Section */}
            <div className="ask-field-card" style={styles.fieldCard}>
              <label style={styles.fieldLabel}>Problem Details & Code Context</label>
              <p style={styles.fieldDesc}>
                Introduce the problem, describe what you tried, and format code snippets using the rich toolbar.
              </p>

              <RichMarkdownEditor
                value={body}
                onChange={setBody}
                placeholder="Describe what you tried, expected outcomes, and paste your minimal reproducible code snippet..."
                minHeight="220px"
              />
            </div>

            {/* Tags Section */}
            <div className="ask-field-card" style={styles.fieldCard}>
              <label style={styles.fieldLabel}>Tags</label>
              <p style={styles.fieldDesc}>
                Add up to 5 tags to describe what your question is about. Press Enter or comma to add.
              </p>

              <div style={styles.tagInputWrapper}>
                <div style={styles.tagsRow}>
                  {tags.map((t) => (
                    <span key={t} style={styles.tagChip}>
                      #{t}
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        style={styles.tagRemoveBtn}
                        aria-label={`Remove ${t}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {tags.length < 5 && (
                    <input
                      type="text"
                      placeholder={tags.length === 0 ? "e.g. nestjs, typescript, redis" : "add tag..."}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      onBlur={handleAddTag}
                      style={styles.tagInputField}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="ask-submit-btn"
                style={{
                  ...styles.submitBtn,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Publishing question...' : 'Post Your Question'}</span>
              </button>
            </div>
          </form>

          {/* Right Instructions Rail */}
          <aside className="ask-instructions-rail" style={styles.instructionsRail}>
            <div style={styles.instructionCard}>
              <div style={styles.instructionHeader}>
                <HelpCircle size={18} color="#2563eb" />
                <strong>Writing a good question</strong>
              </div>
              <ul style={styles.instructionList}>
                <li><strong>Summarize the problem:</strong> Include specific libraries and error codes.</li>
                <li><strong>Describe what you tried:</strong> Show debugging steps and outcomes.</li>
                <li><strong>Show code:</strong> Use the <code>&lt;/&gt;</code> code block button in the editor.</li>
                <li><strong>Tag appropriately:</strong> Use relevant technology tags.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    maxWidth: '1080px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '0.25rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  subheading: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
  },
  composerLayout: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
    width: '100%',
  },
  form: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    minWidth: 0,
    width: '100%',
  },
  fieldCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.25rem',
    width: '100%',
    boxSizing: 'border-box',
  },
  fieldLabel: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#0f172a',
    display: 'block',
  },
  fieldDesc: {
    fontSize: '0.8125rem',
    color: '#64748b',
    marginTop: '0.25rem',
    marginBottom: '0.75rem',
    lineHeight: 1.4,
  },
  textInput: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#0f172a',
  },
  tagInputWrapper: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#ffffff',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.375rem',
  },
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid #bfdbfe',
  },
  tagRemoveBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: '#2563eb',
  },
  tagInputField: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    flexGrow: 1,
    minWidth: '100px',
    padding: '0.25rem',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  instructionsRail: {
    width: '300px',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  instructionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    color: '#0f172a',
    fontSize: '0.9375rem',
  },
  instructionList: {
    paddingLeft: '1.25rem',
    fontSize: '0.8125rem',
    color: '#475569',
    lineHeight: 1.6,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  authLockContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
  authLockCard: {
    maxWidth: '520px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  lockIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authLockTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  authLockDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  authLockActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    marginTop: '0.5rem',
  },
  signInBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  browseLink: {
    fontSize: '0.8125rem',
    color: '#64748b',
    textDecoration: 'none',
  },
};
