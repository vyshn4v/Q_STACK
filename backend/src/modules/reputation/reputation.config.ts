export interface ScoringConfig {
  questionUpvoteReceived: number;
  questionDownvoteReceived: number;
  answerUpvoteReceived: number;
  answerDownvoteReceived: number;
  answerAcceptedReceived: number;
  medalBronzeReceived: number;
  medalSilverReceived: number;
  medalGoldReceived: number;
  dailyLogin: number;
  moderatorAutoPromotionThreshold: number;
}

export const REPUTATION_SCORING_CONFIG: ScoringConfig = {
  questionUpvoteReceived: 5,
  questionDownvoteReceived: -2,
  answerUpvoteReceived: 10,
  answerDownvoteReceived: -2,
  answerAcceptedReceived: 15,
  medalBronzeReceived: 5,
  medalSilverReceived: 10,
  medalGoldReceived: 20,
  dailyLogin: 1,
  moderatorAutoPromotionThreshold: 500,
};

export interface SystemBadgeRule {
  name: string;
  tier: 'gold' | 'silver' | 'bronze';
  criteriaType: string;
  threshold: number;
  description: string;
}

export const DEFAULT_SYSTEM_BADGES: SystemBadgeRule[] = [
  {
    name: 'First Question',
    tier: 'bronze',
    criteriaType: 'questions_asked',
    threshold: 1,
    description: 'Asked your first question on the platform.',
  },
  {
    name: 'Curious Mind',
    tier: 'silver',
    criteriaType: 'questions_asked',
    threshold: 5,
    description: 'Asked 5 insightful programming questions.',
  },
  {
    name: 'Helpful Hand',
    tier: 'bronze',
    criteriaType: 'accepted_answers',
    threshold: 1,
    description: 'Had your first technical answer accepted as the solution.',
  },
  {
    name: 'Solver Extraordinaire',
    tier: 'silver',
    criteriaType: 'accepted_answers',
    threshold: 5,
    description: 'Had 5 answers accepted as solutions by question authors.',
  },
  {
    name: 'Problem Architect',
    tier: 'gold',
    criteriaType: 'accepted_answers',
    threshold: 15,
    description: 'Had 15 peer-reviewed answers accepted across the platform.',
  },
  {
    name: 'Bronze Contributor',
    tier: 'bronze',
    criteriaType: 'medals_received',
    threshold: 1,
    description: 'Earned your first community quality medal.',
  },
  {
    name: 'Silver Authority',
    tier: 'silver',
    criteriaType: 'medals_received',
    threshold: 3,
    description: 'Earned 3 community medals for outstanding technical questions.',
  },
  {
    name: 'Gold Mastermind',
    tier: 'gold',
    criteriaType: 'medals_received',
    threshold: 5,
    description: 'Earned 5 gold/silver medals from senior community members.',
  },
  {
    name: 'Streak Starter',
    tier: 'bronze',
    criteriaType: 'daily_logins',
    threshold: 3,
    description: 'Logged in and participated on 3 active days.',
  },
  {
    name: 'Dedicated Developer',
    tier: 'silver',
    criteriaType: 'daily_logins',
    threshold: 7,
    description: 'Maintained active platform presence across 7 distinct days.',
  },
  {
    name: 'Platform Veteran',
    tier: 'gold',
    criteriaType: 'daily_logins',
    threshold: 30,
    description: 'Participated actively across 30 distinct days.',
  },
];
