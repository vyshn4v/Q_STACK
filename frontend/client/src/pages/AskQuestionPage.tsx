import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { HelpCircle, Send, X, AlertCircle, Eye, Edit3 } from 'lucide-react';

export const AskQuestionPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (title.trim().length < 10) {
      setError('Title must be at least 10 characters long.');
      return;
    }

    if (body.trim().length < 20) {
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

        <div style={styles.composerLayout}>
          {/* Main Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Title Section */}
            <div style={styles.fieldCard}>
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

            {/* Body Section */}
            <div style={styles.fieldCard}>
              <div style={styles.bodyHeaderRow}>
                <div>
                  <label style={styles.fieldLabel}>Problem Details & Context</label>
                  <p style={styles.fieldDesc}>
                    Introduce the problem and expand on what you put in the title.
                  </p>
                </div>

                <div style={styles.tabToggle}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'write' ? styles.activeTabBtn : {}),
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    style={{
                      ...styles.tabBtn,
                      ...(activeTab === 'preview' ? styles.activeTabBtn : {}),
                    }}
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>
                </div>
              </div>

              {activeTab === 'write' ? (
                <textarea
                  rows={12}
                  placeholder="Describe what you tried, what you expected, and paste your minimal code example..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  minLength={20}
                  required
                  style={styles.textarea}
                />
              ) : (
                <div style={styles.previewBox}>
                  {body.trim() ? (
                    body.split('\n\n').map((p, i) => (
                      <p key={i} style={{ marginBottom: '1rem' }}>
                        {p}
                      </p>
                    ))
                  ) : (
                    <em style={{ color: '#94a3b8' }}>Nothing to preview yet</em>
                  )}
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div style={styles.fieldCard}>
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
          <aside style={styles.instructionsRail}>
            <div style={styles.instructionCard}>
              <div style={styles.instructionHeader}>
                <HelpCircle size={18} color="#2563eb" />
                <strong>Writing a good question</strong>
              </div>
              <ul style={styles.instructionList}>
                <li><strong>Summarize the problem:</strong> Include specific libraries and error codes.</li>
                <li><strong>Describe what you tried:</strong> Show debugging steps and outcomes.</li>
                <li><strong>Show code:</strong> Include minimal reproducible snippets.</li>
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
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    marginBottom: '0.5rem',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  subheading: {
    fontSize: '0.9375rem',
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
    padding: '0.875rem 1rem',
    borderRadius: '10px',
    fontSize: '0.875rem',
  },
  composerLayout: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  form: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    minWidth: 0,
  },
  fieldCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  fieldLabel: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  fieldDesc: {
    fontSize: '0.8125rem',
    color: '#64748b',
    marginTop: '0.25rem',
    marginBottom: '0.875rem',
  },
  textInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#0f172a',
  },
  bodyHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  tabToggle: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: '2px',
    borderRadius: '6px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.625rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    border: 'none',
    background: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  activeTabBtn: {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  previewBox: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    minHeight: '200px',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
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
    minWidth: '120px',
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
    width: '320px',
    flexShrink: 0,
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
};
