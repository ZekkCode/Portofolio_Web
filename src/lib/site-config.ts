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
  visible?: boolean;
};

export type GeneralProfileConfig = {
  name: string;
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
  email: string;
  phone: string;
  whatsapp: string;
  socials: SocialLinkItem[];
};

export type StatsConfig = {
  mode: "auto" | "manual";
  projectsCount: number;
  certificatesCount: number;
  experienceYears: string;
  organizationsCount: number;
};

export type Project = {
  id: string;
  title: string;
  titleEn?: string;
  desc: string;
  descEn?: string;
  category?: "it" | "design" | "both";
  tags: string[];
  repo: string;
  role?: string;
  problem?: string;
  problemEn?: string;
  approach?: string;
  approachEn?: string;
  highlight?: string;
  outcome?: string;
  outcomeEn?: string;
  image?: string;
  galleryImages?: string[];
  previewUrl?: string;
  featured?: boolean;
  published?: boolean;
  sortOrder?: number;
};

export type CvDocConfig = {
  id: string;
  roleKey: "graphic" | "uiux" | "frontend" | "itsupport";
  title: string;
  subtitle: string;
  color: string;
  pdfUrl?: string;
  pageCount?: number;
  pages?: string[];
};

export type AcademicProject = {
  title: string;
  desc?: string;
  repo?: string;
  url?: string;
};

export type EducationItem = {
  id: string;
  institution: string;
  location: string;
  program: string;
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
  projects?: AcademicProject[];
  desc?: string;
  descEn?: string;
  logo?: string;
  website?: string;
  published?: boolean;
  sortOrder?: number;
};

export type ExperienceItem = {
  id: string;
  role: string;
  roleEn?: string;
  org: string;
  place: string;
  period: string;
  desc: string;
  descEn?: string;
  logo?: string;
  highlights?: string[];
  highlightsEn?: string[];
  published?: boolean;
  sortOrder?: number;
};

export type AchievementItem = {
  id: string;
  title: string;
  titleEn?: string;
  organizer: string;
  category: "award" | "competition" | "ambassador" | "program" | "leadership";
  date: string;
  desc: string;
  descEn?: string;
  image?: string;
  evidenceUrl?: string;
  featured?: boolean;
  published?: boolean;
  sortOrder?: number;
};

export type CertificateItem = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialUrl?: string;
  credentialPdf?: string;
  credentialId?: string;
  issuedDate?: string;
  expiryDate?: string;
  category: "design" | "frontend" | "systems" | "all";
  image?: string;
  featured?: boolean;
  published?: boolean;
  sortOrder?: number;
};

export type TechStackItem = {
  id: string;
  name: string;
  category: "uiux" | "frontend" | "visual" | "systems";
  icon: string;
  sortOrder?: number;
  visible?: boolean;
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
  sortOrder?: number;
  visible?: boolean;
  ctaUrl?: string;
};

export type FaqItemConfig = {
  id: string;
  questionId: string;
  questionEn: string;
  answerId: string;
  answerEn: string;
  sortOrder?: number;
  visible?: boolean;
};

export type BlogConfig = {
  feedUrl: string;
  displayCount: number;
  visible: boolean;
  titleId?: string;
  titleEn?: string;
  descId?: string;
  descEn?: string;
};

export type SiteConfig = {
  headerLogoUrl: string;
  generalProfile: GeneralProfileConfig;
  stats: StatsConfig;
  lanyard: LanyardConfig;
  profileCard: ProfileCardConfig;
  projects: Project[];
  cvDocs: CvDocConfig[];
  education: EducationItem[];
  experience: ExperienceItem[];
  achievements: AchievementItem[];
  certificates: CertificateItem[];
  techStack: TechStackItem[];
  services: ServiceItemConfig[];
  faq: FaqItemConfig[];
  blog: BlogConfig;
};

export const defaultLanyard: LanyardConfig = {
  frontImage: "/card-front.webp",
  backImage: "",
  strapImage: "",
  imageFit: "cover",
  cardColor: "#0b2a8a",
  orientation: "portrait",
  finish: "glossy",
  cornerRadius: 0.3,
  size: 0.36,
  anchor: "center",
  strapLength: 0.32,
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
  imageFit: "contain",
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
    "Berangkat dari latar belakang desain grafis, multimedia, serta perakitan dan pemeliharaan perangkat komputer. Berpengalaman merancang antarmuka web yang rapi, responsif, dan mudah digunakan untuk organisasi kampus dan klien freelance.",
  ],
  bioEn: [
    "Informatics Engineering student at Universitas Trunojoyo Madura (class of 2024) specializing in UI/UX design and frontend web engineering since 2020. Experienced in crafting design systems in Figma and translating them into robust Next.js and TypeScript applications.",
    "Rooted in graphic design, multimedia, and computer hardware maintenance. Proven track record in delivering clean, responsive, and accessible web interfaces for campus organizations and freelance clients.",
  ],
  avatarUrl: "/profile.webp",
  location: "Mojokerto, Jawa Timur",
  locationEn: "Mojokerto, East Java, Indonesia",
  availability: "Terbuka untuk kolaborasi & proyek freelance",
  availabilityEn: "Open for collaboration & freelance projects",
  email: profile.contact.email,
  phone: profile.contact.phone,
  whatsapp: profile.contact.whatsapp,
  socials: [
    { id: "soc-1", platform: "github", label: "GitHub", href: "https://github.com/ZekkCode", visible: true },
    { id: "soc-2", platform: "instagram", label: "Instagram", href: "https://www.instagram.com/zekksparow", visible: true },
    { id: "soc-3", platform: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@zekksparow", visible: true },
    { id: "soc-4", platform: "behance", label: "Behance", href: "https://www.behance.net/zakariamp", visible: true },
    { id: "soc-5", platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/zakariamp", visible: true },
    { id: "soc-6", platform: "trakteer", label: "Trakteer", href: "https://trakteer.id/zakariamp", visible: true },
  ],
};

export const defaultStats: StatsConfig = {
  mode: "auto",
  projectsCount: 7,
  certificatesCount: 29,
  experienceYears: "6+",
  organizationsCount: 3,
};

export const defaultProjects: Project[] = [];

export const defaultCvDocs: CvDocConfig[] = [
  {
    id: "cv-graphic",
    roleKey: "graphic",
    title: "Desainer Grafis",
    subtitle: "Multimedia & Visual Identity",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-uiux",
    roleKey: "uiux",
    title: "UI/UX Designer",
    subtitle: "Product Design & Prototyping",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-frontend",
    roleKey: "frontend",
    title: "Frontend Developer",
    subtitle: "Next.js & TypeScript Systems",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
  },
  {
    id: "cv-itsupport",
    roleKey: "itsupport",
    title: "IT Support Specialist",
    subtitle: "Hardware, Network & Linux Systems",
    color: "#0284c7",
    pdfUrl: "/cv-ats-zakariamp-2025.pdf",
    pageCount: 4,
    pages: ["/cv-page-1.png", "/cv-page-2.png", "/cv-page-3.png", "/cv-page-4.png"],
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

export const defaultBlogConfig: BlogConfig = {
  feedUrl: "https://zekktech.biz.id/blog",
  displayCount: 3,
  visible: true,
  titleId: "Latest from ZekkTech Blog",
  titleEn: "Latest from ZekkTech Blog",
  descId: "Catatan, pembahasan, dan artikel seputar teknologi serta dunia digital.",
  descEn: "Notes, thoughts, and technical articles on design and web engineering.",
};

export const defaultSiteConfig: SiteConfig = {
  headerLogoUrl: "",
  generalProfile: defaultGeneralProfile,
  stats: defaultStats,
  lanyard: defaultLanyard,
  profileCard: defaultProfileCard,
  projects: defaultProjects,
  cvDocs: defaultCvDocs,
  education: defaultEducation,
  experience: defaultExperience,
  achievements: defaultAchievements,
  certificates: defaultCertificates,
  techStack: defaultTechStack,
  services: defaultServices,
  faq: defaultFaq,
  blog: defaultBlogConfig,
};

export const normalizeConfig = (input: unknown): SiteConfig => {
  const raw = (input ?? {}) as Partial<SiteConfig>;
  const headerLogoUrl = typeof raw.headerLogoUrl === "string" ? raw.headerLogoUrl : "";

  // 1. General Profile
  const rawProfile = raw.generalProfile;
  const normalizedGeneralProfile: GeneralProfileConfig = rawProfile
    ? {
        name: typeof rawProfile.name === "string" ? rawProfile.name : defaultGeneralProfile.name,
        nickname: typeof rawProfile.nickname === "string" ? rawProfile.nickname : defaultGeneralProfile.nickname,
        brand: typeof rawProfile.brand === "string" ? rawProfile.brand : defaultGeneralProfile.brand,
        roles: typeof rawProfile.roles === "string" ? rawProfile.roles : defaultGeneralProfile.roles,
        rolesEn: typeof rawProfile.rolesEn === "string" ? rawProfile.rolesEn : defaultGeneralProfile.rolesEn,
        heroDesc: typeof rawProfile.heroDesc === "string" ? rawProfile.heroDesc : defaultGeneralProfile.heroDesc,
        heroDescEn: typeof rawProfile.heroDescEn === "string" ? rawProfile.heroDescEn : defaultGeneralProfile.heroDescEn,
        bio: Array.isArray(rawProfile.bio) && rawProfile.bio.length > 0 ? rawProfile.bio : defaultGeneralProfile.bio,
        bioEn: Array.isArray(rawProfile.bioEn) && rawProfile.bioEn.length > 0 ? rawProfile.bioEn : defaultGeneralProfile.bioEn,
        avatarUrl: typeof rawProfile.avatarUrl === "string" ? rawProfile.avatarUrl : defaultGeneralProfile.avatarUrl,
        location: typeof rawProfile.location === "string" ? rawProfile.location : defaultGeneralProfile.location,
        locationEn: typeof rawProfile.locationEn === "string" ? rawProfile.locationEn : defaultGeneralProfile.locationEn,
        availability: typeof rawProfile.availability === "string" ? rawProfile.availability : defaultGeneralProfile.availability,
        availabilityEn: typeof rawProfile.availabilityEn === "string" ? rawProfile.availabilityEn : defaultGeneralProfile.availabilityEn,
        email: typeof rawProfile.email === "string" ? rawProfile.email : defaultGeneralProfile.email,
        phone: typeof rawProfile.phone === "string" ? rawProfile.phone : defaultGeneralProfile.phone,
        whatsapp: typeof rawProfile.whatsapp === "string" ? rawProfile.whatsapp : defaultGeneralProfile.whatsapp,
        socials: Array.isArray(rawProfile.socials)
          ? rawProfile.socials.filter((s): s is SocialLinkItem => Boolean(s && typeof s === "object" && typeof s.href === "string"))
          : defaultGeneralProfile.socials,
      }
    : defaultGeneralProfile;

  // 2. Stats
  const rawStats = raw.stats;
  const normalizedStats: StatsConfig = rawStats
    ? {
        mode: rawStats.mode === "manual" ? "manual" : "auto",
        projectsCount: typeof rawStats.projectsCount === "number" ? rawStats.projectsCount : defaultStats.projectsCount,
        certificatesCount: typeof rawStats.certificatesCount === "number" ? rawStats.certificatesCount : defaultStats.certificatesCount,
        experienceYears: typeof rawStats.experienceYears === "string" ? rawStats.experienceYears : defaultStats.experienceYears,
        organizationsCount: typeof rawStats.organizationsCount === "number" ? rawStats.organizationsCount : defaultStats.organizationsCount,
      }
    : defaultStats;

  // 3. Lanyard
  const rawLanyard = raw.lanyard ? { ...raw.lanyard } : undefined;
  if (rawLanyard && (rawLanyard.size === 0.58 || rawLanyard.size === 0.6)) {
    rawLanyard.size = defaultLanyard.size;
  }
  if (rawLanyard && (rawLanyard.strapLength === 0.85 || !rawLanyard.strapLength)) {
    rawLanyard.strapLength = defaultLanyard.strapLength;
  }

  const normalizedLanyard: LanyardConfig = {
    ...defaultLanyard,
    ...rawLanyard,
  };

  // 4. Profile Card
  const normalizedProfileCard: ProfileCardConfig = {
    ...defaultProfileCard,
    ...(raw.profileCard ? { ...raw.profileCard } : undefined),
    statusColor: "#22c55e",
  };

  // 5. Projects
  const rawProjects = Array.isArray(raw.projects) ? raw.projects : defaultProjects;
  const normalizedProjects = rawProjects
    .filter((p): p is Project => Boolean(p && typeof p === "object" && typeof p.id === "string"))
    .map((p, idx) => ({
      id: p.id,
      title: typeof p.title === "string" ? p.title : "Proyek",
      titleEn: typeof p.titleEn === "string" ? p.titleEn : undefined,
      desc: typeof p.desc === "string" ? p.desc : "",
      descEn: typeof p.descEn === "string" ? p.descEn : undefined,
      category: (["it", "design", "both"].includes(p.category || "") ? p.category : "both") as "it" | "design" | "both",
      tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string") : [],
      repo: typeof p.repo === "string" ? p.repo : "",
      role: typeof p.role === "string" ? p.role : undefined,
      problem: typeof p.problem === "string" ? p.problem : undefined,
      problemEn: typeof p.problemEn === "string" ? p.problemEn : undefined,
      approach: typeof p.approach === "string" ? p.approach : undefined,
      approachEn: typeof p.approachEn === "string" ? p.approachEn : undefined,
      highlight: typeof p.highlight === "string" ? p.highlight : undefined,
      outcome: typeof p.outcome === "string" ? p.outcome : undefined,
      outcomeEn: typeof p.outcomeEn === "string" ? p.outcomeEn : undefined,
      image: typeof p.image === "string" ? p.image : undefined,
      galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.filter((img) => typeof img === "string") : [],
      previewUrl: typeof p.previewUrl === "string" ? p.previewUrl : undefined,
      featured: Boolean(p.featured),
      published: p.published !== false,
      sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : idx + 1,
    }));

  // 6. CV Docs
  const rawCvDocs = Array.isArray(raw.cvDocs) ? raw.cvDocs : defaultCvDocs;
  const normalizedCvDocs = defaultCvDocs.map((defaultDoc) => {
    const override = rawCvDocs.find((d) => d && d.roleKey === defaultDoc.roleKey);
    if (!override) return defaultDoc;
    return {
      ...defaultDoc,
      ...override,
      pdfUrl: typeof override.pdfUrl === "string" && override.pdfUrl ? override.pdfUrl : defaultDoc.pdfUrl,
      pages: Array.isArray(override.pages) && override.pages.length ? override.pages : defaultDoc.pages,
    };
  });

  // 7. Education
  const rawEducation = Array.isArray(raw.education) ? raw.education : defaultEducation;
  const normalizedEducation: EducationItem[] = rawEducation
    .filter((e): e is EducationItem => Boolean(e && typeof e === "object" && typeof e.id === "string"))
    .map((e, idx) => ({
      id: e.id,
      institution: typeof e.institution === "string" ? e.institution : "Institusi Pendidikan",
      location: typeof e.location === "string" ? e.location : "",
      program: typeof e.program === "string" ? e.program : "",
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
      projects: Array.isArray(e.projects)
        ? e.projects.filter((p) => p && typeof p === "object" && typeof p.title === "string")
        : [],
      desc: typeof e.desc === "string" ? e.desc : "",
      descEn: typeof e.descEn === "string" ? e.descEn : undefined,
      logo: typeof e.logo === "string" ? e.logo : undefined,
      website: typeof e.website === "string" ? e.website : undefined,
      published: e.published !== false,
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
      place: typeof e.place === "string" ? e.place : "Lokasi",
      period: typeof e.period === "string" ? e.period : "",
      desc: typeof e.desc === "string" ? e.desc : "",
      descEn: typeof e.descEn === "string" ? e.descEn : undefined,
      logo: typeof e.logo === "string" ? e.logo : undefined,
      highlights: Array.isArray(e.highlights) ? e.highlights.filter((h) => typeof h === "string") : undefined,
      highlightsEn: Array.isArray(e.highlightsEn) ? e.highlightsEn.filter((h) => typeof h === "string") : undefined,
      published: e.published !== false,
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
      category: (["award", "competition", "ambassador", "program", "leadership"].includes(a.category)
        ? a.category
        : "award") as "award" | "competition" | "ambassador" | "program" | "leadership",
      date: typeof a.date === "string" ? a.date : "",
      desc: typeof a.desc === "string" ? a.desc : "",
      descEn: typeof a.descEn === "string" ? a.descEn : undefined,
      image: typeof a.image === "string" ? a.image : undefined,
      evidenceUrl: typeof a.evidenceUrl === "string" ? a.evidenceUrl : undefined,
      featured: Boolean(a.featured),
      published: a.published !== false,
      sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : idx + 1,
    }));

  // 10. Certificates
  const rawCertificates = Array.isArray(raw.certificates) ? raw.certificates : defaultCertificates;
  const normalizedCertificates: CertificateItem[] = rawCertificates
    .filter((c): c is CertificateItem => Boolean(c && typeof c === "object" && typeof c.id === "string"))
    .map((c, idx) => ({
      id: c.id,
      title: typeof c.title === "string" ? c.title : "Sertifikat",
      issuer: typeof c.issuer === "string" ? c.issuer : "",
      date: typeof c.date === "string" ? c.date : "",
      credentialUrl: typeof c.credentialUrl === "string" ? c.credentialUrl : "",
      credentialPdf: typeof c.credentialPdf === "string" ? c.credentialPdf : undefined,
      credentialId: typeof c.credentialId === "string" ? c.credentialId : undefined,
      issuedDate: typeof c.issuedDate === "string" ? c.issuedDate : undefined,
      expiryDate: typeof c.expiryDate === "string" ? c.expiryDate : undefined,
      category: (["design", "frontend", "systems", "all"].includes(c.category)
        ? c.category
        : "design") as "design" | "frontend" | "systems" | "all",
      image: typeof c.image === "string" ? c.image : undefined,
      featured: Boolean(c.featured),
      published: c.published !== false,
      sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : idx + 1,
    }));

  // 11. Tech Stack
  const rawTechStack = Array.isArray(raw.techStack) ? raw.techStack : defaultTechStack;
  const normalizedTechStack: TechStackItem[] = rawTechStack
    .filter((t): t is TechStackItem => Boolean(t && typeof t === "object" && typeof t.id === "string"))
    .map((t, idx) => ({
      id: t.id,
      name: typeof t.name === "string" ? t.name : "Tool",
      category: (["uiux", "frontend", "visual", "systems"].includes(t.category)
        ? t.category
        : "frontend") as "uiux" | "frontend" | "visual" | "systems",
      icon: typeof t.icon === "string" ? t.icon : "/icons/nextjs.svg",
      sortOrder: typeof t.sortOrder === "number" ? t.sortOrder : idx + 1,
      visible: t.visible !== false,
    }));

  // 12. Services
  const rawServices = Array.isArray(raw.services) ? raw.services : defaultServices;
  const normalizedServices: ServiceItemConfig[] = rawServices
    .filter((s): s is ServiceItemConfig => Boolean(s && typeof s === "object" && typeof s.id === "string"))
    .map((s, idx) => ({
      id: s.id,
      key: typeof s.key === "string" ? s.key : `s${idx + 1}`,
      num: typeof s.num === "string" ? s.num : `0${idx + 1}`,
      titleId: typeof s.titleId === "string" ? s.titleId : "Layanan",
      titleEn: typeof s.titleEn === "string" ? s.titleEn : "Service",
      descId: typeof s.descId === "string" ? s.descId : "",
      descEn: typeof s.descEn === "string" ? s.descEn : "",
      iconName: typeof s.iconName === "string" ? s.iconName : "layout",
      sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : idx + 1,
      visible: s.visible !== false,
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
      sortOrder: typeof f.sortOrder === "number" ? f.sortOrder : idx + 1,
      visible: f.visible !== false,
    }));

  // 14. Blog
  const rawBlog = raw.blog;
  const normalizedBlog: BlogConfig = rawBlog
    ? {
        feedUrl: typeof rawBlog.feedUrl === "string" ? rawBlog.feedUrl : defaultBlogConfig.feedUrl,
        displayCount: typeof rawBlog.displayCount === "number" ? Math.min(Math.max(rawBlog.displayCount, 1), 6) : defaultBlogConfig.displayCount,
        visible: rawBlog.visible !== false,
        titleId: typeof rawBlog.titleId === "string" ? rawBlog.titleId : defaultBlogConfig.titleId,
        titleEn: typeof rawBlog.titleEn === "string" ? rawBlog.titleEn : defaultBlogConfig.titleEn,
        descId: typeof rawBlog.descId === "string" ? rawBlog.descId : defaultBlogConfig.descId,
        descEn: typeof rawBlog.descEn === "string" ? rawBlog.descEn : defaultBlogConfig.descEn,
      }
    : defaultBlogConfig;

  return {
    headerLogoUrl,
    generalProfile: normalizedGeneralProfile,
    stats: normalizedStats,
    lanyard: normalizedLanyard,
    profileCard: normalizedProfileCard,
    projects: normalizedProjects,
    cvDocs: normalizedCvDocs,
    education: normalizedEducation,
    experience: normalizedExperience,
    achievements: normalizedAchievements,
    certificates: normalizedCertificates,
    techStack: normalizedTechStack,
    services: normalizedServices,
    faq: normalizedFaq,
    blog: normalizedBlog,
  };
};
