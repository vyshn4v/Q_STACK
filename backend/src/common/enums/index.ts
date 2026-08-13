export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum ReportStatus {
  REPORTED = 'reported',
  MODERATOR_REVIEW = 'moderator_review',
  ADMIN_REVIEW = 'admin_review',
  SUPER_ADMIN_REVIEW = 'super_admin_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum EscalationLevel {
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Tier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
}

export enum TargetType {
  QUESTION = 'question',
  ANSWER = 'answer',
  COMMENT = 'comment',
  USER = 'user',
  TAG = 'tag',
}
