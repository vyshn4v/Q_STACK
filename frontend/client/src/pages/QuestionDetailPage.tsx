import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { Question, Answer } from '../types';
import { api, isAbortError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { VoteControl } from '../components/qa/VoteControl';
import { AIAnswerBlock } from '../components/qa/AIAnswerBlock';
import { CommentThread } from '../components/qa/CommentThread';
import { AnswerCard } from '../components/qa/AnswerCard';
import { BookmarkButton } from '../components/qa/BookmarkButton';
import { MedalControl } from '../components/qa/MedalControl';
import { RichMarkdownEditor } from '../components/common/RichMarkdownEditor';
import { RichTextRenderer } from '../components/common/RichTextRenderer';
import { ReportModal } from '../components/common/ReportModal';
import {
  Calendar,
  Eye,
  MessageSquare,
  Send,
  Loader2,
  Trash2,
  Share2,
  CheckCircle,
  LogIn,
  Lock,
  Flag,
} from 'lucide-react';

export const QuestionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const loadData = async (signal?: AbortSignal) => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [qData, aData] = await Promise.all([
        api.getQuestion(id, signal),
        api.getAnswers(id, signal),
      ]);
      if (!signal?.aborted) {
        setQuestion(qData);
        setAnswers(aData);
      }
    } catch (err: any) {
      if (!isAbortError(err)) {
        // Handled
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [id]);

  const handlePostAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!id || !answerBody.trim() || isSubmittingAnswer) return;

    setIsSubmittingAnswer(true);
    try {
      const newAnswer = await api.createAnswer(id, { body: answerBody.trim() });
      setAnswers((prev) => [...prev, newAnswer]);
      setAnswerBody('');
      if (question) {
        setQuestion({
          ...question,
          answers_count: question.answers_count + 1,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await api.acceptAnswer(answerId);
      setAnswers((prev) =>
        prev.map((a) => ({
          ...a,
          is_accepted: a.id === answerId,
        })),
      );
      if (question) {
        setQuestion({ ...question, has_accepted_answer: true });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to accept answer.');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.deleteQuestion(id);
      navigate('/');
    } catch (err: any) {
      alert(err.message || 'Failed to delete question.');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div style={styles.loadingContainer}>
          <Loader2 size={32} style={styles.spinner} />
          <span>Loading question thread...</span>
        </div>
      </AppShell>
    );
  }

  if (!question) {
    return (
      <AppShell>
        <div style={styles.notFound}>
          <h2>Question not found</h2>
          <p>The requested question could not be found or has been removed.</p>
          <Link to="/" style={styles.backBtn}>
            Back to Home
          </Link>
        </div>
      </AppShell>
    );
  }

  const isQuestionAuthor = user?.id === question.author_id;
  const isPrivileged = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <AppShell>
      <div style={styles.container}>
        {/* Question Header */}
        <div style={styles.questionHeader}>
          <h1 style={styles.questionTitle}>{question.title}</h1>
          <div style={styles.questionMetaRow}>
            <div style={styles.metaItem}>
              <Calendar size={14} />
              <span>Asked {new Date(question.created_at).toLocaleDateString()}</span>
            </div>
            <div style={styles.metaItem}>
              <Eye size={14} />
              <span>Viewed {question.views_count} times</span>
            </div>
            <div style={styles.metaItem}>
              <MessageSquare size={14} />
              <span>{answers.length} answers</span>
            </div>
          </div>
        </div>

        {/* Question Main Body */}
        <div style={styles.postLayout}>
          {/* Left Voting Rail */}
          <div style={styles.voteRail}>
            <VoteControl
              targetType="question"
              targetId={question.id}
              initialScore={question.score}
              initialUserVote={question.user_vote}
              size="large"
            />
          </div>

          {/* Post Content */}
          <div style={styles.postBodyContainer}>
            <div style={styles.bodyContent}>
              <RichTextRenderer content={question.body} />
            </div>

            {/* Tags */}
            <div style={styles.tagsRow}>
              {question.tags.map((tag) => (
                <Link
                  key={tag.id || tag.name}
                  to={`/questions?tag=${tag.name}`}
                  style={styles.tagChip}
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

              {/* Actions & Author Row */}
              <div style={styles.postFooter}>
                <div style={styles.actionButtons}>
                  <BookmarkButton questionId={question.id} />
                  <MedalControl questionId={question.id} isAuthor={isQuestionAuthor} />
                  <button onClick={handleShare} style={styles.actionBtn}>
                    {copiedLink ? <CheckCircle size={14} color="#059669" /> : <Share2 size={14} />}
                    <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                  </button>
                  <button onClick={() => setIsReportOpen(true)} style={styles.actionBtn} title="Report question">
                    <Flag size={14} color="#64748b" />
                    <span>Report</span>
                  </button>
                  {isAuthenticated && (isQuestionAuthor || isPrivileged) && (
                    <button onClick={handleDeleteQuestion} style={styles.deleteBtn}>
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

              {/* Author Card */}
              <div style={styles.authorCard}>
                <div style={styles.authorCardAvatar}>
                  {question.author_avatar ? (
                    <img src={question.author_avatar} alt={question.author_name} style={styles.avatarImg} />
                  ) : (
                    <span style={styles.avatarFallback}>
                      {question.author_name ? question.author_name[0].toUpperCase() : 'U'}
                    </span>
                  )}
                </div>
                <div style={styles.authorCardDetails}>
                  <span style={styles.authorCardName}>{question.author_name}</span>
                  <span style={styles.authorCardRep}>{question.author_reputation} reputation</span>
                </div>
              </div>
            </div>

            {/* Cached AI Overview Block (Read-only for all, no extra LLM calls on view) */}
            <AIAnswerBlock
              questionId={question.id}
              authorId={question.author_id}
              initialAiResponse={question.ai_response}
            />

            {/* Question Comments */}
            <CommentThread parentType="question" parentId={question.id} />
          </div>
        </div>

        {/* Answers Section */}
        <div style={styles.answersSection}>
          <div style={styles.answersSectionHeader}>
            <h2 style={styles.answersCountTitle}>
              {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
            </h2>
          </div>

          {answers.length === 0 ? (
            <div style={styles.noAnswersCard}>
              <p>No answers have been posted yet.</p>
            </div>
          ) : (
            answers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                isQuestionAuthor={isQuestionAuthor}
                onAccept={handleAcceptAnswer}
              />
            ))
          )}
        </div>

        {/* Answer Composer Form - Authenticated vs Guest */}
        {isAuthenticated ? (
          <div style={styles.composerCard}>
            <h3 style={styles.composerTitle}>Your Answer</h3>
            <p style={styles.composerSubtitle}>
              Provide code examples, detailed explanations, and verifiable reasoning.
            </p>

            <form onSubmit={handlePostAnswer} style={styles.composerForm}>
              <RichMarkdownEditor
                value={answerBody}
                onChange={setAnswerBody}
                placeholder="Write your detailed answer here with code snippets, reasoning, and verifiable examples (min 20 chars)..."
                minHeight="220px"
              />

              <div style={styles.composerActions}>
                <button
                  type="submit"
                  disabled={isSubmittingAnswer}
                  style={styles.submitAnswerBtn}
                >
                  <Send size={15} />
                  <span>{isSubmittingAnswer ? 'Submitting...' : 'Post Your Answer'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div style={styles.guestCtaCard}>
            <div style={styles.guestCtaIcon}>
              <Lock size={22} color="#2563eb" />
            </div>
            <div style={styles.guestCtaContent}>
              <h4 style={styles.guestCtaTitle}>Join the discussion to answer this question</h4>
              <p style={styles.guestCtaSubtitle}>
                Signing in allows you to contribute solutions, vote on helpful answers, and earn reputation badges.
              </p>
            </div>
            <button
              onClick={() => openAuthModal('login')}
              style={styles.guestCtaBtn}
            >
              <LogIn size={15} />
              <span>Sign In to Answer</span>
            </button>
          </div>
        )}

        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetType="question"
          targetId={question.id}
          targetTitle={question.title}
        />
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  questionHeader: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '1rem',
  },
  questionTitle: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.35,
    letterSpacing: '-0.02em',
  },
  questionMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    marginTop: '0.625rem',
    fontSize: '0.8125rem',
    color: '#64748b',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  postLayout: {
    display: 'flex',
    gap: '1.5rem',
  },
  voteRail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '44px',
  },
  postBodyContainer: {
    flexGrow: 1,
    minWidth: 0,
  },
  bodyContent: {
    fontSize: '1rem',
    lineHeight: 1.7,
    color: '#1e293b',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1.25rem',
  },
  tagChip: {
    padding: '0.25rem 0.625rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    border: '1px solid #bfdbfe',
    textDecoration: 'none',
  },
  postFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.75rem',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    color: '#64748b',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.8125rem',
    color: '#ef4444',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  authorCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.875rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  authorCardAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  avatarFallback: {
    fontWeight: 700,
    fontSize: '0.8125rem',
    color: '#475569',
  },
  authorCardDetails: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.75rem',
  },
  authorCardName: {
    fontWeight: 600,
    color: '#1e293b',
  },
  authorCardRep: {
    color: '#2563eb',
    fontWeight: 600,
  },
  answersSection: {
    marginTop: '1rem',
  },
  answersSectionHeader: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.75rem',
    marginBottom: '1.25rem',
  },
  answersCountTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  noAnswersCard: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px dashed #cbd5e1',
    color: '#64748b',
  },
  composerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    marginTop: '1rem',
  },
  composerTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  composerSubtitle: {
    fontSize: '0.8125rem',
    color: '#64748b',
    marginBottom: '1rem',
    marginTop: '0.25rem',
  },
  composerForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  composerTextarea: {
    width: '100%',
    padding: '1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  composerActions: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  submitAnswerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  guestCtaCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  guestCtaIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  guestCtaContent: {
    flexGrow: 1,
    minWidth: '240px',
  },
  guestCtaTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '0.25rem',
  },
  guestCtaSubtitle: {
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  guestCtaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '5rem 0',
    color: '#64748b',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#2563eb',
  },
  notFound: {
    textAlign: 'center',
    padding: '4rem 1rem',
    color: '#64748b',
  },
  backBtn: {
    display: 'inline-block',
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    textDecoration: 'none',
  },
};
