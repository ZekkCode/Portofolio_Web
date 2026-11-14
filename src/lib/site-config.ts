import { profile } from "@/lib/profile";

export type LanyardConfig = {
  frontImage: string;
  backImage: string;
  strapImage: string;
  imageFit: "cover" | "contain";
  cardColor: string;
  orientation: "portrait" | "landscape";
  finish: "glossy" | "matte" | "holographic" | "metallic";
  cornerRadius: number;
  size: number;
  anchor: "left" | "center" | "right";
  strapLength: number;
  strapColor: string;
  strapWidth: number;
  metal: "graphite" | "silver" | "gold";
  gravity: number;
  damping: number;
  elasticity: number;
  breeze: number;
  interactive: boolean;
  intro: boolean;
};

export type ProfileCardConfig = {
  avatarUrl: string;
  iconUrl: string;
  miniAvatarUrl: string;
  imageFit?: "cover" | "contain";
  name: string;
  title: string;
  handle: string;
  status: string;
  statusColor: string;
  contactText: string;
  showUserInfo: boolean;
  theme: "dark" | "light";
  backdropColor: string;
  radius: number;
  holo: number;
  glare: number;
  enableTilt: boolean;
  tiltStrength: number;
  parallax: number;
  enableMobileTilt: boolean;
  mobileTiltSensitivity: number;
  intro: boolean;
};

export type SocialLinkItem = {
  id: string;
  platform: string;
  label: string;
  href: string;
  iconUrl?: string;
  visible?: boolean;
  sortOrder?: number;
  showInContact?: boolean;
  showInFooter?: boolean;
};

export type AboutPersonaConfig = {
  frontImage?: string;
  backImage?: string;
  frontLabelId?: string;
  frontLabelEn?: string;
  frontCaptionId?: string;
  frontCaptionEn?: string;
  backLabelId?: string;
  backLabelEn?: string;
  backCaptionId?: string;
  backCaptionEn?: string;
};

export type GeneralProfileConfig = {
  name: string;
  nameEn?: string;
  nickname: string;
  brand: string;
  roles: string;
  rolesEn: string;
  heroDesc: string;
  heroDescEn: string;
  bio: string[];
  bioEn: string[];
  avatarUrl: string;
  location: string;
  locationEn: string;
  availability: string;
  availabilityEn: string;
  availabilityStatus?: "available" | "busy" | "unavailable" | "hidden";
  since?: string;
  githubUsername?: string;
  email: string;
  phone: string;
  whatsapp: string;
  site?: string;
  ctaPrimaryLabelId?: string;
  ctaPrimaryLabelEn?: string;
  ctaPrimaryHref?: string;
  ctaSecondaryLabelId?: string;
  ctaSecondaryLabelEn?: string;
  ctaSecondaryHref?: string;
  aboutPersona?: AboutPersonaConfig;
  socials: SocialLinkItem[];
};

export type StatsConfig = {
  mode: "auto" | "manual";
  overlappingRule?: "merge_intervals" | "since_year";
  sinceYear?: number;
  includeAchievementsInCerts?: boolean;
  projectsCount: number;
  certificatesCount: number;
  experienceYears: string;
  organizationsCount: number;
};

export type ProjectCategoryConfig = {
  id: string;
  key: string;
  labelId: string;
  labelEn: string;
  sortOrder?: number;
  visible?: boolean;
};

export type Project = {
  id: string;
  slug?: string;
  title: string;
  titleEn?: string;
  summary?: string;
  summaryEn?: string;
  desc: string;
  descEn?: string;
  category?: string;
  tags: string[];
  techIds?: string[];
  repo: string;
  role?: string;
  roleEn?: string;
  period?: string;
  status?: "completed" | "in-progress" | "archived" | "concept";
  collaborators?: string[];
  caseStudyUrl?: string;
  problem?: string;
  problemEn?: string;
  approach?: string;
  approachEn?: string;
  highlight?: string;
  outcome?: string;
  outcomeEn?: string;
  architecture?: string;
  architectureEn?: string;
  image?: string;
  imageAlt?: string;
  logo?: string;
  galleryImages?: string[];
  galleryAlts?: string[];
  previewUrl?: string;
  featured?: boolean;
  published?: boolean;
  visible?: boolean;
  sortOrder?: number;
};

export type CvDocConfig = {
  id: string;
  roleKey: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  description?: string;
  descriptionEn?: string;
  summary?: string;
  summaryEn?: string;
  color: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  versionLabel?: string;
  updatedAt?: string;
  allowDownload?: boolean;
  downloadFilename?: string;
  pageCount?: number;
  pages?: string[];
  skills?: string[];
  tools?: string[];
  responsibilities?: string[];
  responsibilitiesEn?: string[];
  keyProjects?: string[];
  visible?: boolean;
  published?: boolean;
  sortOrder?: number;
};

export type CvSettingsConfig = {
  allowDownload: boolean;
  folderLabel?: string;
  folderHintId?: string;
  folderHintEn?: string;
  previewCtaId?: string;
  previewCtaEn?: string;
  downloadLabelId?: string;
  downloadLabelEn?: string;
};

export type AcademicProject = {
  id?: string;
  title: string;
  desc?: string;
  descEn?: string;
  repo?: string;
  url?: string;
};

export type EducationItem = {
  id: string;
  institution: string;
  location: string;
  program: string;
  programEn?: string;
  degree: string;
  degreeEn?: string;
  period: string;
  startYear: number;
  endYear?: number | null;
  status: string;
  statusEn?: string;
  current: boolean;
  focus?: string[];
  focusEn?: string[];
  activities?: string[];
  activitiesEn?: string[];
  projects?: AcademicProject[];
  desc?: string;
  descEn?: string;
  logo?: string;
  website?: string;
  timelineYear?: number;
  showInTimeline?: boolean;
  published?: boolean;
  visible?: boolean;
  sortOrder?: number;
};

export type ExperienceMediaItem = {
  id?: string;
  url: string;
  caption?: string;
  captionEn?: string;
  type?: "image" | "pdf";
};

export type ExperienceItem = {
  id: string;
  role: string;
  roleEn?: string;
  org: string;
  orgGroup?: string;
  orgUrl?: string;
  type?: "organization" | "work" | "internship" | "volunteer" | "community" | "freelance";
  place: string;
  placeEn?: string;
  period: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  desc: string;
  descEn?: string;
  logo?: string;
  highlights?: string[];
  highlightsEn?: string[];
  responsibilities?: string[];
  responsibilitiesEn?: string[];
  achievements?: string[];
  achievementsEn?: string[];
  media?: ExperienceMediaItem[];
  showInTimeline?: boolean;
  timelineLabel?: string;
  published?: boolean;
  visible?: boolean;
  sortOrder?: number;
};

export type AchievementItem = {
  id: string;
  title: string;
  titleEn?: string;
  organizer: string;
  organizerLogo?: string;
  category: "award" | "competition" | "ambassador" | "program" | "leadership";
  date: string;
  desc: string;
  descEn?: string;
  image?: string;
  evidenceUrl?: string;
  evidencePdf?: string;
  featured?: boolean;
  published?: boolean;
  visible?: boolean;
  sortOrder?: number;
};

export type CertificateItem = {
  id: string;
  title: string;
  titleEn?: string;
  issuer: string;
  issuerLogo?: string;
  desc?: string;
  descEn?: string;
  date: string;
  credentialUrl?: string;
  credentialPdf?: string;
  credentialId?: string;
  issuedDate?: string;
  expiryDate?: string;
  category: string;
  image?: string;
  featured?: boolean;
  allowDownload?: boolean;
  published?: boolean;
  visible?: boolean;
  sortOrder?: number;
};

export type TechStackCategoryConfig = {
  id?: string;
  key: string;
  labelId: string;
  labelEn: string;
  sortOrder?: number;
  visible?: boolean;
};

export type TechStackItem = {
  id: string;
  name: string;
  category: string;
  icon: string;
  url?: string;
  desc?: string;
  descEn?: string;
  sortOrder?: number;
  visible?: boolean;
  published?: boolean;
  showInMarquee?: boolean;
  showInGrid?: boolean;
};

export type ServiceItemConfig = {
  id: string;
  key: string;
  num: string;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  iconName: string;
  iconUrl?: string;
  deliverablesId?: string[];
  deliverablesEn?: string[];
  ctaLabelId?: string;
  ctaLabelEn?: string;
  sortOrder?: number;
  visible?: boolean;
  published?: boolean;
  ctaUrl?: string;
};

export type FaqItemConfig = {
  id: string;
  questionId: string;
  questionEn: string;
  answerId: string;
  answerEn: string;
  category?: string;
  sortOrder?: number;
  visible?: boolean;
  published?: boolean;
};

export type ManualBlogPostConfig = {
  id: string;
  slug?: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  coverImage?: string;
  coverAlt?: string;
  url: string;
  category: string;
  date: string;
  readTime?: string;
  featured?: boolean;
  pinned?: boolean;
  sortOrder?: number;
  published?: boolean;
  visible?: boolean;
};

export type SyncedBlogPostOverride = {
  hidden?: boolean;
  title?: string;
  titleEn?: string;
  excerpt?: string;
  excerptEn?: string;
  coverImage?: string;
  category?: string;
  featured?: boolean;
  pinned?: boolean;
  sortOrder?: number;
  manuallyEdited?: boolean;
  updatedAt?: string;
};

export type BlogConfig = {
  feedUrl: string;
  portalUrl?: string;
  sourceMode?: "hybrid" | "manual" | "sync";
  displayCount: number;
  visible: boolean;
  published?: boolean;
  titleId?: string;
  titleEn?: string;
  descId?: string;
  descEn?: string;
  ctaLabelId?: string;
  ctaLabelEn?: string;
  manualPosts?: ManualBlogPostConfig[];
  syncedPosts?: ManualBlogPostConfig[];
  syncedOverrides?: Record<string, SyncedBlogPostOverride>;
  lastSyncedAt?: string;
};

export type SectionKey =
  | "hero"
  | "about"
  | "journey"
  | "achievements"
  | "services"
  | "cv"
  | "stack"
  | "projects"
  | "blog"
  | "certificates"
  | "faq"
  | "contact";

export type SectionConfigItem = {
  visible: boolean;
  sortOrder?: number;
  customTitle?: string;
  eyebrowId?: string;
  eyebrowEn?: string;
  titleId?: string;
  titleEn?: string;
  descId?: string;
  descEn?: string;
  ctaLabelId?: string;
  ctaLabelEn?: string;
  ctaHref?: string;
};

export type NavMenuItemConfig = {
  id: string;
  labelId: string;
  labelEn: string;
  href: string;
  sectionKey?: SectionKey;
  iconName?: string;
  visible: boolean;
  sortOrder: number;
  isExternal?: boolean;
  openInNewTab?: boolean;
};

export type FooterConfig = {
  brandText?: string;
  emailLabelId?: string;
  emailLabelEn?: string;
  directEmailLabel?: string;
  locationText?: string;
  copyrightName?: string;
  taglineId?: string;
  taglineEn?: string;
  watermarkText?: string;
  showWatermark?: boolean;
  showSocials?: boolean;
  showEmail?: boolean;
};

export type ContactConfig = {
  badgeId?: string;
  badgeEn?: string;
  titleId?: string;
  titleEn?: string;
  descId?: string;
  descEn?: string;
  emailCtaId?: string;
  emailCtaEn?: string;
  secondaryCtaId?: string;
  secondaryCtaEn?: string;
  secondaryHref?: string;
  showProfileCard?: boolean;
};

export type SeoConfig = {
  metaTitle?: string;
  metaTitleEn?: string;
  metaDesc?: string;
  metaDescEn?: string;
  keywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  canonicalUrl?: string;
  robotsIndex?: boolean;
  personJobTitle?: string;
};

export type SiteConfig = {
  version?: number;
  schemaVersion?: number;
  updatedAt?: string;
  headerLogoUrl: string;
  generalProfile: GeneralProfileConfig;
  stats: StatsConfig;
  lanyard: LanyardConfig;
  profileCard: ProfileCardConfig;
  projects: Project[];
  projectCategories?: ProjectCategoryConfig[];
  cvDocs: CvDocConfig[];
  cvSettings?: CvSettingsConfig;
  education: EducationItem[];
  experience: ExperienceItem[];
  achievements: AchievementItem[];
  certificates: CertificateItem[];
  techStack: TechStackItem[];
  techStackCategories?: TechStackCategoryConfig[];
  services: ServiceItemConfig[];
  faq: FaqItemConfig[];
  blog: BlogConfig;
  seo?: SeoConfig;
  sections?: Record<string, SectionConfigItem>;
  sectionOrder?: SectionKey[];
  navigation?: NavMenuItemConfig[];
  footer?: FooterConfig;
  contactSection?: ContactConfig;
};

export const defaultLanyard: LanyardConfig = {
  frontImage: "/card-front-v2.webp",
  backImage: "/card-back-v2.webp",
  strapImage: "",
  imageFit: "cover",
  cardColor: "#0b2a8a",
  orientation: "portrait",
  finish: "glossy",
  cornerRadius: 0.25,
  size: 0.58,
  anchor: "center",
  strapLength: 0.16,
  strapColor: "#123a9e",
  strapWidth: 0.65,
  metal: "silver",
  gravity: 1,
  damping: 0.5,
  elasticity: 0.5,
  breeze: 0.18,
  interactive: true,
  intro: true,
};

export const defaultProfileCard: ProfileCardConfig = {
  avatarUrl: "",
  iconUrl: "",
  miniAvatarUrl: "",
  imageFit: "cover",
  name: profile.name,
  title: profile.roles,
  handle: "zekksparow",
  status: "Online",
  statusColor: "#22c55e",
  contactText: "Contact",
  showUserInfo: true,
  theme: "dark",
  backdropColor: "",
  radius: 16,
  holo: 0.8,
  glare: 0.5,
  enableTilt: true,
  tiltStrength: 12,
  parallax: 8,
  enableMobileTilt: false,
  mobileTiltSensitivity: 5,
  intro: true,
};

export const defaultGeneralProfile: GeneralProfileConfig = {
  name: profile.name,
  nameEn: profile.name,
  nickname: profile.nickname,
  brand: profile.brand,
  roles: "UI/UX Designer & Frontend Developer",
  rolesEn: "UI/UX Designer & Frontend Developer",
  heroDesc:
    "Mahasiswa Teknik Informatika asal Mojokerto. Merancang antarmuka di Figma, membangun aplikasi web dengan Next.js & TypeScript, serta mengeksplorasi interaksi 3D fisik.",
  heroDescEn:
    "Informatics student from Mojokerto. Designing interfaces in Figma, developing responsive web applications with Next.js & TypeScript, and exploring physical 3D interactions.",
  bio: [
    "Mahasiswa Teknik Informatika Universitas Trunojoyo Madura (angkatan 2024) yang mendalami UI/UX design dan rekayasa frontend web sejak 2020. Terbiasa merancang design system di Figma dan mengimplementasikannya ke Next.js serta TypeScript.",
    "Memiliki latar belakang desain grafis, multimedia, serta perakitan dan pemeliharaan perangkat komputer. Berpengalaman merancang antarmuka web yang terstruktur, cepat, dan mudah digunakan untuk organisasi kampus dan klien.",
  ],
  bioEn: [
    "Informatics Engineering student at Universitas Trunojoyo Madura (class of 2024) specializing in UI/UX design and frontend web engineering since 2020. Experienced in crafting design systems in Figma and translating them into robust Next.js and TypeScript applications.",
    "Rooted in graphic design, multimedia, and computer hardware maintenance. Proven track record in delivering clean, responsive, and accessible web interfaces for campus organizations and freelance clients.",
  ],
  avatarUrl: "/card-front-v2.webp",
  location: "Mojokerto, Jawa Timur",
  locationEn: "Mojokerto, East Java, Indonesia",
  availability: "Terbuka untuk kolaborasi & proyek freelance",
  availabilityEn: "Open for collaboration & freelance projects",
  availabilityStatus: "available",
  since: profile.since || "2020",
  githubUsername: "ZekkCode",
  email: profile.contact.email,
  phone: profile.contact.phone,
  whatsapp: profile.contact.whatsapp,
  site: profile.site || "https://zakariamp.vercel.app",
  ctaPrimaryLabelId: "Kirim Email",
  ctaPrimaryLabelEn: "Send Email",
  ctaPrimaryHref: `mailto:${profile.contact.email}`,
  ctaSecondaryLabelId: "Folder Berkas Karir",
  ctaSecondaryLabelEn: "Career Files",
  ctaSecondaryHref: "#cv",
  aboutPersona: {
    frontImage: "/card-front-v2.webp",
    backImage: "/card-back-v2.webp",
    frontLabelId: "Frontend Dev",
    frontLabelEn: "Frontend Dev",
    frontCaptionId: "Antarmuka web & rekayasa interaktif",
    frontCaptionEn: "Web interfaces & interactive engineering",
    backLabelId: "Graphic Designer",
    backLabelEn: "Graphic Designer",
    backCaptionId: "Identitas visual & sistem multimedia",
    backCaptionEn: "Visual identity & multimedia systems",
  },
  socials: [
    { id: "soc-1", platform: "github", label: "GitHub", href: "https://github.com/ZekkCode", visible: true, sortOrder: 1, showInContact: true, showInFooter: true },
    { id: "soc-2", platform: "instagram", label: "Instagram", href: "https://www.instagram.com/zekksparow", visible: true, sortOrder: 2, showInContact: true, showInFooter: true },
    { id: "soc-3", platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@zekksparow", visible: true, sortOrder: 3, showInContact: true, showInFooter: true },
    { id: "soc-4", platform: "behance", label: "Behance", href: "https://www.behance.net/zakariamp", visible: true, sortOrder: 4, showInContact: true, showInFooter: true },
    { id: "soc-5", platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/zakariamp", visible: true, sortOrder: 5, showInContact: true, showInFooter: false },
    { id: "soc-6", platform: "trakteer", label: "Trakteer", href: "https://trakteer.id/zakariamp", visible: true, sortOrder: 6, showInContact: true, showInFooter: false },
  ],
};

export const defaultStats: StatsConfig = {
  mode: "auto",
  overlappingRule: "merge_intervals",
  sinceYear: 2020,
  includeAchievementsInCerts: false,
  projectsCount: 0,
  certificatesCount: 8,
  experienceYears: "2+",
  organizationsCount: 3,
};

export const defaultProjectCategories: ProjectCategoryConfig[] = [
  { id: "pcat-it", key: "it", labelId: "Proyek IT & Web", labelEn: "IT & Web Projects", sortOrder: 1, visible: true },
  { id: "pcat-design", key: "design", labelId: "UI/UX & Desain", labelEn: "UI/UX & Design", sortOrder: 2, visible: true },
  { id: "pcat-both", key: "both", labelId: "IT & Design", labelEn: "IT & Design", sortOrder: 3, visible: true },
];

export const defaultTechStackCategories: TechStackCategoryConfig[] = [
  { key: "uiux", labelId: "UI/UX & Desain", labelEn: "UI/UX & Design", sortOrder: 1, visible: true },
  { key: "frontend", labelId: "Frontend Web", labelEn: "Frontend Web", sortOrder: 2, visible: true },
  { key: "visual", labelId: "Desain Grafis / Media", labelEn: "Visual & Media", sortOrder: 3, visible: true },
  { key: "systems", labelId: "Sistem & Basis Data", labelEn: "Systems & Databases", sortOrder: 4, visible: true },
];

export const defaultProjects: Project[] = [];

export const defaultCvSettings: CvSettingsConfig = {
  allowDownload: true,
  folderHintId: "Klik untuk membuka isi map atau gulir untuk menutup",
  folderHintEn: "Click to open the folder or scroll away to close",
  previewCtaId: "Lihat CV",
  previewCtaEn: "Preview CV",
  downloadLabelId: "Buka PDF",
  downloadLabelEn: "Open PDF",
};

export const defaultCvDocs: CvDocConfig[] = [
  {
    id: "cv-graphic",
    roleKey: "graphic",
    title: "Desainer Grafis",
    titleEn: "Graphic Designer",
    subtitle: "Multimedia & Visual Identity",
    subtitleEn: "Multimedia & Visual Identity",
    description: "Fokus identitas visual, desain publikasi, tipografi, dan aset kampanye digital.",
    descriptionEn: "Focused on visual identity, campaign design, typography, and digital media assets.",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    thumbnailUrl: "/cv-page-1.png",
    versionLabel: "ATS v2025",
    updatedAt: "2025",
    allowDownload: true,
    downloadFilename: "CV-ATS-ZakariaMP-Graphic-Designer.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
    skills: ["Visual Identity Design", "Typography & Layout Systems", "Digital Campaign & Social Media", "Vector Illustration"],
    tools: ["Photoshop", "Illustrator", "Figma", "CorelDRAW", "Canva", "CapCut"],
    responsibilities: [
      "Merancang identitas visual utama dan panduan gaya grafis konsisten.",
      "Mengembangkan materi promosi, poster acara, dan publikasi digital.",
      "Berkoordinasi dengan divisi konten untuk menyampaikan pesan visual yang jelas.",
    ],
    keyProjects: ["Kampanye Branding & Publikasi Visual HIMATIF", "Workshop Kreatif & Materi Acara GDGoC UTM"],
    visible: true,
    published: true,
    sortOrder: 1,
  },
  {
    id: "cv-uiux",
    roleKey: "uiux",
    title: "UI/UX Designer",
    titleEn: "UI/UX Designer",
    subtitle: "Product Design & Prototyping",
    subtitleEn: "Product Design & Prototyping",
    description: "Fokus arsitektur informasi, design system Figma, prototyping, dan user testing.",
    descriptionEn: "Focused on information architecture, Figma design systems, prototyping, and usability testing.",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    thumbnailUrl: "/cv-page-2.png",
    versionLabel: "ATS v2025",
    updatedAt: "2025",
    allowDownload: true,
    downloadFilename: "CV-ATS-ZakariaMP-UIUX-Designer.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
    skills: ["Design System & Token Architecture", "Wireframing & User Flows", "High-Fidelity Interactive Prototyping", "Usability Testing & Audit"],
    tools: ["Figma", "Adobe XD", "Miro", "Notion", "Tailwind CSS"],
    responsibilities: [
      "Melakukan pemetaan user flow, arsitektur informasi, dan antarmuka modular.",
      "Membangun pustaka komponen design system dengan auto-layout & design tokens.",
      "Menjembatani spesifikasi antarmuka ke dalam implementasi kode frontend.",
    ],
    keyProjects: ["Prototipe Interactive UI/UX Aplikasi Edukasi", "Portofolio & Design System ZekkTech"],
    visible: true,
    published: true,
    sortOrder: 2,
  },
  {
    id: "cv-frontend",
    roleKey: "frontend",
    title: "Frontend Developer",
    titleEn: "Frontend Developer",
    subtitle: "Next.js & TypeScript Systems",
    subtitleEn: "Next.js & TypeScript Systems",
    description: "Fokus aplikasi web Next.js App Router, TypeScript strict, Three.js, dan aksesibilitas.",
    descriptionEn: "Focused on Next.js App Router, strict TypeScript, Three.js, and web performance.",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    thumbnailUrl: "/cv-page-3.png",
    versionLabel: "ATS v2025",
    updatedAt: "2025",
    allowDownload: true,
    downloadFilename: "CV-ATS-ZakariaMP-Frontend-Developer.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
    skills: ["Next.js App Router & SSR", "React & Strict TypeScript", "Tailwind CSS & GSAP Animation", "WebGL / Three.js Physics"],
    tools: ["Next.js", "React", "TypeScript", "TailwindCSS", "Git", "Supabase", "Vercel"],
    responsibilities: [
      "Membangun antarmuka web modern berkinerja tinggi dan ramah SEO.",
      "Mengintegrasikan REST API, caching SSR/CSR, dan manajemen state reaktif.",
      "Menjaga kualitas kode dengan linting ketat, aksesibilitas, dan optimasi bundle.",
    ],
    keyProjects: ["TOEL Simulator Ujian TOEFL", "Platform ZekkTech CMS & 3D Portfolio Engine"],
    visible: true,
    published: true,
    sortOrder: 3,
  },
  {
    id: "cv-itsupport",
    roleKey: "itsupport",
    title: "IT Support Specialist",
    titleEn: "IT Support Specialist",
    subtitle: "Hardware, Network & Linux Systems",
    subtitleEn: "Hardware, Network & Linux Systems",
    description: "Fokus diagnosa perangkat keras, administrasi Linux, jaringan lokal, dan troubleshooting.",
    descriptionEn: "Focused on hardware diagnostics, Linux administration, networking, and troubleshooting.",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    thumbnailUrl: "/cv-page-4.png",
    versionLabel: "ATS v2025",
    updatedAt: "2025",
    allowDownload: true,
    downloadFilename: "CV-ATS-ZakariaMP-IT-Support.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
    skills: ["Hardware Troubleshooting & Assembly", "Network Diagnostics & Routing", "Linux System Administration", "Technical Documentation"],
    tools: ["Linux (Ubuntu)", "Cisco Packet Tracer", "Git", "VS Code", "Bash", "MySQL"],
    responsibilities: [
      "Melakukan diagnosa kerusakan perangkat keras serta instalasi sistem operasi Linux/Windows.",
      "Konfigurasi dasar jaringan lokal (LAN/WLAN) dan keamanan akses router.",
      "Mendokumentasikan pemeliharaan sistem serta manajemen basis data MySQL.",
    ],
    keyProjects: ["Pemeliharaan Infrastruktur Workstation & Jaringan Lab", "Konfigurasi Keamanan Komunitas Cyber Security (KOALISI)"],
    visible: true,
    published: true,
    sortOrder: 4,
  },
];

export const defaultEducation: EducationItem[] = [
  {
    id: "utm",
    institution: "Universitas Trunojoyo Madura",
    location: "Bangkalan, Jawa Timur",
    program: "S1 Teknik Informatika",
    degree: "Sarjana Komputer (S.Kom)",
    degreeEn: "Bachelor of Computer Science",
    period: "2024 – Sekarang",
    startYear: 2024,
    endYear: null,
    status: "Mahasiswa Aktif",
    statusEn: "Active Student",
    current: true,
    desc: "Menempuh pendidikan sarjana Teknik Informatika dengan fokus utama rekayasa antarmuka web, arsitektur sistem, dan eksplorasi interaksi 3D fisik.",
    descEn: "Pursuing undergraduate studies in Informatics with primary focus on web interfaces, system architecture, and 3D web physics.",
    focus: [
      "Algoritma & Pemrograman",
      "Dasar Pemrograman Web",
      "Sistem Basis Data",
      "Jaringan Komputer",
    ],
    focusEn: [
      "Algorithms & Programming",
      "Web Development Fundamentals",
      "Database Systems",
      "Computer Networks",
    ],
    projects: [
      {
        title: "TOEL — Simulator Ujian TOEFL",
        desc: "Aplikasi web latihan simulasi TOEFL dengan batasan waktu terisolasi, pemutar audio terproteksi, dan kalkulasi skor otomatis.",
        repo: "https://github.com/ZekkCode/OnlineTest-TOEFL_DPW",
      },
    ],
    website: "https://www.trunojoyo.ac.id",
    published: true,
    sortOrder: 1,
  },
  {
    id: "smkn1jetis",
    institution: "SMK Negeri 1 Jetis",
    location: "Mojokerto, Jawa Timur",
    program: "Kejurusan Multimedia",
    degree: "Pendidikan Menengah Kejuruan",
    degreeEn: "Vocational High School Diploma",
    period: "2021 – 2024",
    startYear: 2021,
    endYear: 2024,
    status: "Lulus",
    statusEn: "Graduated",
    current: false,
    desc: "Mempelajari dasar multimedia, desain grafis komputer, tipografi, fotografi, pemodelan 2D/3D interaktif, serta produksi dan pengeditan audio-visual.",
    descEn: "Studied multimedia foundations, digital graphic design, typography, 2D/3D modeling, and audiovisual production.",
    focus: [
      "Desain Grafis (Photoshop & CorelDRAW)",
      "Produksi & Editing Video (Premiere Pro & Filmora)",
      "Desain Antarmuka UI/UX Dasar",
    ],
    focusEn: [
      "Graphic Design (Photoshop & CorelDRAW)",
      "Video Production & Editing (Premiere Pro & Filmora)",
      "Fundamental UI/UX Design",
    ],
    projects: [
      {
        title: "Prototipe UI/UX Game Edukasi 'Tebak ASEAN'",
        desc: "Perancangan user flow dan prototipe interaktif high-fidelity dari awal hingga akhir menggunakan Figma.",
      },
    ],
    website: "https://smkn1jetis.sch.id",
    published: true,
    sortOrder: 2,
  },
];

export const defaultExperience: ExperienceItem[] = profile.experience.map((e, idx) => ({
  id: `exp-${idx + 1}`,
  role: e.role,
  roleEn: e.role,
  org: e.org,
  place: e.place,
  period: e.period,
  desc: e.desc,
  descEn: e.desc,
  published: true,
  sortOrder: idx + 1,
}));

export const defaultAchievements: AchievementItem[] = [
  {
    id: "ach-1",
    title: "Core Team Media Creative GDGoC UTM",
    titleEn: "Core Team Media Creative GDGoC UTM",
    organizer: "Google Developer Groups on Campus UTM",
    category: "program",
    date: "2024",
    desc: "Terpilih sebagai Core Team Media Creative Google Developer Groups on Campus untuk merancang identitas visual workshop teknologi.",
    descEn: "Selected as Media Creative Core Team at Google Developer Groups on Campus to craft visual identities for tech workshops.",
    featured: true,
    published: true,
    sortOrder: 1,
  },
  {
    id: "ach-2",
    title: "Kepala Divisi Media Creative HIMATIF",
    titleEn: "Head of Media Creative Division HIMATIF",
    organizer: "Himpunan Mahasiswa Informatika UTM",
    category: "leadership",
    date: "2024",
    desc: "Memimpin perancangan identitas visual, publikasi kegiatan, dokumentasi, dan pengelolaan media sosial organisasi.",
    descEn: "Leading visual identity design, event publications, documentation, and social media branding for the student association.",
    featured: true,
    published: true,
    sortOrder: 2,
  },
];

export const defaultCertificates: CertificateItem[] = (profile.certificates || []).map((c, idx) => ({
  id: `cert-${idx + 1}`,
  title: c.title,
  issuer: c.issuer,
  date: c.date,
  credentialUrl: c.credentialUrl || "",
  category: (c.category || "design") as "design" | "frontend" | "systems" | "all",
  published: true,
  sortOrder: idx + 1,
}));

export const defaultTechStack: TechStackItem[] = [
  { id: "ts-figma", name: "Figma", category: "uiux", icon: "/icons/figma.svg", sortOrder: 1, visible: true },
  { id: "ts-adobexd", name: "Adobe XD", category: "uiux", icon: "/icons/adobexd.svg", sortOrder: 2, visible: true },
  { id: "ts-illustrator", name: "Illustrator", category: "visual", icon: "/icons/illustrator.svg", sortOrder: 3, visible: true },
  { id: "ts-photoshop", name: "Photoshop", category: "visual", icon: "/icons/photoshop.svg", sortOrder: 4, visible: true },
  { id: "ts-nextjs", name: "Next.js", category: "frontend", icon: "/icons/nextjs.svg", sortOrder: 5, visible: true },
  { id: "ts-react", name: "React", category: "frontend", icon: "/icons/react.svg", sortOrder: 6, visible: true },
  { id: "ts-typescript", name: "TypeScript", category: "frontend", icon: "/icons/typescript.svg", sortOrder: 7, visible: true },
  { id: "ts-tailwind", name: "TailwindCSS", category: "frontend", icon: "/icons/tailwindcss.svg", sortOrder: 8, visible: true },
  { id: "ts-flutter", name: "Flutter", category: "frontend", icon: "/icons/flutter.svg", sortOrder: 9, visible: true },
  { id: "ts-mysql", name: "MySQL", category: "systems", icon: "/icons/mysql.svg", sortOrder: 10, visible: true },
  { id: "ts-github", name: "GitHub", category: "systems", icon: "/icons/github.svg", sortOrder: 11, visible: true },
  { id: "ts-capcut", name: "CapCut", category: "visual", icon: "/icons/capcut.svg", sortOrder: 12, visible: true },
  { id: "ts-filmora", name: "Filmora", category: "visual", icon: "/icons/filmora.svg", sortOrder: 13, visible: true },
];

export const defaultServices: ServiceItemConfig[] = [
  {
    id: "srv-1",
    key: "s1",
    num: "01",
    titleId: "UI/UX & Desain Sistem",
    titleEn: "UI/UX & Design Systems",
    descId:
      "Perancangan alur kerja, hierarki antarmuka, dan prototipe interaktif di Figma yang siap dieksekusi tim developer.",
    descEn:
      "Crafting intuitive user flows, visual hierarchy, and developer-ready interactive prototypes in Figma.",
    iconName: "layout",
    sortOrder: 1,
    visible: true,
  },
  {
    id: "srv-2",
    key: "s2",
    num: "02",
    titleId: "Frontend Web Development",
    titleEn: "Frontend Web Engineering",
    descId:
      "Pembangunan website dan aplikasi web yang cepat, responsif, dan mudah diakses menggunakan Next.js dan Tailwind CSS.",
    descEn:
      "Building fast, responsive, and accessible web applications with Next.js, TypeScript, and Tailwind CSS.",
    iconName: "code",
    sortOrder: 2,
    visible: true,
  },
  {
    id: "srv-3",
    key: "s3",
    num: "03",
    titleId: "Identitas Visual & Grafis",
    titleEn: "Visual & Brand Identity",
    descId:
      "Pembuatan aset grafis vektor presisi, identitas visual digital, dan materi promosi untuk kebutuhan produk.",
    descEn:
      "Precision vector graphics, digital branding assets, and promotional visual media.",
    iconName: "video",
    sortOrder: 3,
    visible: true,
  },
  {
    id: "srv-4",
    key: "s4",
    num: "04",
    titleId: "Dukungan IT & Sistem",
    titleEn: "IT & Systems Support",
    descId:
      "Pemeliharaan sistem Linux, perbaikan perangkat keras, setup jaringan lokal, serta manajemen versi kode Git.",
    descEn:
      "Linux maintenance, hardware diagnostics, network troubleshooting, and structured Git workflows.",
    iconName: "server",
    sortOrder: 4,
    visible: true,
  },
];

export const defaultFaq: FaqItemConfig[] = [
  {
    id: "faq-1",
    questionId: "Berapa lama estimasi pengerjaan sebuah proyek web atau desain antarmuka?",
    questionEn: "What is the estimated turnaround time for a web or interface design project?",
    answerId:
      "Tergantung cakupan proyek. Untuk landing page atau prototype UI/UX umumnya memakan waktu 3–7 hari kerja, sedangkan aplikasi web skala menengah memerlukan 2–4 minggu dengan sprint mingguan yang terukur.",
    answerEn:
      "Turnaround depends on scope. Landing pages or interactive Figma prototypes typically take 3–7 business days, while medium-scale web applications take 2–4 weeks organized in transparent sprints.",
    sortOrder: 1,
    visible: true,
  },
  {
    id: "faq-2",
    questionId: "Apakah melayani kerja sama proyek skala kecil atau UMKM?",
    questionEn: "Do you take on small-scale projects or collaborate with small businesses?",
    answerId:
      "Tentu saja. Saya terbuka membantu UMKM, inisiatif mahasiswa, maupun komunitas dengan penyesuaian kebutuhan nyata dan tenggat waktu.",
    answerEn:
      "Absolutely. I actively support small businesses, campus initiatives, and non-profits with practical scoping aligned to genuine needs and deadlines.",
    sortOrder: 2,
    visible: true,
  },
  {
    id: "faq-3",
    questionId: "Bagaimana kesiapan integrasi hasil desain ke tim developer?",
    questionEn: "How developer-ready are your Figma design handoffs?",
    answerId:
      "Desain Figma diserahkan lengkap dengan auto-layout, komponen terstruktur, dan panduan token. Untuk implementasi frontend, kode ditulis menggunakan Next.js dan TypeScript yang modular dan siap dihubungkan ke backend.",
    answerEn:
      "Figma files are delivered with strict auto-layout, tokenized variables, responsive variants, and structured design tokens. Frontend implementations are modular Next.js and TypeScript components ready for API integration.",
    sortOrder: 3,
    visible: true,
  },
  {
    id: "faq-4",
    questionId: "Bagaimana mekanisme penyerahan file akhir dan kode sumber (source code)?",
    questionEn: "How are final assets and source code delivered?",
    answerId:
      "Semua aset desain diserahkan via tautan Figma resmi beserta aset grafis SVG/WebP. Untuk kode frontend, penyerahan dilakukan melalui repositori privat GitHub lengkap dengan dokumentasi setup dan instruksi deployment.",
    answerEn:
      "All design assets are handed over via official Figma links alongside optimized SVG and WebP assets. Frontend code is delivered through a private GitHub repository with comprehensive README instructions and deployment setups.",
    sortOrder: 4,
    visible: true,
  },
];

export const defaultNavigation: NavMenuItemConfig[] = [
  { id: "nav-about", labelId: "Tentang", labelEn: "About", href: "#tentang", sectionKey: "about", iconName: "user", visible: true, sortOrder: 1 },
  { id: "nav-cv", labelId: "CV ATS", labelEn: "Resume", href: "#cv", sectionKey: "cv", iconName: "file-text", visible: true, sortOrder: 2 },
  { id: "nav-stack", labelId: "Tech Stack", labelEn: "Tech Stack", href: "#stack", sectionKey: "stack", iconName: "layers", visible: true, sortOrder: 3 },
  { id: "nav-projects", labelId: "Proyek", labelEn: "Projects", href: "#proyek", sectionKey: "projects", iconName: "folder", visible: true, sortOrder: 4 },
  { id: "nav-contact", labelId: "Kontak", labelEn: "Contact", href: "#kontak", sectionKey: "contact", iconName: "mail", visible: true, sortOrder: 5 },
];

export const defaultFooter: FooterConfig = {
  brandText: "ZekkTech",
  emailLabelId: "Email",
  emailLabelEn: "Email",
  locationText: "Mojokerto, Indonesia",
  copyrightName: "Zakaria Mujur Prasetyo",
  taglineId: "Antarmuka web & produk digital.",
  taglineEn: "Web interfaces & digital products.",
  watermarkText: "zakaria mp",
  showWatermark: true,
  showSocials: true,
  showEmail: true,
};

export const defaultContactSection: ContactConfig = {
  badgeId: "Kontak",
  badgeEn: "Contact",
  titleId: "Mulai Diskusi",
  titleEn: "Start a Conversation",
  descId: "Punya kebutuhan desain antarmuka, pengembangan web, atau kolaborasi teknis? Kirim pesan langsung melalui formulir di bawah.",
  descEn: "Need interface design, web engineering, or technical collaboration? Send a direct message through the form below.",
  emailCtaId: "Kirim Pesan",
  emailCtaEn: "Send Message",
  secondaryCtaId: "Folder Berkas Karir",
  secondaryCtaEn: "Career Files",
  secondaryHref: "#cv",
};

export const defaultSectionOrder: SectionKey[] = [
  "hero",
  "about",
  "journey",
  "achievements",
  "services",
  "cv",
  "stack",
  "projects",
  "blog",
  "certificates",
  "faq",
  "contact",
];

export const defaultSections: Record<string, SectionConfigItem> = {
  hero: { visible: true, sortOrder: 0 },
  about: { visible: true, sortOrder: 1, titleId: "Tentang Saya", titleEn: "About Me", descId: "Merancang antarmuka web modern dan identitas visual yang konsisten sejak 2020.", descEn: "Crafting modern web interfaces and consistent visual identities since 2020." },
  journey: { visible: true, sortOrder: 2, titleId: "Jejak Akademik", titleEn: "Academic Journey", descId: "Fondasi pendidikan, fokus studi, dan proyek keilmuan.", descEn: "Educational foundations, core studies, and academic projects." },
  achievements: { visible: true, sortOrder: 3, titleId: "Prestasi & Rekognisi", titleEn: "Achievements & Recognition", descId: "Rekam jejak program resmi terpilih, kepemimpinan organisasi, dan pencapaian terverifikasi.", descEn: "Verified program milestones, leadership recognition, and competition achievements." },
  services: { visible: true, sortOrder: 4, titleId: "Layanan", titleEn: "Services", descId: "Ruang lingkup desain, frontend engineering, dan dukungan sistem.", descEn: "Scope across product design, frontend engineering, and technical systems." },
  cv: { visible: true, sortOrder: 5, titleId: "Folder Berkas Karir", titleEn: "Career Resume Folder", descId: "Kumpulan CV ATS untuk empat jalur keahlian utama.", descEn: "ATS-tailored resumes across core engineering and design disciplines." },
  stack: { visible: true, sortOrder: 6, titleId: "Tech Stack & Alat", titleEn: "Tech Stack & Tools", descId: "Alat desain, bahasa pemrograman, framework, dan utilitas produksi.", descEn: "Design tools, programming languages, frameworks, and production utilities." },
  projects: { visible: true, sortOrder: 7, titleId: "Proyek Terpilih", titleEn: "Selected Projects", descId: "Eksplorasi produk web, antarmuka pengguna, dan rekayasa frontend.", descEn: "Web products, UI architecture, and frontend engineering explorations." },
  blog: { visible: true, sortOrder: 8, titleId: "Latest from ZekkTech Blog", titleEn: "Latest from ZekkTech Blog", descId: "Catatan, pembahasan, dan artikel seputar teknologi serta dunia digital.", descEn: "Notes, thoughts, and technical articles on design and web engineering.", ctaLabelId: "Semua Artikel di Blog", ctaLabelEn: "All Articles on Blog" },
  certificates: { visible: true, sortOrder: 9, titleId: "Sertifikasi & Kredensial", titleEn: "Certifications & Credentials", descId: "Sertifikasi kompetensi profesional terverifikasi.", descEn: "Verified professional certifications and credentials." },
  faq: { visible: true, sortOrder: 10, titleId: "Pertanyaan Umum", titleEn: "FAQ", descId: "Jawaban singkat mengenai alur kerja, waktu pengerjaan, dan kolaborasi.", descEn: "Quick answers regarding scope, timelines, and collaboration." },
  contact: { visible: true, sortOrder: 11, titleId: "Mulai Diskusi", titleEn: "Start a Conversation", descId: "Terbuka untuk kolaborasi proyek desain produk dan web engineering.", descEn: "Open for product design and frontend engineering collaborations." },
};

export const defaultBlogConfig: BlogConfig = {
  feedUrl: "https://zekktech.biz.id/blog",
  portalUrl: "https://zekktech.biz.id/blog",
  sourceMode: "hybrid",
  displayCount: 4,
  visible: true,
  published: true,
  titleId: "Latest from ZekkTech Blog",
  titleEn: "Latest from ZekkTech Blog",
  descId: "Catatan, pembahasan, dan artikel seputar teknologi serta dunia digital.",
  descEn: "Notes, thoughts, and technical articles on design and web engineering.",
  ctaLabelId: "Semua Artikel di Blog",
  ctaLabelEn: "All Articles on Blog",
  manualPosts: [],
  syncedPosts: [],
  syncedOverrides: {},
};

export const defaultSiteConfig: SiteConfig = {
  version: 1,
  schemaVersion: 2,
  headerLogoUrl: "",
  generalProfile: defaultGeneralProfile,
  stats: defaultStats,
  lanyard: defaultLanyard,
  profileCard: defaultProfileCard,
  projects: defaultProjects,
  projectCategories: defaultProjectCategories,
  cvDocs: defaultCvDocs,
  cvSettings: defaultCvSettings,
  education: defaultEducation,
  experience: defaultExperience,
  achievements: defaultAchievements,
  certificates: defaultCertificates,
  techStack: defaultTechStack,
  techStackCategories: defaultTechStackCategories,
  services: defaultServices,
  faq: defaultFaq,
  blog: defaultBlogConfig,
  seo: {
    metaTitle: `${profile.name} | ${profile.roles}`,
    metaTitleEn: `${profile.name} | ${profile.roles}`,
    metaDesc: profile.bio[0],
    metaDescEn: defaultGeneralProfile.bioEn[0],
    keywords: ["Zakaria Mujur Prasetyo", "ZekkTech", "UI/UX Designer", "Frontend Developer"],
    ogImage: "/opengraph-image",
    ogImageAlt: `${profile.name} - ${profile.brand} Portfolio`,
    canonicalUrl: profile.site || "https://zakariamp.vercel.app",
    robotsIndex: true,
    personJobTitle: profile.roles,
  },
  sections: defaultSections,
  sectionOrder: defaultSectionOrder,
  navigation: defaultNavigation,
  footer: defaultFooter,
  contactSection: defaultContactSection,
};

export function slugifyProjectTitle(input: string, fallback = "proyek"): string {
  const slug = (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || fallback;
}

export const normalizeConfig = (input: unknown): SiteConfig => {
  const raw = (input ?? {}) as Partial<SiteConfig>;
  const headerLogoUrl = typeof raw.headerLogoUrl === "string" ? raw.headerLogoUrl : "";

  // 1. General Profile
  const rawProfile = raw.generalProfile;
  const normalizedGeneralProfile: GeneralProfileConfig = rawProfile
    ? {
        name: typeof rawProfile.name === "string" ? rawProfile.name : defaultGeneralProfile.name,
        nameEn: typeof rawProfile.nameEn === "string" ? rawProfile.nameEn : (typeof rawProfile.name === "string" ? rawProfile.name : defaultGeneralProfile.nameEn),
        nickname: typeof rawProfile.nickname === "string" ? rawProfile.nickname : defaultGeneralProfile.nickname,
        brand: typeof rawProfile.brand === "string" ? rawProfile.brand : defaultGeneralProfile.brand,
        roles: typeof rawProfile.roles === "string" ? rawProfile.roles : defaultGeneralProfile.roles,
        rolesEn: typeof rawProfile.rolesEn === "string" ? rawProfile.rolesEn : defaultGeneralProfile.rolesEn,
        heroDesc: typeof rawProfile.heroDesc === "string" ? rawProfile.heroDesc : defaultGeneralProfile.heroDesc,
        heroDescEn: typeof rawProfile.heroDescEn === "string" ? rawProfile.heroDescEn : defaultGeneralProfile.heroDescEn,
        bio: Array.isArray(rawProfile.bio) && rawProfile.bio.length > 0 ? rawProfile.bio : defaultGeneralProfile.bio,
        bioEn: Array.isArray(rawProfile.bioEn) && rawProfile.bioEn.length > 0 ? rawProfile.bioEn : defaultGeneralProfile.bioEn,
        avatarUrl:
          typeof rawProfile.avatarUrl === "string" &&
          rawProfile.avatarUrl &&
          rawProfile.avatarUrl !== "/profile.webp"
            ? rawProfile.avatarUrl
            : defaultGeneralProfile.avatarUrl,
        location: typeof rawProfile.location === "string" ? rawProfile.location : defaultGeneralProfile.location,
        locationEn: typeof rawProfile.locationEn === "string" ? rawProfile.locationEn : defaultGeneralProfile.locationEn,
        availability: typeof rawProfile.availability === "string" ? rawProfile.availability : defaultGeneralProfile.availability,
        availabilityEn: typeof rawProfile.availabilityEn === "string" ? rawProfile.availabilityEn : defaultGeneralProfile.availabilityEn,
        availabilityStatus:
          rawProfile.availabilityStatus === "busy" ||
          rawProfile.availabilityStatus === "unavailable" ||
          rawProfile.availabilityStatus === "hidden"
            ? rawProfile.availabilityStatus
            : "available",
        since: typeof rawProfile.since === "string" && rawProfile.since.trim() ? rawProfile.since : defaultGeneralProfile.since,
        githubUsername:
          typeof rawProfile.githubUsername === "string" && rawProfile.githubUsername.trim()
            ? rawProfile.githubUsername
            : defaultGeneralProfile.githubUsername,
        email: typeof rawProfile.email === "string" ? rawProfile.email : defaultGeneralProfile.email,
        phone: typeof rawProfile.phone === "string" ? rawProfile.phone : defaultGeneralProfile.phone,
        whatsapp: typeof rawProfile.whatsapp === "string" ? rawProfile.whatsapp : defaultGeneralProfile.whatsapp,
        site: typeof rawProfile.site === "string" && rawProfile.site.trim() ? rawProfile.site : defaultGeneralProfile.site,
        ctaPrimaryLabelId:
          typeof rawProfile.ctaPrimaryLabelId === "string" ? rawProfile.ctaPrimaryLabelId : defaultGeneralProfile.ctaPrimaryLabelId,
        ctaPrimaryLabelEn:
          typeof rawProfile.ctaPrimaryLabelEn === "string" ? rawProfile.ctaPrimaryLabelEn : defaultGeneralProfile.ctaPrimaryLabelEn,
        ctaPrimaryHref:
          typeof rawProfile.ctaPrimaryHref === "string" ? rawProfile.ctaPrimaryHref : undefined,
        ctaSecondaryLabelId:
          typeof rawProfile.ctaSecondaryLabelId === "string" ? rawProfile.ctaSecondaryLabelId : defaultGeneralProfile.ctaSecondaryLabelId,
        ctaSecondaryLabelEn:
          typeof rawProfile.ctaSecondaryLabelEn === "string" ? rawProfile.ctaSecondaryLabelEn : defaultGeneralProfile.ctaSecondaryLabelEn,
        ctaSecondaryHref:
          typeof rawProfile.ctaSecondaryHref === "string" ? rawProfile.ctaSecondaryHref : defaultGeneralProfile.ctaSecondaryHref,
        aboutPersona: rawProfile.aboutPersona && typeof rawProfile.aboutPersona === "object"
          ? {
              ...defaultGeneralProfile.aboutPersona,
              ...rawProfile.aboutPersona,
            }
          : defaultGeneralProfile.aboutPersona,
        socials: Array.isArray(rawProfile.socials)
          ? rawProfile.socials
              .filter((s): s is SocialLinkItem => Boolean(s && typeof s === "object" && typeof s.href === "string"))
              .map((s, idx) => ({
                ...s,
                visible: s.visible !== false,
                sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : idx + 1,
                showInContact: s.showInContact !== false,
                showInFooter: s.showInFooter !== undefined ? s.showInFooter : idx < 4,
              }))
          : defaultGeneralProfile.socials,
      }
    : defaultGeneralProfile;

  // 2. Stats
  const rawStats = raw.stats;
  const normalizedStats: StatsConfig = rawStats
    ? {
        mode: rawStats.mode === "manual" ? "manual" : "auto",
        overlappingRule: rawStats.overlappingRule === "since_year" ? "since_year" : "merge_intervals",
        sinceYear: typeof rawStats.sinceYear === "number" ? rawStats.sinceYear : defaultStats.sinceYear,
        includeAchievementsInCerts: Boolean(rawStats.includeAchievementsInCerts),
        projectsCount: typeof rawStats.projectsCount === "number" ? rawStats.projectsCount : defaultStats.projectsCount,
        certificatesCount: typeof rawStats.certificatesCount === "number" ? rawStats.certificatesCount : defaultStats.certificatesCount,
        experienceYears: typeof rawStats.experienceYears === "string" ? rawStats.experienceYears : defaultStats.experienceYears,
        organizationsCount: typeof rawStats.organizationsCount === "number" ? rawStats.organizationsCount : defaultStats.organizationsCount,
      }
    : defaultStats;

  // 3. Lanyard
  const rawLanyard = raw.lanyard ? { ...raw.lanyard } : undefined;
  if (rawLanyard && (rawLanyard.size === 0.58 || rawLanyard.size === 0.6 || rawLanyard.size === 0.36 || rawLanyard.size === 0.44)) {
    rawLanyard.size = defaultLanyard.size;
  }
  if (rawLanyard && (rawLanyard.strapLength === 0.85 || rawLanyard.strapLength === 0.32 || rawLanyard.strapLength === 0.18 || !rawLanyard.strapLength)) {
    rawLanyard.strapLength = defaultLanyard.strapLength;
  }
  if (rawLanyard && (rawLanyard.cornerRadius === undefined || rawLanyard.cornerRadius === 0.3)) {
    rawLanyard.cornerRadius = defaultLanyard.cornerRadius;
  }
  const isLegacyFrontDefault =
    !rawLanyard?.frontImage ||
    rawLanyard.frontImage === "/card-front.svg" ||
    rawLanyard.frontImage === "/card-front.webp";

  if (rawLanyard && isLegacyFrontDefault) {
    rawLanyard.frontImage = defaultLanyard.frontImage;
  }
  if (
    rawLanyard &&
    ((!rawLanyard.backImage && isLegacyFrontDefault) ||
      rawLanyard.backImage === "/card-back.webp")
  ) {
    rawLanyard.backImage = defaultLanyard.backImage;
  }

  const normalizedLanyard: LanyardConfig = {
    ...defaultLanyard,
    ...rawLanyard,
  };

  // 4. Profile Card
  const rawProfileCard = raw.profileCard ? { ...raw.profileCard } : undefined;
  if (rawProfileCard?.avatarUrl === "/profile.webp") {
    rawProfileCard.avatarUrl = defaultGeneralProfile.avatarUrl;
  }
  if (rawProfileCard?.miniAvatarUrl === "/profile.webp") {
    rawProfileCard.miniAvatarUrl = "";
  }
  const normalizedProfileCard: ProfileCardConfig = {
    ...defaultProfileCard,
    ...rawProfileCard,
    imageFit:
      !rawProfileCard?.avatarUrl && rawProfileCard?.imageFit === "contain"
        ? defaultProfileCard.imageFit
        : rawProfileCard?.imageFit || defaultProfileCard.imageFit,
    statusColor: typeof rawProfileCard?.statusColor === "string" && rawProfileCard.statusColor ? rawProfileCard.statusColor : "#22c55e",
  };

  // 5. Project Categories & Projects
  const rawProjectCategories = Array.isArray(raw.projectCategories) ? raw.projectCategories : defaultProjectCategories;
  const normalizedProjectCategories: ProjectCategoryConfig[] = rawProjectCategories
    .filter((c): c is ProjectCategoryConfig => Boolean(c && typeof c === "object" && typeof c.key === "string"))
    .map((c, idx) => ({
      id: typeof c.id === "string" ? c.id : `pcat-${c.key}-${idx}`,
      key: c.key.trim() || `cat-${idx}`,
      labelId: typeof c.labelId === "string" ? c.labelId : c.key,
      labelEn: typeof c.labelEn === "string" ? c.labelEn : c.labelId || c.key,
      sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : idx + 1,
      visible: c.visible !== false,
    }));

  const rawProjects = Array.isArray(raw.projects) ? raw.projects : defaultProjects;
  const usedSlugs = new Set<string>();
  const normalizedProjects: Project[] = rawProjects
    .filter((p): p is Project => Boolean(p && typeof p === "object" && typeof p.id === "string"))
    .map((p, idx) => {
      const baseSlug = slugifyProjectTitle(
        typeof p.slug === "string" && p.slug.trim() ? p.slug : p.title || p.id,
        `proyek-${idx + 1}`
      );
      let uniqueSlug = baseSlug;
      let suffix = 2;
      while (usedSlugs.has(uniqueSlug)) {
        uniqueSlug = `${baseSlug}-${suffix++}`;
      }
      usedSlugs.add(uniqueSlug);

      return {
        id: p.id,
        slug: uniqueSlug,
        title: typeof p.title === "string" ? p.title : "Proyek",
        titleEn: typeof p.titleEn === "string" ? p.titleEn : undefined,
        summary: typeof p.summary === "string" ? p.summary : undefined,
        summaryEn: typeof p.summaryEn === "string" ? p.summaryEn : undefined,
        desc: typeof p.desc === "string" ? p.desc : "",
        descEn: typeof p.descEn === "string" ? p.descEn : undefined,
        category: typeof p.category === "string" && p.category.trim() ? p.category.trim() : "both",
        tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string") : [],
        techIds: Array.isArray(p.techIds) ? p.techIds.filter((t) => typeof t === "string") : undefined,
        repo: typeof p.repo === "string" ? p.repo : "",
        role: typeof p.role === "string" ? p.role : undefined,
        roleEn: typeof p.roleEn === "string" ? p.roleEn : undefined,
        period: typeof p.period === "string" ? p.period : undefined,
        status: (["completed", "in-progress", "archived", "concept"].includes(p.status || "") ? p.status : "completed") as Project["status"],
        collaborators: Array.isArray(p.collaborators) ? p.collaborators.filter((c) => typeof c === "string") : undefined,
        caseStudyUrl: typeof p.caseStudyUrl === "string" ? p.caseStudyUrl : undefined,
        problem: typeof p.problem === "string" ? p.problem : undefined,
        problemEn: typeof p.problemEn === "string" ? p.problemEn : undefined,
        approach: typeof p.approach === "string" ? p.approach : undefined,
        approachEn: typeof p.approachEn === "string" ? p.approachEn : undefined,
        highlight: typeof p.highlight === "string" ? p.highlight : undefined,
        outcome: typeof p.outcome === "string" ? p.outcome : undefined,
        outcomeEn: typeof p.outcomeEn === "string" ? p.outcomeEn : undefined,
        architecture: typeof p.architecture === "string" ? p.architecture : undefined,
        architectureEn: typeof p.architectureEn === "string" ? p.architectureEn : undefined,
        image: typeof p.image === "string" ? p.image : undefined,
        imageAlt: typeof p.imageAlt === "string" ? p.imageAlt : undefined,
        logo: typeof p.logo === "string" ? p.logo : undefined,
        galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.filter((img) => typeof img === "string") : [],
        galleryAlts: Array.isArray(p.galleryAlts) ? p.galleryAlts.filter((a) => typeof a === "string") : undefined,
        previewUrl: typeof p.previewUrl === "string" ? p.previewUrl : undefined,
        featured: Boolean(p.featured),
        published: p.published !== false,
        visible: p.visible !== false,
        sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : idx + 1,
      };
    });

  // 6. CV Docs (preserve ALL user-added, edited, reordered, and explicitly deleted items)
  const rawCvDocs = Array.isArray(raw.cvDocs) ? raw.cvDocs : defaultCvDocs;
  const normalizedCvDocs: CvDocConfig[] = rawCvDocs
    .filter((d): d is CvDocConfig => Boolean(d && typeof d === "object" && (typeof d.id === "string" || typeof d.roleKey === "string")))
    .map((d, idx) => {
      const matchedDefault = defaultCvDocs.find((def) => def.roleKey === d.roleKey || def.id === d.id);
      const roleKey = typeof d.roleKey === "string" && d.roleKey.trim() ? d.roleKey.trim() : `role-${idx + 1}`;
      const pages = Array.isArray(d.pages) && d.pages.length > 0
        ? d.pages.filter((pg) => typeof pg === "string" && pg.trim())
        : matchedDefault?.pages || ["/cv-page-1.png"];

      return {
        ...matchedDefault,
        ...d,
        id: typeof d.id === "string" && d.id ? d.id : matchedDefault?.id || `cv-${roleKey}-${idx}`,
        roleKey,
        title: typeof d.title === "string" && d.title ? d.title : matchedDefault?.title || roleKey,
        titleEn: typeof d.titleEn === "string" ? d.titleEn : matchedDefault?.titleEn || d.title,
        subtitle: typeof d.subtitle === "string" ? d.subtitle : matchedDefault?.subtitle || "",
        subtitleEn: typeof d.subtitleEn === "string" ? d.subtitleEn : matchedDefault?.subtitleEn || d.subtitle,
        color: typeof d.color === "string" && d.color ? d.color : "#0284c7",
        pdfUrl: typeof d.pdfUrl === "string" ? d.pdfUrl : matchedDefault?.pdfUrl || "/cv-ats-zakariamp-2025.pdf",
        thumbnailUrl: typeof d.thumbnailUrl === "string" ? d.thumbnailUrl : (matchedDefault?.thumbnailUrl || pages[0]),
        versionLabel: typeof d.versionLabel === "string" ? d.versionLabel : matchedDefault?.versionLabel || "ATS v2025",
        updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : matchedDefault?.updatedAt || "2025",
        allowDownload: d.allowDownload !== false,
        downloadFilename: typeof d.downloadFilename === "string" ? d.downloadFilename : matchedDefault?.downloadFilename || `CV-${roleKey}.pdf`,
        pages,
        pageCount: pages.length,
        skills: Array.isArray(d.skills) ? d.skills.filter((s) => typeof s === "string") : matchedDefault?.skills || [],
        tools: Array.isArray(d.tools) ? d.tools.filter((t) => typeof t === "string") : matchedDefault?.tools || [],
        responsibilities: Array.isArray(d.responsibilities)
          ? d.responsibilities.filter((r) => typeof r === "string")
          : matchedDefault?.responsibilities || [],
        responsibilitiesEn: Array.isArray(d.responsibilitiesEn)
          ? d.responsibilitiesEn.filter((r) => typeof r === "string")
          : matchedDefault?.responsibilitiesEn,
        keyProjects: Array.isArray(d.keyProjects) ? d.keyProjects.filter((k) => typeof k === "string") : matchedDefault?.keyProjects || [],
        visible: d.visible !== false,
        published: d.published !== false,
        sortOrder: typeof d.sortOrder === "number" ? d.sortOrder : idx + 1,
      };
    });

  const normalizedCvSettings: CvSettingsConfig = {
    ...defaultCvSettings,
    ...(raw.cvSettings && typeof raw.cvSettings === "object" ? raw.cvSettings : {}),
    allowDownload: raw.cvSettings?.allowDownload !== false,
  };

  // 7. Education
  const rawEducation = Array.isArray(raw.education) ? raw.education : defaultEducation;
  const normalizedEducation: EducationItem[] = rawEducation
    .filter((e): e is EducationItem => Boolean(e && typeof e === "object" && typeof e.id === "string"))
    .map((e, idx) => ({
      id: e.id,
      institution: typeof e.institution === "string" ? e.institution : "Institusi Pendidikan",
      location: typeof e.location === "string" ? e.location : "",
      program: typeof e.program === "string" ? e.program : "",
      programEn: typeof e.programEn === "string" ? e.programEn : undefined,
      degree: typeof e.degree === "string" ? e.degree : "",
      degreeEn: typeof e.degreeEn === "string" ? e.degreeEn : undefined,
      period: typeof e.period === "string" ? e.period : "",
      startYear: typeof e.startYear === "number" ? e.startYear : 2024,
      endYear: typeof e.endYear === "number" ? e.endYear : (e.endYear === null ? null : undefined),
      status: typeof e.status === "string" ? e.status : "Mahasiswa Aktif",
      statusEn: typeof e.statusEn === "string" ? e.statusEn : undefined,
      current: Boolean(e.current),
      focus: Array.isArray(e.focus) ? e.focus.filter((f) => typeof f === "string") : [],
      focusEn: Array.isArray(e.focusEn) ? e.focusEn.filter((f) => typeof f === "string") : undefined,
      activities: Array.isArray(e.activities) ? e.activities.filter((a) => typeof a === "string") : undefined,
      activitiesEn: Array.isArray(e.activitiesEn) ? e.activitiesEn.filter((a) => typeof a === "string") : undefined,
      projects: Array.isArray(e.projects)
        ? e.projects.filter((p) => p && typeof p === "object" && typeof p.title === "string")
        : [],
      desc: typeof e.desc === "string" ? e.desc : "",
      descEn: typeof e.descEn === "string" ? e.descEn : undefined,
      logo: typeof e.logo === "string" ? e.logo : undefined,
      website: typeof e.website === "string" ? e.website : undefined,
      timelineYear: typeof e.timelineYear === "number" ? e.timelineYear : (typeof e.startYear === "number" ? e.startYear : undefined),
      showInTimeline: e.showInTimeline !== false,
      published: e.published !== false,
      visible: e.visible !== false,
      sortOrder: typeof e.sortOrder === "number" ? e.sortOrder : idx + 1,
    }));

  // 8. Experience
  const rawExperience = Array.isArray(raw.experience) ? raw.experience : defaultExperience;
  const normalizedExperience: ExperienceItem[] = rawExperience
    .filter((e): e is ExperienceItem => Boolean(e && typeof e === "object" && typeof e.id === "string"))
    .map((e, idx) => ({
      id: e.id,
      role: typeof e.role === "string" ? e.role : "Peran",
      roleEn: typeof e.roleEn === "string" ? e.roleEn : undefined,
      org: typeof e.org === "string" ? e.org : "Organisasi",
      orgGroup: typeof e.orgGroup === "string" ? e.orgGroup : undefined,
      orgUrl: typeof e.orgUrl === "string" ? e.orgUrl : undefined,
      type: (["organization", "work", "internship", "volunteer", "community", "freelance"].includes(e.type || "")
        ? e.type
        : "organization") as ExperienceItem["type"],
      place: typeof e.place === "string" ? e.place : "Lokasi",
      placeEn: typeof e.placeEn === "string" ? e.placeEn : undefined,
      period: typeof e.period === "string" ? e.period : "",
      startDate: typeof e.startDate === "string" ? e.startDate : undefined,
      endDate: typeof e.endDate === "string" ? e.endDate : undefined,
      current: typeof e.current === "boolean" ? e.current : /sekarang|present|aktif/i.test(e.period || ""),
      desc: typeof e.desc === "string" ? e.desc : "",
      descEn: typeof e.descEn === "string" ? e.descEn : undefined,
      logo: typeof e.logo === "string" ? e.logo : undefined,
      highlights: Array.isArray(e.highlights) ? e.highlights.filter((h) => typeof h === "string") : undefined,
      highlightsEn: Array.isArray(e.highlightsEn) ? e.highlightsEn.filter((h) => typeof h === "string") : undefined,
      responsibilities: Array.isArray(e.responsibilities) ? e.responsibilities.filter((r) => typeof r === "string") : undefined,
      responsibilitiesEn: Array.isArray(e.responsibilitiesEn) ? e.responsibilitiesEn.filter((r) => typeof r === "string") : undefined,
      achievements: Array.isArray(e.achievements) ? e.achievements.filter((a) => typeof a === "string") : undefined,
      achievementsEn: Array.isArray(e.achievementsEn) ? e.achievementsEn.filter((a) => typeof a === "string") : undefined,
      media: Array.isArray(e.media)
        ? e.media.filter((m): m is ExperienceMediaItem => Boolean(m && typeof m === "object" && typeof m.url === "string" && m.url.trim()))
        : undefined,
      showInTimeline: e.showInTimeline !== false,
      timelineLabel: typeof e.timelineLabel === "string" ? e.timelineLabel : undefined,
      published: e.published !== false,
      visible: e.visible !== false,
      sortOrder: typeof e.sortOrder === "number" ? e.sortOrder : idx + 1,
    }));

  // 9. Achievements
  const rawAchievements = Array.isArray(raw.achievements) ? raw.achievements : defaultAchievements;
  const normalizedAchievements: AchievementItem[] = rawAchievements
    .filter((a): a is AchievementItem => Boolean(a && typeof a === "object" && typeof a.id === "string"))
    .map((a, idx) => ({
      id: a.id,
      title: typeof a.title === "string" ? a.title : "Prestasi",
      titleEn: typeof a.titleEn === "string" ? a.titleEn : undefined,
      organizer: typeof a.organizer === "string" ? a.organizer : "",
      organizerLogo: typeof a.organizerLogo === "string" ? a.organizerLogo : undefined,
      category: (["award", "competition", "ambassador", "program", "leadership"].includes(a.category)
        ? a.category
        : "award") as AchievementItem["category"],
      date: typeof a.date === "string" ? a.date : "",
      desc: typeof a.desc === "string" ? a.desc : "",
      descEn: typeof a.descEn === "string" ? a.descEn : undefined,
      image: typeof a.image === "string" ? a.image : undefined,
      evidenceUrl: typeof a.evidenceUrl === "string" ? a.evidenceUrl : undefined,
      evidencePdf: typeof a.evidencePdf === "string" ? a.evidencePdf : undefined,
      featured: Boolean(a.featured),
      published: a.published !== false,
      visible: a.visible !== false,
      sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : idx + 1,
    }));

  // 10. Certificates
  const rawCertificates = Array.isArray(raw.certificates) ? raw.certificates : defaultCertificates;
  const normalizedCertificates: CertificateItem[] = rawCertificates
    .filter((c): c is CertificateItem => Boolean(c && typeof c === "object" && typeof c.id === "string"))
    .map((c, idx) => ({
      id: c.id,
      title: typeof c.title === "string" ? c.title : "Sertifikat",
      titleEn: typeof c.titleEn === "string" ? c.titleEn : undefined,
      issuer: typeof c.issuer === "string" ? c.issuer : "",
      issuerLogo: typeof c.issuerLogo === "string" ? c.issuerLogo : undefined,
      desc: typeof c.desc === "string" ? c.desc : undefined,
      descEn: typeof c.descEn === "string" ? c.descEn : undefined,
      date: typeof c.date === "string" ? c.date : "",
      credentialUrl: typeof c.credentialUrl === "string" ? c.credentialUrl : "",
      credentialPdf: typeof c.credentialPdf === "string" ? c.credentialPdf : undefined,
      credentialId: typeof c.credentialId === "string" ? c.credentialId : undefined,
      issuedDate: typeof c.issuedDate === "string" ? c.issuedDate : undefined,
      expiryDate: typeof c.expiryDate === "string" ? c.expiryDate : undefined,
      category: typeof c.category === "string" && c.category.trim() ? c.category.trim() : "design",
      image: typeof c.image === "string" ? c.image : undefined,
      featured: Boolean(c.featured),
      allowDownload: c.allowDownload !== false,
      published: c.published !== false,
      visible: c.visible !== false,
      sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : idx + 1,
    }));

  // 11. Tech Stack & Categories
  const rawTechStackCategories = Array.isArray(raw.techStackCategories)
    ? raw.techStackCategories
    : defaultTechStackCategories;
  const normalizedTechStackCategories: TechStackCategoryConfig[] = rawTechStackCategories
    .filter((c): c is TechStackCategoryConfig => Boolean(c && typeof c === "object" && typeof c.key === "string"))
    .map((c, idx) => ({
      key: c.key.trim() || `group-${idx}`,
      labelId: typeof c.labelId === "string" ? c.labelId : c.key,
      labelEn: typeof c.labelEn === "string" ? c.labelEn : c.labelId || c.key,
      sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : idx + 1,
      visible: c.visible !== false,
    }));

  const rawTechStack = Array.isArray(raw.techStack) ? raw.techStack : defaultTechStack;
  const normalizedTechStack: TechStackItem[] = rawTechStack
    .filter((t): t is TechStackItem => Boolean(t && typeof t === "object" && typeof t.id === "string"))
    .map((t, idx) => ({
      id: t.id,
      name: typeof t.name === "string" ? t.name : "Tool",
      category: typeof t.category === "string" && t.category.trim() ? t.category.trim() : "frontend",
      icon: typeof t.icon === "string" ? t.icon : "/icons/nextjs.svg",
      url: typeof t.url === "string" ? t.url : undefined,
      desc: typeof t.desc === "string" ? t.desc : undefined,
      descEn: typeof t.descEn === "string" ? t.descEn : undefined,
      sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : idx + 1,
      visible: t.visible !== false,
      published: t.published !== false,
      showInMarquee: t.showInMarquee !== false,
      showInGrid: t.showInGrid !== false,
    }));

  // 12. Services
  const rawServices = Array.isArray(raw.services) ? raw.services : defaultServices;
  const normalizedServices: ServiceItemConfig[] = rawServices
    .filter((s): s is ServiceItemConfig => Boolean(s && typeof s === "object" && typeof s.id === "string"))
    .map((s, idx) => ({
      id: s.id,
      key: typeof s.key === "string" ? s.key : `s${idx + 1}`,
      num: typeof s.num === "string" ? s.num : String(idx + 1).padStart(2, "0"),
      titleId: typeof s.titleId === "string" ? s.titleId : "Layanan",
      titleEn: typeof s.titleEn === "string" ? s.titleEn : "Service",
      descId: typeof s.descId === "string" ? s.descId : "",
      descEn: typeof s.descEn === "string" ? s.descEn : "",
      iconName: typeof s.iconName === "string" ? s.iconName : "layout",
      iconUrl: typeof s.iconUrl === "string" ? s.iconUrl : undefined,
      deliverablesId: Array.isArray(s.deliverablesId) ? s.deliverablesId.filter((d) => typeof d === "string") : undefined,
      deliverablesEn: Array.isArray(s.deliverablesEn) ? s.deliverablesEn.filter((d) => typeof d === "string") : undefined,
      ctaLabelId: typeof s.ctaLabelId === "string" ? s.ctaLabelId : undefined,
      ctaLabelEn: typeof s.ctaLabelEn === "string" ? s.ctaLabelEn : undefined,
      sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : idx + 1,
      visible: s.visible !== false,
      published: s.published !== false,
      ctaUrl: typeof s.ctaUrl === "string" ? s.ctaUrl : undefined,
    }));

  // 13. FAQ
  const rawFaq = Array.isArray(raw.faq) ? raw.faq : defaultFaq;
  const normalizedFaq: FaqItemConfig[] = rawFaq
    .filter((f): f is FaqItemConfig => Boolean(f && typeof f === "object" && typeof f.id === "string"))
    .map((f, idx) => ({
      id: f.id,
      questionId: typeof f.questionId === "string" ? f.questionId : "Pertanyaan",
      questionEn: typeof f.questionEn === "string" ? f.questionEn : "Question",
      answerId: typeof f.answerId === "string" ? f.answerId : "",
      answerEn: typeof f.answerEn === "string" ? f.answerEn : "",
      category: typeof f.category === "string" ? f.category : undefined,
      sortOrder: typeof f.sortOrder === "number" ? f.sortOrder : idx + 1,
      visible: f.visible !== false,
      published: f.published !== false,
    }));

  // 14. Blog
  const rawBlog = raw.blog;
  const normalizeBlogPostArray = (arr: unknown): ManualBlogPostConfig[] =>
    Array.isArray(arr)
      ? arr
          .filter((item): item is ManualBlogPostConfig => Boolean(item && typeof item === "object" && typeof item.id === "string"))
          .map((item, idx) => ({
            id: item.id,
            slug: typeof item.slug === "string" ? item.slug : slugifyProjectTitle(item.title || item.id, `post-${idx + 1}`),
            title: typeof item.title === "string" ? item.title : "Artikel",
            titleEn: typeof item.titleEn === "string" ? item.titleEn : undefined,
            excerpt: typeof item.excerpt === "string" ? item.excerpt : "",
            excerptEn: typeof item.excerptEn === "string" ? item.excerptEn : undefined,
            coverImage: typeof item.coverImage === "string" ? item.coverImage : undefined,
            coverAlt: typeof item.coverAlt === "string" ? item.coverAlt : undefined,
            url: typeof item.url === "string" ? item.url : "",
            category: typeof item.category === "string" ? item.category : "Article",
            date: typeof item.date === "string" ? item.date : "",
            readTime: typeof item.readTime === "string" ? item.readTime : undefined,
            featured: Boolean(item.featured),
            sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : idx + 1,
            published: item.published !== false,
            visible: item.visible !== false,
            pinned: Boolean(item.pinned),
          }))
      : [];

  const normalizedBlog: BlogConfig = rawBlog
    ? {
        feedUrl: typeof rawBlog.feedUrl === "string" ? rawBlog.feedUrl : defaultBlogConfig.feedUrl,
        portalUrl: typeof rawBlog.portalUrl === "string" && rawBlog.portalUrl ? rawBlog.portalUrl : (typeof rawBlog.feedUrl === "string" && rawBlog.feedUrl ? rawBlog.feedUrl : defaultBlogConfig.portalUrl),
        sourceMode: (["hybrid", "manual", "sync"].includes(rawBlog.sourceMode || "") ? rawBlog.sourceMode : "hybrid") as BlogConfig["sourceMode"],
        displayCount: typeof rawBlog.displayCount === "number" ? Math.min(Math.max(rawBlog.displayCount, 1), 12) : defaultBlogConfig.displayCount,
        visible: rawBlog.visible !== false,
        published: rawBlog.published !== false,
        titleId: typeof rawBlog.titleId === "string" ? rawBlog.titleId : defaultBlogConfig.titleId,
        titleEn: typeof rawBlog.titleEn === "string" ? rawBlog.titleEn : defaultBlogConfig.titleEn,
        descId: typeof rawBlog.descId === "string" ? rawBlog.descId : defaultBlogConfig.descId,
        descEn: typeof rawBlog.descEn === "string" ? rawBlog.descEn : defaultBlogConfig.descEn,
        ctaLabelId: typeof rawBlog.ctaLabelId === "string" ? rawBlog.ctaLabelId : defaultBlogConfig.ctaLabelId,
        ctaLabelEn: typeof rawBlog.ctaLabelEn === "string" ? rawBlog.ctaLabelEn : defaultBlogConfig.ctaLabelEn,
        manualPosts: normalizeBlogPostArray(rawBlog.manualPosts),
        syncedPosts: normalizeBlogPostArray(rawBlog.syncedPosts),
        syncedOverrides:
          rawBlog.syncedOverrides && typeof rawBlog.syncedOverrides === "object"
            ? rawBlog.syncedOverrides
            : {},
        lastSyncedAt: typeof rawBlog.lastSyncedAt === "string" ? rawBlog.lastSyncedAt : undefined,
      }
    : defaultBlogConfig;

  // 15. Sections & Ordering (excluding permanently forbidden 'workflow' section)
  const rawSections = raw.sections && typeof raw.sections === "object" ? raw.sections : {};
  const normalizedSections: Record<string, SectionConfigItem> = {};
  for (const [k, defVal] of Object.entries(defaultSections)) {
    const incoming = rawSections[k];
    normalizedSections[k] = {
      ...defVal,
      ...(incoming && typeof incoming === "object" ? incoming : {}),
      visible: incoming && typeof incoming.visible === "boolean" ? incoming.visible : defVal.visible,
    };
  }

  const normalizedSectionOrder: SectionKey[] = (() => {
    if (!Array.isArray(raw.sectionOrder) || raw.sectionOrder.length === 0) {
      return defaultSectionOrder;
    }
    const valid: SectionKey[] = [];
    for (const k of raw.sectionOrder) {
      if (defaultSectionOrder.includes(k) && !valid.includes(k)) {
        valid.push(k);
      }
    }
    const missing = defaultSectionOrder.filter((k) => !valid.includes(k));
    const headHero: SectionKey[] = missing.includes("hero") ? ["hero"] : [];
    const tailMissing = missing.filter((k) => k !== "hero");
    return [...headHero, ...valid, ...tailMissing];
  })();

  // 16. Navigation
  const normalizedNavigation: NavMenuItemConfig[] = Array.isArray(raw.navigation)
    ? raw.navigation
        .filter((n): n is NavMenuItemConfig => Boolean(n && typeof n === "object" && typeof n.href === "string"))
        .map((n, idx) => ({
          id: typeof n.id === "string" ? n.id : `nav-${idx + 1}`,
          labelId: typeof n.labelId === "string" ? n.labelId : "Menu",
          labelEn: typeof n.labelEn === "string" ? n.labelEn : (typeof n.labelId === "string" ? n.labelId : "Menu"),
          href: n.href.trim() || "#atas",
          sectionKey: n.sectionKey,
          iconName: typeof n.iconName === "string" ? n.iconName : "link",
          visible: n.visible !== false,
          sortOrder: typeof n.sortOrder === "number" ? n.sortOrder : idx + 1,
          isExternal: Boolean(n.isExternal || /^https?:\/\//i.test(n.href)),
        }))
    : defaultNavigation;

  // 17. Footer, Contact & SEO
  const normalizedFooter: FooterConfig = {
    ...defaultFooter,
    ...(raw.footer && typeof raw.footer === "object" ? raw.footer : {}),
    showWatermark: raw.footer?.showWatermark !== false,
    showSocials: raw.footer?.showSocials !== false,
    showEmail: raw.footer?.showEmail !== false,
  };

  const normalizedContactSection: ContactConfig = {
    ...defaultContactSection,
    ...(raw.contactSection && typeof raw.contactSection === "object" ? raw.contactSection : {}),
  };

  const normalizedSeo: SeoConfig = {
    ...defaultSiteConfig.seo,
    ...(raw.seo && typeof raw.seo === "object" ? raw.seo : {}),
    keywords: Array.isArray(raw.seo?.keywords) ? raw.seo.keywords.filter((k) => typeof k === "string") : defaultSiteConfig.seo?.keywords,
    robotsIndex: raw.seo?.robotsIndex !== false,
  };

  return {
    version: typeof raw.version === "number" ? raw.version : 1,
    schemaVersion: 2,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    headerLogoUrl,
    generalProfile: normalizedGeneralProfile,
    stats: normalizedStats,
    lanyard: normalizedLanyard,
    profileCard: normalizedProfileCard,
    projects: normalizedProjects,
    projectCategories: normalizedProjectCategories,
    cvDocs: normalizedCvDocs,
    cvSettings: normalizedCvSettings,
    education: normalizedEducation,
    experience: normalizedExperience,
    achievements: normalizedAchievements,
    certificates: normalizedCertificates,
    techStack: normalizedTechStack,
    techStackCategories: normalizedTechStackCategories,
    services: normalizedServices,
    faq: normalizedFaq,
    blog: normalizedBlog,
    seo: normalizedSeo,
    sections: normalizedSections,
    sectionOrder: normalizedSectionOrder,
    navigation: normalizedNavigation,
    footer: normalizedFooter,
    contactSection: normalizedContactSection,
  };
};
