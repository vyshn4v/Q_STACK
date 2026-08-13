import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Flame,
  Clock,
  HelpCircle,
  ThumbsUp,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  Layers,
  Sparkles,
  Tag as TagIcon,
  Check,
  Settings,
} from 'lucide-react';
import type { Question } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { QuestionCard } from '../components/qa/QuestionCard';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'interested' | 'newest' | 'trending' | 'unanswered' | 'votes'>('newest');
  const [followedTags, setFollowedTags] = useState<any[]>([]);
  const [popularTags, setPopularTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [isAddingTag, setIsAddingTag] = useState<string | null>(null);

  // Load user followed tags & popular tags
  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        api.getFollowingTags().catch(() => []),
        api.getPopularTags().catch(() => []),
      ]).then(([fTags, pTags]) => {
        setFollowedTags(fTags || []);
        setPopularTags(pTags || []);
        if (fTags && fTags.length > 0) {
          setActiveTab('interested');
        }
      });
    }
  }, [isAuthenticated]);

  const fetchQuestions = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.getQuestions({ sort: activeTab, limit: 15 });
      setQuestions(data.questions);
      setTotal(data.total);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [activeTab, isAuthenticated]);

  const handleQuickFollowTag = async (tag: { id: string; name: string }) => {
    setIsAddingTag(tag.id);
    try {
      await api.toggleFollow('tag', tag.id);
      const updated = await api.getFollowingTags();
      setFollowedTags(updated || []);
      // Re-fetch questions with updated tags
      const data = await api.getQuestions({ sort: 'interested', limit: 15 });
      setQuestions(data.questions);
      setTotal(data.total);
    } catch {
      // Ignore
    } finally {
      setIsAddingTag(null);
    }
  };

  // Guest Landing View
  if (!isAuthenticated) {
    return (
      <AppShell showRightRail={false}>
        <div style={styles.guestLandingContainer}>
          {/* Hero Section */}
          <div style={styles.heroSection}>
            <div style={styles.heroBadge}>
              <Layers size={14} color="#2563eb" />
              <span>Modern Developer Knowledge Platform</span>
            </div>
            <h1 style={styles.heroHeading}>
              Where Developers Share Knowledge & Verify Architecture
            </h1>
            <p style={styles.heroSubheading}>
              Ask questions, earn peer-reviewed medals, and query verified solutions with AI RAG assistance.
            </p>
            <div style={styles.heroCtas}>
              <Link to="/questions" style={styles.heroBrowseBtn}>
                <span>Browse Questions</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                style={styles.heroSignInBtn}
              >
                Sign In / Join QStack
              </button>
            </div>
          </div>

          {/* Value Props Grid */}
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <ShieldCheck size={24} color="#2563eb" />
              </div>
              <h3 style={styles.featureTitle}>Peer-Reviewed Medals</h3>
              <p style={styles.featureDesc}>
                Recognize exceptional problem statements and technical answers with Gold, Silver, and Bronze community medals.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <Zap size={24} color="#f59e0b" />
              </div>
              <h3 style={styles.featureTitle}>Daily Reputation & Streaks</h3>
              <p style={styles.featureDesc}>
                Earn badges and reputation scores through active problem solving, helpful answers, and consistent developer streaks.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIconWrapper}>
                <Bot size={24} color="#059669" />
              </div>
              <h3 style={styles.featureTitle}>Pinecone Vector RAG</h3>
              <p style={styles.featureDesc}>
                Instant cached answer overviews for every question alongside conversational RAG AI chat backed by vector search.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Authenticated Home Feed
  return (
    <AppShell>
      <div style={styles.container}>
        {/* Page Top Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {activeTab === 'interested' ? 'Your Tailored Developer Stream' : 'Explore Community Questions'}
            </h1>
            <p style={styles.subtitle}>
              {activeTab === 'interested' && followedTags.length > 0
                ? `Showing discussions matching your ${followedTags.length} interested topics`
                : total > 0
                ? `${total} questions available in your feed`
                : 'Explore technical questions and solutions'}
            </p>
          </div>
          <Link to="/ask" style={styles.askBtn}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Ask Question</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={styles.tabsRow}>
          <div style={styles.tabsList}>
            <button
              onClick={() => setActiveTab('interested')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'interested' ? styles.activeTabBtn : {}),
              }}
            >
              <Sparkles size={15} color={activeTab === 'interested' ? '#2563eb' : '#64748b'} />
              <span>For You (My Topics)</span>
              {followedTags.length > 0 && (
                <span style={styles.topicsCountPill}>{followedTags.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('newest')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'newest' ? styles.activeTabBtn : {}),
              }}
            >
              <Clock size={15} />
              <span>Newest</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'trending' ? styles.activeTabBtn : {}),
              }}
            >
              <Flame size={15} />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'unanswered' ? styles.activeTabBtn : {}),
              }}
            >
              <HelpCircle size={15} />
              <span>Unanswered</span>
            </button>
            <button
              onClick={() => setActiveTab('votes')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'votes' ? styles.activeTabBtn : {}),
              }}
            >
              <ThumbsUp size={15} />
              <span>Most Voted</span>
            </button>
          </div>
        </div>

        {/* Interested Topics Header Banner if activeTab === 'interested' and has tags */}
        {activeTab === 'interested' && followedTags.length > 0 && (
          <div style={styles.topicsBanner}>
            <div style={styles.topicsBannerLeft}>
              <TagIcon size={16} color="#2563eb" />
              <span style={styles.topicsBannerText}>Filtered by your topics:</span>
              <div style={styles.topicsBannerChips}>
                {followedTags.map((t) => (
                  <Link
                    key={t.id}
                    to={`/questions?tag=${encodeURIComponent(t.name)}`}
                    style={styles.topicBannerChip}
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            </div>

            {user?.id && (
              <Link to={`/users/${user.id}?tab=topics`} style={styles.editTopicsBtn}>
                <Settings size={13} />
                <span>Manage Topics</span>
              </Link>
            )}
          </div>
        )}

        {/* Interested Topics Onboarding Card if activeTab === 'interested' and has NO tags yet */}
        {activeTab === 'interested' && followedTags.length === 0 && (
          <div style={styles.onboardingCard}>
            <div style={styles.onboardingIconBox}>
              <Sparkles size={24} color="#2563eb" />
            </div>
            <div style={styles.onboardingInfo}>
              <h3 style={styles.onboardingTitle}>Personalize Your Home Feed</h3>
              <p style={styles.onboardingDesc}>
                Select the languages, frameworks, and tools you work with. Questions tagged with your interests will immediately show up in this feed!
              </p>

              <div style={styles.onboardingTagsRow}>
                {popularTags.slice(0, 12).map((pt) => {
                  const isFollowed = followedTags.some((ft) => ft.id === pt.id);
                  return (
                    <button
                      key={pt.id}
                      onClick={() => handleQuickFollowTag(pt)}
                      disabled={isAddingTag === pt.id}
                      style={{
                        ...styles.quickAddTagBtn,
                        backgroundColor: isFollowed ? '#eff6ff' : '#ffffff',
                        borderColor: isFollowed ? '#2563eb' : '#cbd5e1',
                        color: isFollowed ? '#2563eb' : '#0f172a',
                      }}
                    >
                      {isFollowed ? <Check size={13} color="#2563eb" /> : <Plus size={13} color="#64748b" />}
                      <span>#{pt.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Questions Feed */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={24} style={styles.spinner} />
            <span>Loading feed...</span>
          </div>
        ) : questions.length === 0 ? (
          <div style={styles.emptyState}>
            <HelpCircle size={40} color="#94a3b8" />
            <h3 style={styles.emptyTitle}>
              {activeTab === 'interested'
                ? 'No questions found for your watched topics'
                : 'No questions found'}
            </h3>
            <p style={styles.emptySubtitle}>
              {activeTab === 'interested'
                ? 'Try adding more interested topics or browse the Newest feed to see recent community questions.'
                : 'Be the first developer to ask a question in this category!'}
            </p>
            {activeTab === 'interested' && user?.id ? (
              <Link to={`/users/${user.id}?tab=topics`} style={styles.emptyActionBtn}>
                Manage Your Interested Topics &rarr;
              </Link>
            ) : (
              <Link to="/ask" style={styles.emptyActionBtn}>
                Ask a Question
              </Link>
            )}
          </div>
        ) : (
          <div style={styles.questionsList}>
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  askBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
  },
  tabsRow: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.25rem',
  },
  tabsList: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.25rem',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 0.875rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  activeTabBtn: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
  },
  topicsCountPill: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '0.1rem 0.4rem',
    borderRadius: '10px',
  },
  topicsBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  topicsBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  topicsBannerText: {
    fontSize: '0.8125rem',
    color: '#475569',
    fontWeight: 600,
  },
  topicsBannerChips: {
    display: 'flex',
    gap: '0.375rem',
    flexWrap: 'wrap',
  },
  topicBannerChip: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.5rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
  },
  editTopicsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 600,
  },
  onboardingCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.25rem',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #bfdbfe',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.05)',
  },
  onboardingIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  onboardingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flexGrow: 1,
  },
  onboardingTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  onboardingDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  onboardingTagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  quickAddTagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '4rem 1rem',
    color: '#64748b',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#2563eb',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '4rem 1rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    marginTop: '1rem',
    marginBottom: '0.5rem',
  },
  emptySubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    maxWidth: '420px',
    marginBottom: '1.5rem',
  },
  emptyActionBtn: {
    display: 'inline-block',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
  },
  guestLandingContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3.5rem',
    padding: '2rem 0',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '780px',
    margin: '0 auto',
    gap: '1.25rem',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.35rem 0.85rem',
    backgroundColor: '#eff6ff',
    borderRadius: '20px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#2563eb',
    border: '1px solid #bfdbfe',
  },
  heroHeading: {
    fontSize: '2.75rem',
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.2,
    letterSpacing: '-0.03em',
    margin: 0,
  },
  heroSubheading: {
    fontSize: '1.125rem',
    color: '#64748b',
    lineHeight: 1.6,
    margin: 0,
    maxWidth: '620px',
  },
  heroCtas: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  heroBrowseBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    textDecoration: 'none',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)',
  },
  heroSignInBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9375rem',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  featureIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
  },
  featureTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  featureDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
    margin: 0,
  },
};
