import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { User, Question, Answer, UserActivity, BadgeRule, ReputationLedgerEntry } from '../types';
import { api, isAbortError } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { FollowButton } from '../components/common/FollowButton';
import { TagAutocompleteInput } from '../components/common/TagAutocompleteInput';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Award,
  HelpCircle,
  MessageSquare,
  Star,
  Activity,
  Briefcase,
  GraduationCap,
  Loader2,
  Check,
  User as UserIcon,
  TrendingUp,
  Lock,
  Sparkles,
  Tag as TagIcon,
  Plus,
  X,
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [badgeCatalog, setBadgeCatalog] = useState<BadgeRule[]>([]);
  const [reputationLedger, setReputationLedger] = useState<ReputationLedgerEntry[]>([]);
  const [followedTags, setFollowedTags] = useState<any[]>([]);
  const [popularTags, setPopularTags] = useState<any[]>([]);
  const [isTogglingTag, setIsTogglingTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'answers' | 'topics' | 'reputation' | 'badges' | 'activity' | 'resume'>('overview');
  const [resumeSubTab, setResumeSubTab] = useState<'personal' | 'education' | 'experience'>('experience');
  const [isLoading, setIsLoading] = useState(true);

  const isSelf = authUser?.id === id;

  const loadFollowedTags = () => {
    if (!id) return;
    api.getFollowingTags(id)
      .then((tags) => setFollowedTags(tags || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setIsLoading(true);

    const promises: Promise<any>[] = [
      api.getUserProfile(id, controller.signal),
      api.getUserQuestions(id, 20, controller.signal),
      api.getUserAnswers(id, 20, controller.signal),
      api.getUserActivity(id, 30, controller.signal).catch(() => []),
      api.getBadgeCatalog(controller.signal).catch(() => []),
      api.getFollowingTags(id, controller.signal).catch(() => []),
      api.getPopularTags(controller.signal).catch(() => []),
    ];

    if (isSelf) {
      promises.push(api.getUserReputationHistory(50, controller.signal).catch(() => []));
    }

    Promise.all(promises)
      .then(([userData, qData, aData, actData, catalogData, tagsData, popData, ledgerData]) => {
        if (controller.signal.aborted) return;
        setProfile(userData);
        setQuestions(qData);
        setAnswers(aData);
        setActivities(actData);
        setBadgeCatalog(catalogData || []);
        setFollowedTags(tagsData || []);
        setPopularTags(popData || []);
        if (ledgerData) setReputationLedger(ledgerData);
      })
      .catch((err) => {
        if (!isAbortError(err)) {
          // Ignore
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id, isSelf]);

  const handleToggleTag = async (tag: { id: string; name: string }) => {
    if (!isSelf) return;
    setIsTogglingTag(tag.id);
    try {
      const res = await api.toggleFollow('tag', tag.id);
      if (res.isFollowing) {
        setFollowedTags((prev) => [...prev, { id: tag.id, name: tag.name, questions_count: 0 }]);
      } else {
        setFollowedTags((prev) => prev.filter((t) => t.id !== tag.id));
      }
    } catch {
      loadFollowedTags();
    } finally {
      setIsTogglingTag(null);
    }
  };

  if (isLoading) {
    return (
      <AppShell showSidebar={false} showRightRail={false} maxWidth="1180px">
        <div style={styles.loadingContainer}>
          <Loader2 size={32} style={styles.spinner} />
          <span>Loading developer profile...</span>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell showSidebar={false} showRightRail={false} maxWidth="1180px">
        <div style={styles.notFound}>
          <h2>User profile not found</h2>
          <p>The requested user does not exist or has been deactivated.</p>
          <Link to="/" style={styles.backBtn}>Return to Feed</Link>
        </div>
      </AppShell>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const earnedBadgeNames = (profile.badges || []).map((b) => b.name);

  return (
    <AppShell showSidebar={false} showRightRail={false} maxWidth="1180px">
      <div style={styles.container}>
        {/* Profile Card Header */}
        <div className="profile-header-wrap" style={styles.profileHeaderCard}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} style={styles.avatarImg} />
              ) : (
                <span style={styles.avatarFallback}>
                  {profile.display_name ? profile.display_name[0].toUpperCase() : 'U'}
                </span>
              )}
            </div>

            <div style={styles.headerInfo}>
              <div style={styles.nameRow}>
                <h1 style={styles.displayName}>{profile.display_name}</h1>
                <span style={styles.roleBadge}>{profile.role.replace('_', ' ')}</span>
              </div>

              {profile.bio && <p style={styles.bio}>{profile.bio}</p>}

              <div style={styles.metaRow}>
                <div style={styles.metaItem}>
                  <Calendar size={14} color="#64748b" />
                  <span>Joined {joinDate}</span>
                </div>
                <div style={styles.metaItem}>
                  <Star size={14} color="#f59e0b" />
                  <span><strong>{profile.reputation_total}</strong> reputation</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            <FollowButton targetType="user" targetId={profile.id} />
          </div>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{profile.reputation_total}</span>
            <span style={styles.statLabel}>Reputation</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{profile.questions_count || questions.length}</span>
            <span style={styles.statLabel}>Questions</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{profile.answers_count || answers.length}</span>
            <span style={styles.statLabel}>Answers</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{profile.medals_received_count || 0}</span>
            <span style={styles.statLabel}>Medals Received</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statValue}>{profile.badges?.length || 0}</span>
            <span style={styles.statLabel}>Badges Earned</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div style={styles.tabsBar}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'overview' ? styles.tabBtnActive : {}),
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'questions' ? styles.tabBtnActive : {}),
            }}
          >
            Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'answers' ? styles.tabBtnActive : {}),
            }}
          >
            Answers ({answers.length})
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'topics' ? styles.tabBtnActive : {}),
            }}
          >
            Interested Topics ({followedTags.length})
          </button>
          {isSelf && (
            <button
              onClick={() => setActiveTab('reputation')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'reputation' ? styles.tabBtnActive : {}),
              }}
            >
              Reputation Ledger
            </button>
          )}
          <button
            onClick={() => setActiveTab('badges')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'badges' ? styles.tabBtnActive : {}),
            }}
          >
            Badges ({profile.badges?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'activity' ? styles.tabBtnActive : {}),
            }}
          >
            Activity Feed
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'resume' ? styles.tabBtnActive : {}),
            }}
          >
            Resume & Credentials
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContentArea}>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div style={styles.overviewGrid}>
              <div style={styles.overviewSection}>
                <h3 style={styles.sectionHeading}>Recent Questions</h3>
                {questions.length === 0 ? (
                  <p style={styles.emptyNote}>No questions posted yet.</p>
                ) : (
                  <div style={styles.miniList}>
                    {questions.slice(0, 5).map((q) => (
                      <div key={q.id} style={styles.miniItem}>
                        <span style={styles.miniScore}>{q.score} votes</span>
                        <Link to={`/questions/${q.id}`} style={styles.miniLink}>
                          {q.title}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.overviewSection}>
                <h3 style={styles.sectionHeading}>Recent Answers</h3>
                {answers.length === 0 ? (
                  <p style={styles.emptyNote}>No answers posted yet.</p>
                ) : (
                  <div style={styles.miniList}>
                    {answers.slice(0, 5).map((a) => (
                      <div key={a.id} style={styles.miniItem}>
                        <span style={styles.miniScore}>{a.score} votes</span>
                        <Link to={`/questions/${a.question_id}`} style={styles.miniLink}>
                          {a.question_title || 'View Answer Thread'}
                        </Link>
                        {a.is_accepted && <Check size={14} color="#059669" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.overviewSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={styles.sectionHeading}>Interested Topics</h3>
                  <button onClick={() => setActiveTab('topics')} style={styles.viewAllBtn}>
                    Manage &rarr;
                  </button>
                </div>
                {followedTags.length === 0 ? (
                  <p style={styles.emptyNote}>No interested topics followed yet.</p>
                ) : (
                  <div style={styles.overviewTagsRow}>
                    {followedTags.map((t) => (
                      <Link
                        key={t.id}
                        to={`/questions?tag=${encodeURIComponent(t.name)}`}
                        style={styles.overviewTagChip}
                      >
                        #{t.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Questions */}
          {activeTab === 'questions' && (
            <div style={styles.listSection}>
              {questions.length === 0 ? (
                <div style={styles.emptyState}>
                  <HelpCircle size={32} color="#94a3b8" />
                  <p>This developer has not asked any questions yet.</p>
                </div>
              ) : (
                questions.map((q) => (
                  <div key={q.id} style={styles.questionRow}>
                    <div style={styles.rowScores}>
                      <span style={styles.scoreNumber}>{q.score}</span>
                      <span style={styles.scoreLabel}>votes</span>
                    </div>
                    <div style={styles.rowMain}>
                      <Link to={`/questions/${q.id}`} style={styles.questionTitleLink}>
                        {q.title}
                      </Link>
                      <div style={styles.rowTags}>
                        {q.tags &&
                          q.tags.map((t) => (
                            <span key={t.id || t.name} style={styles.tagBadge}>
                              #{t.name}
                            </span>
                          ))}
                      </div>
                    </div>
                    <span style={styles.rowDate}>
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Answers */}
          {activeTab === 'answers' && (
            <div style={styles.listSection}>
              {answers.length === 0 ? (
                <div style={styles.emptyState}>
                  <MessageSquare size={32} color="#94a3b8" />
                  <p>This developer has not posted any answers yet.</p>
                </div>
              ) : (
                answers.map((a) => (
                  <div key={a.id} style={styles.questionRow}>
                    <div style={styles.rowScores}>
                      <span style={styles.scoreNumber}>{a.score}</span>
                      <span style={styles.scoreLabel}>votes</span>
                    </div>
                    <div style={styles.rowMain}>
                      <Link to={`/questions/${a.question_id}`} style={styles.questionTitleLink}>
                        {a.question_title || 'View Answer Thread'}
                      </Link>
                      <p style={styles.answerSnippet}>{a.body.replace(/<[^>]*>/g, '').slice(0, 160)}...</p>
                    </div>
                    {a.is_accepted && (
                      <span style={styles.acceptedTag}>
                        <Check size={13} /> Accepted
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Interested Topics & Watched Tags */}
          {activeTab === 'topics' && (
            <div style={styles.listSection}>
              <div style={styles.topicsHeaderCard}>
                <div style={styles.topicsHeaderIcon}>
                  <TagIcon size={22} color="#2563eb" />
                </div>
                <div>
                  <strong style={{ fontSize: '1.0625rem', color: '#0f172a', display: 'block' }}>
                    Interested Topics & Watched Tags
                  </strong>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0 0', lineHeight: 1.4 }}>
                    Tags you follow help customize your <strong>Home Feed</strong> under <em>"⭐ For You (My Topics)"</em>, and prioritize notifications for relevant questions in your stack.
                  </p>
                </div>
              </div>

              {/* Current Watched Tags Grid */}
              <div style={styles.watchedTopicsContainer}>
                <h4 style={styles.subHeading}>
                  Currently Watched Topics ({followedTags.length})
                </h4>

                {followedTags.length === 0 ? (
                  <div style={styles.emptyTopicBox}>
                    <TagIcon size={32} color="#94a3b8" />
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                      {isSelf
                        ? 'You haven’t added any interested topics yet. Follow tags below to personalize your developer experience!'
                        : 'This developer has not selected any public topics yet.'}
                    </p>
                  </div>
                ) : (
                  <div style={styles.tagsGrid}>
                    {followedTags.map((tag) => (
                      <div key={tag.id} style={styles.tagCard}>
                        <div style={styles.tagCardHeader}>
                          <Link to={`/questions?tag=${encodeURIComponent(tag.name)}`} style={styles.tagNameLink}>
                            #{tag.name}
                          </Link>
                          {isSelf && (
                            <button
                              onClick={() => handleToggleTag(tag)}
                              disabled={isTogglingTag === tag.id}
                              style={styles.removeTagBtn}
                              title="Remove from watched topics"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                        {tag.description && (
                          <p style={styles.tagCardDesc}>{tag.description}</p>
                        )}
                        <span style={styles.tagCardCount}>
                          {tag.questions_count || 0} questions tagged
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Topics (isSelf only) */}
              {isSelf && (
                <div style={styles.addTopicsSection}>
                  <h4 style={styles.subHeading}>Search & Follow Topics in Database</h4>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
                    Type to search any technology tag present in QStack database to add to your interests:
                  </p>

                  <TagAutocompleteInput
                    selectedTags={followedTags.map((t) => t.name)}
                    onAddTag={async (tagName) => {
                      const found = popularTags.find((pt) => pt.name.toLowerCase() === tagName.toLowerCase());
                      if (found) {
                        handleToggleTag(found);
                      } else {
                        // Look up tag or toggle by name
                        try {
                          const res = await api.getTags(tagName);
                          const exact = res.find((r) => r.name.toLowerCase() === tagName.toLowerCase());
                          if (exact) {
                            handleToggleTag(exact);
                          }
                        } catch {
                          // Ignore
                        }
                      }
                    }}
                    onRemoveTag={(tagName) => {
                      const found = followedTags.find((ft) => ft.name.toLowerCase() === tagName.toLowerCase());
                      if (found) handleToggleTag(found);
                    }}
                    maxTags={30}
                    placeholder="Search database tags (e.g. react, postgresql, docker, go, rust)..."
                  />

                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Suggested Popular Topics:
                    </span>
                    <div style={styles.availableTagsRow}>
                      {popularTags
                        .filter((pt) => !followedTags.some((ft) => ft.id === pt.id || ft.name?.toLowerCase() === pt.name?.toLowerCase()))
                        .slice(0, 14)
                        .map((pt) => (
                          <button
                            key={pt.id}
                            onClick={() => handleToggleTag(pt)}
                            disabled={isTogglingTag === pt.id}
                            style={styles.addTagChip}
                          >
                            <Plus size={13} color="#2563eb" />
                            <span>#{pt.name}</span>
                            <span style={styles.chipCount}>{pt.questions_count || 0}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reputation Ledger (Phase 3) */}
          {activeTab === 'reputation' && (
            <div style={styles.listSection}>
              <div style={styles.ledgerHeaderCard}>
                <TrendingUp size={20} color="#2563eb" />
                <div>
                  <strong>Reputation History & Audit Trail</strong>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
                    Reputation points are calculated nightly at 1:00 AM UTC based on votes, accepted solutions, medals, and streaks.
                  </p>
                </div>
              </div>

              {reputationLedger.length === 0 ? (
                <div style={styles.emptyState}>
                  <Star size={32} color="#94a3b8" />
                  <p>No reputation changes recorded yet. Points will accumulate as other developers vote and endorse your posts.</p>
                </div>
              ) : (
                reputationLedger.map((entry) => (
                  <div key={entry.id} style={styles.ledgerRow}>
                    <div
                      style={{
                        ...styles.deltaBadge,
                        backgroundColor: entry.delta >= 0 ? '#ecfdf5' : '#fef2f2',
                        color: entry.delta >= 0 ? '#059669' : '#dc2626',
                        borderColor: entry.delta >= 0 ? '#a7f3d0' : '#fecaca',
                      }}
                    >
                      {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                    </div>
                    <div style={styles.ledgerInfo}>
                      <strong style={styles.ledgerReason}>{entry.reason}</strong>
                      <span style={styles.ledgerDate}>
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Badges (Phase 3) */}
          {activeTab === 'badges' && (
            <div style={styles.badgesSection}>
              <div style={styles.badgesIntro}>
                <Sparkles size={18} color="#f59e0b" />
                <span>
                  Badges recognize active participation, peer-reviewed solutions, and quality problem formulation.
                </span>
              </div>

              <div style={styles.badgesGrid}>
                {badgeCatalog.map((rule) => {
                  const isEarned = earnedBadgeNames.includes(rule.name);
                  const earnedInfo = profile.badges?.find((b) => b.name === rule.name);

                  return (
                    <div
                      key={rule.id || rule.name}
                      style={{
                        ...styles.badgeCard,
                        backgroundColor: isEarned ? '#ffffff' : '#f8fafc',
                        borderColor: isEarned
                          ? rule.tier === 'gold'
                            ? '#fef08a'
                            : rule.tier === 'silver'
                            ? '#cbd5e1'
                            : '#fed7aa'
                          : '#e2e8f0',
                        opacity: isEarned ? 1 : 0.75,
                      }}
                    >
                      <div
                        style={{
                          ...styles.badgeIconWrapper,
                          backgroundColor: isEarned
                            ? rule.tier === 'gold'
                              ? '#fefce8'
                              : rule.tier === 'silver'
                              ? '#f1f5f9'
                              : '#fffbeb'
                            : '#f1f5f9',
                        }}
                      >
                        {isEarned ? (
                          <Award
                            size={24}
                            color={
                              rule.tier === 'gold'
                                ? '#eab308'
                                : rule.tier === 'silver'
                                ? '#64748b'
                                : '#d97706'
                            }
                          />
                        ) : (
                          <Lock size={20} color="#94a3b8" />
                        )}
                      </div>

                      <div style={styles.badgeInfo}>
                        <div style={styles.badgeNameRow}>
                          <strong style={styles.badgeName}>{rule.name}</strong>
                          <span
                            style={{
                              ...styles.badgeTier,
                              color:
                                rule.tier === 'gold'
                                  ? '#854d0e'
                                  : rule.tier === 'silver'
                                  ? '#475569'
                                  : '#9a3412',
                            }}
                          >
                            {rule.tier.toUpperCase()}
                          </span>
                        </div>
                        <p style={styles.badgeDesc}>{rule.description}</p>
                        {isEarned && earnedInfo && (
                          <span style={styles.awardedDate}>
                            Earned on {new Date(earnedInfo.awarded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {activeTab === 'activity' && (
            <div style={styles.listSection}>
              {activities.length === 0 ? (
                <div style={styles.emptyState}>
                  <Activity size={32} color="#94a3b8" />
                  <p>No recent public activity recorded.</p>
                </div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} style={styles.activityItem}>
                    <Activity size={16} color="#2563eb" />
                    <span style={styles.activityType}>{act.event_type.replace('.', ' ')}</span>
                    <span style={styles.activityDate}>
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Resume & Experience */}
          {activeTab === 'resume' && (
            <div style={styles.resumeContainer}>
              <div style={styles.resumeNav}>
                <button
                  onClick={() => setResumeSubTab('experience')}
                  style={{
                    ...styles.resumeNavBtn,
                    ...(resumeSubTab === 'experience' ? styles.resumeNavBtnActive : {}),
                  }}
                >
                  <Briefcase size={15} />
                  <span>Work Experience</span>
                </button>
                <button
                  onClick={() => setResumeSubTab('education')}
                  style={{
                    ...styles.resumeNavBtn,
                    ...(resumeSubTab === 'education' ? styles.resumeNavBtnActive : {}),
                  }}
                >
                  <GraduationCap size={15} />
                  <span>Education & Certifications</span>
                </button>
                <button
                  onClick={() => setResumeSubTab('personal')}
                  style={{
                    ...styles.resumeNavBtn,
                    ...(resumeSubTab === 'personal' ? styles.resumeNavBtnActive : {}),
                  }}
                >
                  <UserIcon size={15} />
                  <span>Personal Details</span>
                </button>
              </div>

              <div style={styles.resumeBody}>
                {resumeSubTab === 'experience' && (
                  <div style={styles.resumeCard}>
                    <h4 style={styles.resumeSectionTitle}>Engineering Experience</h4>
                    <p style={styles.resumeNote}>
                      {profile.display_name} specializes in full-stack web architecture, distributed caching with Redis, and raw SQL optimization.
                    </p>
                    <div style={styles.experienceItem}>
                      <strong>Active Open-Source Contributor</strong>
                      <span style={styles.expRole}>QStack Knowledge Platform • 2026 – Present</span>
                      <p style={styles.expDesc}>
                        Contributing technical answers, peer-reviewed solutions, and architectural endorsements.
                      </p>
                    </div>
                  </div>
                )}

                {resumeSubTab === 'education' && (
                  <div style={styles.resumeCard}>
                    <h4 style={styles.resumeSectionTitle}>Education & Technical Credentials</h4>
                    <div style={styles.experienceItem}>
                      <strong>Software Engineering & Systems Architecture</strong>
                      <span style={styles.expRole}>Community Verified Developer</span>
                    </div>
                  </div>
                )}

                {resumeSubTab === 'personal' && (
                  <div style={styles.resumeCard}>
                    <h4 style={styles.resumeSectionTitle}>Developer Profile Details</h4>
                    <div style={styles.personalList}>
                      <div style={styles.personalRow}>
                        <span>Display Name:</span>
                        <strong>{profile.display_name}</strong>
                      </div>
                      <div style={styles.personalRow}>
                        <span>Role Tier:</span>
                        <strong>{profile.role.toUpperCase()}</strong>
                      </div>
                      <div style={styles.personalRow}>
                        <span>Member Since:</span>
                        <strong>{joinDate}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
  profileHeaderCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '1.5rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    border: '2px solid #bfdbfe',
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
    fontSize: '2rem',
    fontWeight: 800,
    color: '#2563eb',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  displayName: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  roleBadge: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
  },
  bio: {
    fontSize: '0.875rem',
    color: '#475569',
    maxWidth: '540px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    fontSize: '0.8125rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  headerRight: {
    marginLeft: 'auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '1rem',
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.125rem',
  },
  tabsBar: {
    display: 'flex',
    gap: '0.375rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.5rem',
    overflowX: 'auto',
  },
  tabBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
  },
  tabContentArea: {
    minHeight: '280px',
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  overviewSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '1.25rem',
  },
  sectionHeading: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '1rem',
  },
  emptyNote: {
    fontSize: '0.8125rem',
    color: '#94a3b8',
  },
  miniList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  miniItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.8125rem',
  },
  miniScore: {
    color: '#64748b',
    fontWeight: 600,
    minWidth: '60px',
  },
  miniLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500,
    flexGrow: 1,
  },
  listSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  questionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  rowScores: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '50px',
  },
  scoreNumber: {
    fontWeight: 700,
    fontSize: '0.9375rem',
    color: '#0f172a',
  },
  scoreLabel: {
    fontSize: '0.6875rem',
    color: '#64748b',
  },
  rowMain: {
    flexGrow: 1,
  },
  questionTitleLink: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: '#1e293b',
    textDecoration: 'none',
  },
  answerSnippet: {
    fontSize: '0.8125rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  rowTags: {
    display: 'flex',
    gap: '0.375rem',
    marginTop: '0.375rem',
  },
  tagBadge: {
    fontSize: '0.6875rem',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
  },
  rowDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginLeft: 'auto',
  },
  acceptedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  ledgerHeaderCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
  },
  ledgerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.875rem 1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  deltaBadge: {
    fontSize: '0.875rem',
    fontWeight: 800,
    padding: '0.25rem 0.625rem',
    borderRadius: '6px',
    border: '1px solid transparent',
    minWidth: '45px',
    textAlign: 'center',
  },
  ledgerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  ledgerReason: {
    fontSize: '0.875rem',
    color: '#1e293b',
  },
  ledgerDate: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  badgesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  badgesIntro: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#475569',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef08a',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem',
  },
  badgeCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.875rem',
    padding: '1.125rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.15s ease',
  },
  badgeIconWrapper: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeInfo: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  badgeNameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeName: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  badgeTier: {
    fontSize: '0.625rem',
    fontWeight: 800,
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
  },
  badgeDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: 1.4,
  },
  awardedDate: {
    fontSize: '0.6875rem',
    color: '#059669',
    fontWeight: 600,
    marginTop: '0.25rem',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.875rem 1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.8125rem',
  },
  activityType: {
    textTransform: 'capitalize',
    fontWeight: 600,
    color: '#1e293b',
    flexGrow: 1,
  },
  activityDate: {
    color: '#94a3b8',
    fontSize: '0.75rem',
  },
  resumeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  resumeNav: {
    display: 'flex',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  resumeNavBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.75rem 1.25rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#64748b',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  resumeNavBtnActive: {
    color: '#2563eb',
    backgroundColor: '#ffffff',
    borderBottom: '2px solid #2563eb',
  },
  resumeBody: {
    padding: '1.5rem',
  },
  resumeCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  resumeSectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  resumeNote: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  experienceItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.875rem',
  },
  expRole: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  expDesc: {
    fontSize: '0.8125rem',
    color: '#475569',
    marginTop: '0.25rem',
  },
  personalList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    fontSize: '0.875rem',
  },
  personalRow: {
    display: 'flex',
    gap: '1rem',
    color: '#475569',
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
    padding: '3rem 1rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px dashed #cbd5e1',
    gap: '0.5rem',
    color: '#64748b',
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
  topicsHeaderCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1.25rem',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  topicsHeaderIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  watchedTopicsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  subHeading: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  emptyTopicBox: {
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
  },
  tagsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1rem',
  },
  tagCard: {
    padding: '1rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  tagCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagNameLink: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#2563eb',
    textDecoration: 'none',
  },
  removeTagBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  tagCardDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
  },
  tagCardCount: {
    fontSize: '0.6875rem',
    color: '#94a3b8',
    fontWeight: 600,
    marginTop: '0.25rem',
  },
  addTopicsSection: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  tagSearchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    maxWidth: '460px',
  },
  tagSearchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    width: '100%',
  },
  availableTagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  addTagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '20px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#0f172a',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  chipCount: {
    fontSize: '0.6875rem',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '0.1rem 0.35rem',
    borderRadius: '10px',
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '0.8125rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  overviewTagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  overviewTagChip: {
    padding: '0.25rem 0.625rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
