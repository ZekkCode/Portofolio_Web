import type {
  SiteConfig,
  GeneralProfileConfig,
  StatsConfig,
  Project,
  CvDocConfig,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
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

export interface ContentHealthIssue {
  id: string;
  field: string;
  section: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

export interface ContentHealthReport {
  score: number;
  canPublish: boolean;
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
}

export type {
  SiteConfig,
  GeneralProfileConfig,
  StatsConfig,
  Project,
  CvDocConfig,
  EducationItem,
  ExperienceItem,
  AchievementItem,
  CertificateItem,
  TechStackItem,
  ServiceItemConfig,
  FaqItemConfig,
  BlogConfig,
  SocialLinkItem,
  LanyardConfig,
  ProfileCardConfig,
};
