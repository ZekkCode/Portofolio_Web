import type { SiteConfig } from "@/lib/site-config";
import {
  getPublishedProfile,
  getPublishedProjects,
  getPublishedEducation,
  getPublishedExperience,
  getPublishedAchievements,
  getPublishedCertificates,
  getPublishedTechStack,
  getPublishedServices,
  getPublishedCvDocs,
  getPublishedFAQ,
  mergeBlogPostsWithOverrides,
  isSectionVisible,
} from "@/lib/content/selectors";

export interface KnowledgeMatch {
  reply: string;
  action?: "greeting" | "success" | "thinking" | "idle";
  quickReplies?: string[];
  link?: string;
  linkLabel?: string;
}

export function queryBuddyKnowledge(
  rawMessage: string,
  langHint: "id" | "en" = "id",
  config?: SiteConfig
): KnowledgeMatch {
  const query = rawMessage.trim().toLowerCase();

  const isEn =
    langHint === "en" ||
    /\b(who|what|where|how|can|show|tell|project|skills|resume|cv|contact|email|hire|work|about|study|university|college|degree|blog|article|faq)\b/i.test(
      query
    );
  const locale = isEn ? "en" : "id";

  const pubProfile = getPublishedProfile(config, locale);
  const pubProjects = isSectionVisible(config, "projects")
    ? getPublishedProjects(config, { locale })
    : [];
  const pubEducation = isSectionVisible(config, "journey")
    ? getPublishedEducation(config, locale)
    : [];
  const pubExp = isSectionVisible(config, "about") || isSectionVisible(config, "journey")
    ? getPublishedExperience(config, locale)
    : [];
  const pubAchievements = isSectionVisible(config, "achievements")
    ? getPublishedAchievements(config, locale)
    : [];
  const pubCerts = isSectionVisible(config, "certificates")
    ? getPublishedCertificates(config, "all", locale)
    : [];
  const pubTechStack = isSectionVisible(config, "stack")
    ? getPublishedTechStack(config, "all", { locale })
    : [];
  const pubServices = isSectionVisible(config, "services")
    ? getPublishedServices(config, locale)
    : [];
  const pubCvDocs = isSectionVisible(config, "cv")
    ? getPublishedCvDocs(config, locale)
    : [];
  const pubFaq = isSectionVisible(config, "faq")
    ? getPublishedFAQ(config, locale)
    : [];
  const pubBlogPosts =
    isSectionVisible(config, "blog") && config?.blog?.visible !== false
      ? mergeBlogPostsWithOverrides(config, undefined, locale)
      : [];

  const profName = pubProfile.name;
  const profRoles = pubProfile.roles;
  const profEmail = pubProfile.email;
  const profLocation = pubProfile.location;
  const githubSocial =
    pubProfile.socials.find((s) => s.platform.toLowerCase() === "github")?.href ||
    `https://github.com/${pubProfile.githubUsername}`;

  // 1. Greetings
  if (/^(halo|hai|hey|hi|hello|pagi|siang|sore|malam|assalamualaikum|tes|test|ping)/.test(query)) {
    return {
      reply: isEn
        ? `Hi there! I'm Miss Minute, ${pubProfile.nickname}'s portfolio assistant. What would you like to explore about ${pubProfile.nickname}'s published work, credentials, services, or CV?`
        : `Halo! Aku Miss Minute, asisten portofolio ${pubProfile.nickname}. Mau intip karya terpublikasi, riwayat pendidikan, layanan, atau berkas CV?`,
      action: "greeting",
      quickReplies: isEn
        ? ["Who is Zekk?", "View Projects", "Where did you study?", "Download CV"]
        : ["Siapa Zekk?", "Lihat Proyek", "Kuliah di mana?", "Download CV"],
    };
  }

  // 2. FAQ matching from live published FAQ entries
  if (/faq|tanya|question|pertanyaan|biaya|harga|lama pengerjaan|timeline/i.test(query) && pubFaq.length > 0) {
    const matched =
      pubFaq.find((f) =>
        query.split(/\s+/).some((tok) => tok.length > 3 && f.question.toLowerCase().includes(tok))
      ) || pubFaq[0];
    return {
      reply: `${matched.question} — ${matched.answer}`,
      action: "success",
      link: "#faq",
      linkLabel: isEn ? "View FAQ Section" : "Lihat Bagian FAQ",
      quickReplies: isEn ? ["Services", "Projects", "Contact"] : ["Layanan", "Proyek", "Kontak"],
    };
  }

  // 3. Education
  if (
    /kuliah|kampus|pendidikan|universitas|sekolah|jurusan|study|where did you study|university|college|degree|akademik/i.test(
      query
    )
  ) {
    if (pubEducation.length > 0) {
      const latest = pubEducation[0];
      const names = pubEducation.map((e) => `${e.program} at ${e.institution} (${e.period})`).join("; ");
      return {
        reply: isEn
          ? `${profName}'s published academic journey: ${names}. Currently based in ${latest.location}.`
          : `Jejak akademik terpublikasi ${profName}: ${names}. Berlokasi di ${latest.location}.`,
        action: "success",
        link: "#journey",
        linkLabel: isEn ? "View Academic Journey" : "Lihat Jejak Akademik",
        quickReplies: isEn ? ["Featured Projects", "Tech Stack", "Contact"] : ["Proyek Pilihan", "Keahlian", "Kontak"],
      };
    }

    return {
      reply: isEn
        ? `No academic records are currently published on this section.`
        : `Saat ini belum ada riwayat akademik yang dipublikasikan pada seksi tersebut.`,
      action: "idle",
      link: "#tentang",
      linkLabel: isEn ? "View About Section" : "Lihat Bagian Tentang",
    };
  }

  // 4. Who is Zekk / About
  if (
    /siapa|tentang|about|who is|biodata|profil|profile|latar belakang|asal|lokasi/i.test(
      query
    )
  ) {
    return {
      reply: isEn
        ? `${profName} is based in ${profLocation}, working as ${profRoles}. ${pubProfile.heroDesc}`
        : `${profName} berdomisili di ${profLocation}, berfokus sebagai ${profRoles}. ${pubProfile.heroDesc}`,
      action: "success",
      link: "#tentang",
      linkLabel: isEn ? "Read Full Bio" : "Buka Bagian Tentang",
      quickReplies: isEn ? ["Tech Stack", "Projects", "Get in Touch"] : ["Tech Stack", "Proyek", "Hubungi Zekk"],
    };
  }

  // 5. Projects
  if (/proyek|project|karya|portfolio|portofolio|bikin apa|hasil|showcase|aplikasi|frontend project|it project|design project/i.test(query)) {
    const isFrontendFilter = /frontend|web|react|next|\bit\b/i.test(query);
    const isDesignFilter = /design|ui|ux|desain/i.test(query);

    let matching = pubProjects;
    if (isFrontendFilter) {
      matching = pubProjects.filter((p) => p.category === "it" || p.category === "both");
    } else if (isDesignFilter) {
      matching = pubProjects.filter((p) => p.category === "design" || p.category === "both");
    }

    const count = matching.length;
    const names = matching.slice(0, 4).map((p) => p.title).join(", ");

    if (count > 0) {
      return {
        reply: isEn
          ? `There are ${count} published ${isFrontendFilter ? "IT/Web " : isDesignFilter ? "UI/UX & Design " : ""}project(s), including: ${names}.`
          : `Saat ini terdapat ${count} proyek ${isFrontendFilter ? "IT/Web " : isDesignFilter ? "UI/UX & Desain " : ""}terpublikasi, meliputi: ${names}.`,
        action: "success",
        link: "#proyek",
        linkLabel: isEn ? "Explore Projects" : "Lihat Grid Proyek",
        quickReplies: isEn ? ["Tech Stack", "Download CV", "Contact"] : ["Tech Stack", "Download CV", "Kontak"],
      };
    }

    return {
      reply: isEn
        ? `No published projects are displayed right now. Repositories can also be explored directly via GitHub.`
        : `Belum ada proyek terpublikasi yang ditampilkan saat ini. Kamu juga dapat melihat repositori langsung di GitHub.`,
      action: "idle",
      link: githubSocial,
      linkLabel: isEn ? "Open GitHub" : "Buka GitHub",
      quickReplies: isEn ? ["Tech Stack", "Download CV", "Contact"] : ["Tech Stack", "Download CV", "Kontak"],
    };
  }

  // 6. Skills / Tech Stack
  if (/skill|keahlian|stack|teknologi|tools|bahasa|figma|next|react|typescript|tailwind|flutter/i.test(query)) {
    if (pubTechStack.length > 0) {
      const tools = pubTechStack.slice(0, 10).map((s) => s.name).join(", ");
      return {
        reply: isEn
          ? `${profName}'s published Tech Stack currently includes ${pubTechStack.length} tool(s): ${tools}.`
          : `Tech stack terpublikasi milik ${profName} mencakup ${pubTechStack.length} alat/teknologi: ${tools}.`,
        action: "success",
        link: "#stack",
        linkLabel: isEn ? "View Tech Stack" : "Lihat Tech Stack Lengkap",
        quickReplies: isEn ? ["Certifications", "Projects", "Services"] : ["Sertifikat", "Proyek", "Layanan"],
      };
    }

    return {
      reply: isEn
        ? `Tech stack tools are currently hidden or empty.`
        : `Daftar tech stack sedang disembunyikan atau belum terpublikasi.`,
      action: "idle",
      link: "#stack",
      linkLabel: isEn ? "View Section" : "Lihat Bagian",
    };
  }

  // 7. CV / Resume / ATS
  if (/cv|resume|berkas|ats|riwayat|download cv|unduh cv|pdf/i.test(query)) {
    const roleTitles = pubCvDocs.map((d) => d.title).join(", ");
    if (pubCvDocs.length > 0) {
      return {
        reply: isEn
          ? `${profName} provides ${pubCvDocs.length} interactive CV dossier(s): ${roleTitles}. Open the Career Folder section to preview pages or download PDF.`
          : `${profName} menyediakan ${pubCvDocs.length} berkas CV ATS interaktif: ${roleTitles}. Buka folder berkas karir untuk pratinjau halaman maupun unduhan PDF.`,
        action: "success",
        link: "#cv",
        linkLabel: isEn ? "Open CV Folder" : "Buka Folder Berkas CV",
        quickReplies: isEn ? ["Contact Zekk", "Experience", "Skills"] : ["Kontak Zekk", "Pengalaman", "Keahlian"],
      };
    }

    return {
      reply: isEn
        ? `The CV dossier section is currently hidden or has no published documents.`
        : `Berkas CV saat ini sedang disembunyikan atau belum tersedia secara publik.`,
      action: "idle",
    };
  }

  // 8. Certifications & Achievements
  if (/sertifikat|sertifikasi|certificate|credential|prestasi|achievement|award|juara|penghargaan|berapa sertifikat/i.test(query)) {
    const certsCount = pubCerts.length;
    const achCount = pubAchievements.length;
    const sampleCerts = pubCerts.slice(0, 3).map((c) => `${c.title} (${c.issuer})`).join(", ");
    const sampleAch = pubAchievements.slice(0, 2).map((a) => `${a.title} (${a.organizer})`).join(", ");

    if (certsCount === 0 && achCount === 0) {
      return {
        reply: isEn
          ? `There are no verified certificates or awards currently published.`
          : `Saat ini belum ada sertifikat atau penghargaan terpublikasi yang ditampilkan.`,
        action: "idle",
      };
    }

    const partsId: string[] = [];
    const partsEn: string[] = [];
    if (certsCount > 0) {
      partsId.push(`${certsCount} sertifikat terpublikasi (${sampleCerts})`);
      partsEn.push(`${certsCount} published certificate(s) (${sampleCerts})`);
    }
    if (achCount > 0) {
      partsId.push(`${achCount} pencapaian/penghargaan (${sampleAch})`);
      partsEn.push(`${achCount} achievement(s) (${sampleAch})`);
    }

    return {
      reply: isEn
        ? `${profName} currently displays ${partsEn.join(" and ")}.`
        : `${profName} saat ini menampilkan ${partsId.join(" serta ")}.`,
      action: "success",
      link: certsCount > 0 ? "#certificates" : "#achievements",
      linkLabel: isEn ? "View Credentials" : "Lihat Kredensial",
      quickReplies: isEn ? ["Projects", "Download CV", "Contact"] : ["Proyek", "Unduh CV", "Kontak"],
    };
  }

  // 9. Contact
  if (/kontak|contact|email|hubungi|bagaimana menghubungi|hire|kerja sama|freelance|whatsapp|wa|pesan|jasa/i.test(query)) {
    return {
      reply: isEn
        ? `Reach out directly via email at ${profEmail} (${pubProfile.availability}).`
        : `Kamu dapat menghubungi ${profName} langsung via email di ${profEmail} (${pubProfile.availability}).`,
      action: "success",
      link: "#kontak",
      linkLabel: isEn ? "Go to Contact Section" : "Menuju Bagian Kontak",
      quickReplies: isEn ? ["Services", "View CV", "Projects"] : ["Layanan", "Buka CV", "Proyek"],
    };
  }

  // 10. Career & Experience
  if (/pengalaman|karier|career|organisasi|kerja|experience|riwayat kerja/i.test(query)) {
    if (pubExp.length > 0) {
      const expList = pubExp.slice(0, 4).map((e) => `${e.role} di ${e.org} (${e.period})`).join("; ");
      return {
        reply: isEn
          ? `${profName}'s published experience records include ${pubExp.length} role(s): ${expList}.`
          : `Rekam jejak terpublikasi ${profName} mencakup ${pubExp.length} posisi: ${expList}.`,
        action: "success",
        link: "#tentang",
        linkLabel: isEn ? "View Career Timeline" : "Lihat Linimasa Karier",
        quickReplies: isEn ? ["Education", "Projects", "Download CV"] : ["Pendidikan", "Proyek", "Unduh CV"],
      };
    }

    return {
      reply: isEn
        ? `No public experience records are currently displayed.`
        : `Belum ada catatan pengalaman terpublikasi yang ditampilkan saat ini.`,
      action: "idle",
    };
  }

  // 11. Services
  if (/layanan|services|bisa bantu apa|service|jasa apa/i.test(query)) {
    if (pubServices.length > 0) {
      const list = pubServices.map((s) => s.title).join(", ");
      return {
        reply: isEn
          ? `${profName} offers ${pubServices.length} published service pillar(s): ${list}.`
          : `${profName} menyediakan ${pubServices.length} pilar layanan aktif: ${list}.`,
        action: "success",
        link: "#services",
        linkLabel: isEn ? "View Services" : "Lihat Daftar Layanan",
        quickReplies: isEn ? ["Tech Stack", "Projects", "Contact"] : ["Tech Stack", "Proyek", "Kontak"],
      };
    }

    return {
      reply: isEn
        ? `The services section is currently hidden or empty.`
        : `Daftar layanan saat ini disembunyikan atau belum tersedia.`,
      action: "idle",
    };
  }

  // 12. Blog / Writing
  if (/blog|artikel|tulisan|writing|article|post/i.test(query)) {
    if (pubBlogPosts.length > 0) {
      const titles = pubBlogPosts.slice(0, 3).map((b) => b.title).join(", ");
      return {
        reply: isEn
          ? `Latest published writing includes: ${titles}.`
          : `Tulisan terbaru yang ditampilkan meliputi: ${titles}.`,
        action: "success",
        link: "#blog",
        linkLabel: isEn ? "View Blog Section" : "Lihat Seksi Blog",
      };
    }
    return {
      reply: isEn
        ? `No blog posts are currently published on this portfolio.`
        : `Saat ini tidak ada artikel blog yang ditampilkan pada portofolio.`,
      action: "idle",
    };
  }

  // 13. Default / Fallback
  return {
    reply: isEn
      ? `I can help you explore ${profName}'s published projects (${pubProjects.length}), certificates (${pubCerts.length}), services (${pubServices.length}), education, tech stack, and CV. What would you like to check?`
      : `Aku bisa bantu jelaskan proyek terpublikasi (${pubProjects.length}), sertifikat (${pubCerts.length}), layanan (${pubServices.length}), riwayat kuliah, tech stack, maupun CV ${profName}. Mau tahu yang mana?`,
    action: "idle",
    quickReplies: isEn
      ? ["Who is Zekk?", "Show Projects", "Services", "Get in Touch"]
      : ["Siapa Zekk?", "Lihat Proyek", "Layanan", "Kontak Zekk"],
  };
}
