import type {
  SiteConfig,
  GeneralProfileConfig,
  AboutPersonaConfig,
  StatsConfig,
  Project,
  CvDocConfig,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  CertificateVerificationStatus,
  TechStackCategoryConfig,
  TechStackItem,
  ServiceItemConfig,
  FaqItemConfig,
  BlogConfig,
  SocialLinkItem,
  LanyardConfig,
  ProfileCardConfig,
  SectionKey,
  SectionConfigItem,
  NavMenuItemConfig,
  FooterConfig,
  ContactConfig,
  SeoConfig,
} from "@/lib/site-config";

export type ContentStatus = "draft" | "published" | "archived";

export interface PublicationMetadata {
  version: number;
  status: ContentStatus;
  publishedAt?: string;
  publishedBy?: string;
  draftSavedAt?: string;
  draftSavedBy?: string;
  checksum?: string;
}

export interface SectionVisibilityConfig {
  hero?: boolean;
  about?: boolean;
  journey?: boolean;
  education?: boolean;
  achievements?: boolean;
  services?: boolean;
  cv?: boolean;
  stack?: boolean;
  projects?: boolean;
  blog?: boolean;
  certificates?: boolean;
  faq?: boolean;
  contact?: boolean;
}

export interface ContentRevision {
  revisionId: string;
  version: number;
  timestamp: string;
  editor: string;
  summary: string;
  status: ContentStatus;
  changesCount?: number;
  snapshot: SiteConfig;
}

export type ProjectValidationField = "title" | "slug" | "summary" | "desc" | "image" | "url" | "titleEn";

export type ContentReadinessStatus =
  | "clean"
  | "suggestions_only"
  | "warnings_present"
  | "blocked";

export interface ContentReadinessSummary {
  status: ContentReadinessStatus;
  canPublish: boolean;
  isComplete: boolean;
  tone: "emerald" | "sky" | "amber" | "rose";
  badgeLabel: string;
  headline: string;
  footerMessage: string;
}

export interface ContentHealthIssue {
  id: string;
  dedupeKey?: string;
  field: string;
  section: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  itemId?: string;
  fieldKey?: ProjectValidationField | string;
}

export interface ContentHealthReport {
  score: number;
  canPublish: boolean;
  readinessStatus: ContentReadinessStatus;
  isComplete: boolean;
  errorsCount: number;
  warningsCount: number;
  infosCount: number;
  issues: ContentHealthIssue[];
  auditedAt: string;
}

export interface RevisionsIndexItem {
  revisionId: string;
  version: number;
  timestamp: string;
  editor: string;
  summary: string;
  changesCount: number;
  schemaVersion?: number;
  changedSections?: string[];
}

export interface RevisionCompatibilityResult {
  compatible: boolean;
  legacyMigrated: boolean;
  rawSchemaVersion: number | null;
  targetSchemaVersion: number;
  errors: string[];
}

export interface RevisionInspectSummary {
  projectsCount: number;
  publishedProjectsCount: number;
  certificatesCount: number;
  experienceCount: number;
  educationCount: number;
  manualBlogCount: number;
  changedSectionsFromActive: string[];
  matchesActiveConfig: boolean;
}

export type {
  SiteConfig,
  GeneralProfileConfig,
  AboutPersonaConfig,
  StatsConfig,
  Project,
  CvDocConfig,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  CertificateVerificationStatus,
  TechStackCategoryConfig,
  TechStackItem,
  ServiceItemConfig,
  FaqItemConfig,
  BlogConfig,
  SocialLinkItem,
  LanyardConfig,
  ProfileCardConfig,
};
