export type LocalizedText = { id: string; en: string };

export interface AcademicEntry {
  id: string;
  institution: string;
  program: LocalizedText;
  startYear: string;
  endYear?: string;
  focus: LocalizedText;
  website?: string;
}

export interface RecognitionEntry {
  id: string;
  title: string;
  organizer: string;
  kind: "ambassador" | "award" | "competition" | "leadership" | "program";
  period?: string;
  description?: LocalizedText;
  evidenceUrl?: string;
  imageUrl?: string;
}

// Only include information already provided by the portfolio owner.
// Do not infer a graduation year, GPA, admission status, or academic honors.
export const academicHistory: AcademicEntry[] = [
  {
    id: "utm-informatics-2024",
    institution: "Universitas Trunojoyo Madura",
    program: {
      id: "S1 Teknik Informatika",
      en: "Bachelor's Degree in Informatics",
    },
    startYear: "2024",
    focus: {
      id: "Pengembangan web, perancangan UI/UX, algoritma, dan sistem informasi.",
      en: "Web development, UI/UX design, algorithms, and information systems.",
    },
  },
];

// Ambassador roles were provided by the portfolio owner. Dates, awards,
// selection details and evidence links remain absent until verified.
export const recognitions: RecognitionEntry[] = [
  {
    id: "google-student-ambassador",
    title: "Google Student Ambassador",
    organizer: "Google",
    kind: "ambassador",
  },
  {
    id: "myskill-campus-ambassador",
    title: "MySkill Campus Ambassador",
    organizer: "MySkill",
    kind: "ambassador",
  },
];
