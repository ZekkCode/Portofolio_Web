import type { SiteConfig } from "@/lib/site-config";
import {
  getPublishedProfile,
  getPublishedProjects,
  getPublishedEducation,
  getPublishedCertificates,
  getPublishedTechStack,
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

  // English detection
  const isEn =
    langHint === "en" ||
    /\b(who|what|where|how|can|show|tell|project|skills|resume|cv|contact|email|hire|work|about|study|university|college|degree)\b/i.test(
      query
    );

  const pubProfile = getPublishedProfile(config, isEn ? "en" : "id");
  const pubProjects = getPublishedProjects(config, { locale: isEn ? "en" : "id" });
  const pubEducation = getPublishedEducation(config, isEn ? "en" : "id");
  const pubCerts = getPublishedCertificates(config);
  const pubTechStack = getPublishedTechStack(config);

  const profName = pubProfile.name;
  const profRoles = pubProfile.roles;
  const profEmail = pubProfile.email;
  const profLocation = pubProfile.location;

  // 1. Greetings
  if (/^(halo|hai|hey|hi|hello|pagi|siang|sore|malam|assalamualaikum|tes|test|ping)/.test(query)) {
    return {
      reply: isEn
        ? `Hi there! I'm Miss Minute, ${pubProfile.nickname}'s AI companion. What would you like to explore about his published projects, education, skills, or CV?`
        : `Halo! Aku Miss Minute, asisten portofolio ${pubProfile.nickname}. Mau intip proyek terpublikasi, riwayat kuliah, tech stack, atau unduh CV ATS?`,
      action: "greeting",
      quickReplies: isEn
        ? ["Who is Zekk?", "View Projects", "Where did you study?", "Download CV"]
        : ["Siapa Zekk?", "Lihat Proyek", "Kuliah di mana?", "Download CV"],
    };
  }

  // 2. Education / Campus / Kuliah di mana
  if (
    /kuliah|kampus|pendidikan|universitas|sekolah|jurusan|study|where did you study|university|college|degree|trunojoyo/i.test(
      query
    )
  ) {
    if (pubEducation.length > 0) {
      const primaryEdu = pubEducation[pubEducation.length - 1]; // latest
      const details = `${primaryEdu.program} di ${primaryEdu.institution} (${primaryEdu.period})`;
      return {
        reply: isEn
          ? `${profName} is studying ${primaryEdu.program} at ${primaryEdu.institution} (${primaryEdu.period}), located in ${primaryEdu.location}.`
          : `${profName} saat ini menempuh studi ${details}, berlokasi di ${primaryEdu.location}.`,
        action: "success",
        link: "#tentang",
        linkLabel: isEn ? "View Academic Journey" : "Lihat Riwayat Pendidikan",
        quickReplies: isEn ? ["Featured Projects", "Tech Stack", "Contact"] : ["Proyek Pilihan", "Keahlian", "Kontak"],
      };
    }

    return {
      reply: isEn
        ? `${profName} is an Informatics Engineering undergraduate student at Universitas Trunojoyo Madura.`
        : `${profName} adalah mahasiswa S1 Teknik Informatika di Universitas Trunojoyo Madura (HIMATIF UTM).`,
      action: "success",
      link: "#tentang",
      linkLabel: isEn ? "View About Section" : "Lihat Bagian Tentang",
      quickReplies: isEn ? ["Projects", "CV ATS", "Contact"] : ["Proyek", "CV ATS", "Kontak"],
    };
  }

  // 3. Who is Zekk / About
  if (
    /siapa|tentang|about|who is|biodata|profil|profile|latar belakang|asal|lokasi/i.test(
      query
    )
  ) {
    return {
      reply: isEn
        ? `${profName} is based in ${profLocation}, working as a ${profRoles}. He focuses on human-centered UI/UX systems and robust Next.js frontend web applications.`
        : `${profName} berdomisili di ${profLocation}, berfokus sebagai ${profRoles}. Ia merancang antarmuka terstruktur di Figma dan merekayasa web modern dengan Next.js & TypeScript.`,
      action: "success",
      link: "#tentang",
      linkLabel: isEn ? "Read Full Bio" : "Buka Bagian Tentang",
      quickReplies: isEn ? ["Tech Stack", "Featured Projects", "Get in Touch"] : ["Tech Stack", "Proyek Unggulan", "Hubungi Zekk"],
    };
  }

  // 4. Projects / Specific Project Categories (Frontend, IT, UI/UX)
  if (/proyek|project|karya|portfolio|portofolio|bikin apa|hasil|showcase|aplikasi|frontend project|it project|design project/i.test(query)) {
    const isFrontendFilter = /frontend|web|react|next/i.test(query);
    const isDesignFilter = /design|ui|ux|desain/i.test(query);

    let matching = pubProjects;
    if (isFrontendFilter) {
      matching = pubProjects.filter((p) => p.category === "it" || p.category === "both");
    } else if (isDesignFilter) {
      matching = pubProjects.filter((p) => p.category === "design" || p.category === "both");
    }

    const count = matching.length;
    const names = matching.slice(0, 3).map((p) => p.title).join(", ");

    if (count > 0) {
      return {
        reply: isEn
          ? `Currently there are ${count} published ${isFrontendFilter ? "Frontend/IT " : isDesignFilter ? "UI/UX " : ""}project(s), including: ${names}. All built with clean architecture and interactive polish.`
          : `Saat ini terdapat ${count} proyek ${isFrontendFilter ? "Frontend/IT " : isDesignFilter ? "Desain UI/UX " : ""}yang terpublikasi, meliputi: ${names}. Seluruh karya dikembangkan dengan arsitektur bersih dan responsif.`,
        action: "success",
        link: "#proyek",
        linkLabel: isEn ? "Explore Projects" : "Lihat Grid Proyek",
        quickReplies: isEn ? ["Tech Stack", "Download CV", "Contact"] : ["Tech Stack", "Download CV", "Kontak"],
      };
    }

    return {
      reply: isEn
        ? `No projects found in this filter right now. You can check the complete code repositories on GitHub (@ZekkCode)!`
        : `Belum ada proyek yang ditampilkan pada filter ini. Kamu juga dapat langsung mengeksplorasi kode di GitHub ZekkCode!`,
      action: "success",
      link: "https://github.com/ZekkCode",
      linkLabel: isEn ? "View GitHub Repos" : "Buka GitHub ZekkCode",
      quickReplies: isEn ? ["Tech Stack", "Download CV", "Contact"] : ["Tech Stack", "Download CV", "Kontak"],
    };
  }

  // 5. Skills / Tech Stack
  if (/skill|keahlian|stack|teknologi|tools|bahasa|figma|next|react|typescript|tailwind|flutter/i.test(query)) {
    const tools = pubTechStack.length > 0
      ? pubTechStack.slice(0, 8).map((s) => s.name).join(", ")
      : "Figma, Next.js, React, TypeScript, Tailwind CSS, Flutter, MySQL, GitHub";

    return {
      reply: isEn
        ? `${profName} specializes in UI/UX research & design in Figma, and engineering production web applications using ${tools}.`
        : `Keahlian utama ${profName} mencakup perancangan antarmuka & Design System di Figma, serta rekayasa frontend menggunakan ${tools}.`,
      action: "success",
      link: "#stack",
      linkLabel: isEn ? "View Tech Stack" : "Lihat Tech Stack Lengkap",
      quickReplies: isEn ? ["Certifications", "Projects", "Services"] : ["Sertifikat", "Proyek", "Layanan"],
    };
  }

  // 6. CV / Resume / Ats
  if (/cv|resume|berkas|ats|riwayat|download cv|unduh cv|pdf/i.test(query)) {
    return {
      reply: isEn
        ? `You can inspect ${profName}'s authentic ATS-friendly CV on this page, complete with an interactive 3D WebGL paper simulation and instant PDF download!`
        : `Kamu bisa melihat berkas CV ATS otentik ${profName} di bagian Berkas Karir, lengkap dengan simulasi interaktif lembaran 3D dan tombol unduh PDF resmi!`,
      action: "success",
      link: "#cv",
      linkLabel: isEn ? "Open CV Folder" : "Buka Folder Berkas CV",
      quickReplies: isEn ? ["Contact Zekk", "Experience", "Skills"] : ["Kontak Zekk", "Pengalaman", "Keahlian"],
    };
  }

  // 7. Certifications / Berapa sertifikat
  if (/sertifikat|sertifikasi|certificate|credential|binar|dicoding|bnsp|berapa sertifikat/i.test(query)) {
    const certsCount = pubCerts.length;

    return {
      reply: isEn
        ? `${profName} currently holds ${certsCount} verified credentials with authentic evidence, including Binar Academy UI/UX Research & Design, Dicoding Frontend Web, and BNSP certifications.`
        : `${profName} memiliki ${certsCount} sertifikat terverifikasi resmi dengan bukti kredensial otentik, antara lain Binar Academy UI/UX Research & Design, Dicoding Indonesia Frontend Web, dan sertifikasi BNSP.`,
      action: "success",
      link: "#certificates",
      linkLabel: isEn ? "View Certificates" : "Lihat Daftar Sertifikat",
      quickReplies: isEn ? ["Projects", "Download CV", "Contact"] : ["Proyek", "Unduh CV", "Kontak"],
    };
  }

  // 8. Contact / Hire / Bagaimana menghubungi Zekk
  if (/kontak|contact|email|hubungi|bagaimana menghubungi|hire|kerja sama|freelance|whatsapp|wa|pesan|jasa/i.test(query)) {
    return {
      reply: isEn
        ? `You can reach out directly via email at ${profEmail} or via GitHub (@ZekkCode). He is open for UI/UX design and frontend web engineering collaborations!`
        : `Kamu bisa menghubungi Zekk langsung via email di ${profEmail} atau melalui GitHub (@ZekkCode). Zekk terbuka untuk kerja sama desain UI/UX maupun rekayasa web frontend!`,
      action: "success",
      link: "#kontak",
      linkLabel: isEn ? "Go to Contact Form" : "Menuju Form Kontak",
      quickReplies: isEn ? ["Send Email", "View CV", "Back to Top"] : ["Kirim Email", "Buka CV", "Kembali ke Atas"],
    };
  }

  // 9. Career & Organization Experience
  if (/pengalaman|karier|career|organisasi|himatif|gdgoc|kerja|experience|riwayat kerja/i.test(query)) {
    const pubExp = (config?.experience || []).filter((e) => e.published !== false);
    const expList = pubExp.slice(0, 3).map((e) => `${e.role} (${e.org})`).join(", ");
    return {
      reply: isEn
        ? `${profName} has served in several leadership and technical roles including: ${expList || "Head of Media Creative at HIMATIF UTM and Core Team at GDGoC UTM"}.`
        : `${profName} memiliki rekam jejak peran dan organisasi: ${expList || "Kepala Divisi Media Creative di HIMATIF UTM dan Core Team di GDGoC UTM"}. Seluruh pengalaman tercatat rapi di linimasa portofolio.`,
      action: "success",
      link: "#tentang",
      linkLabel: isEn ? "View Career Timeline" : "Lihat Linimasa Karier",
      quickReplies: isEn ? ["Education", "Projects", "Download CV"] : ["Pendidikan", "Proyek", "Unduh CV"],
    };
  }

  // 9. Services / Layanan
  if (/layanan|services|bisa bantu apa|service|jasa apa/i.test(query)) {
    return {
      reply: isEn
        ? "Zekk provides 4 core pillars of services: UI/UX & Design Systems, Frontend Web Development, Creative Media & Digital Graphics, and IT Support & Systems."
        : "Zekk menyediakan 4 pilar layanan: UI/UX & Desain Sistem, Frontend Web Development, Identitas Visual & Grafis Kreatif, dan Dukungan IT & Sistem Linux.",
      action: "success",
      link: "#services",
      linkLabel: isEn ? "View Services" : "Lihat 4 Pilar Layanan",
      quickReplies: isEn ? ["Tech Stack", "Projects", "Hire Zekk"] : ["Tech Stack", "Proyek", "Kerja Sama"],
    };
  }

  // 10. Default / Fallback
  return {
    reply: isEn
      ? `I can guide you through ${profName}'s published projects, education at UTM, tech stack, verified certificates, CV ATS, and contact info. Which one would you like to explore?`
      : `Aku bisa bantu jelaskan proyek terpublikasi, riwayat kuliah di UTM, tech stack, sertifikat terverifikasi, CV ATS, dan kontak ${profName}. Mau tahu yang mana dulu?`,
    action: "idle",
    quickReplies: isEn
      ? ["Who is Zekk?", "Show Projects", "Where did you study?", "Get in Touch"]
      : ["Siapa Zekk?", "Lihat Proyek", "Kuliah di mana?", "Kontak Zekk"],
  };
}
