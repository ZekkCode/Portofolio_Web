import { profile } from "@/lib/profile";
import type { SiteConfig } from "@/lib/site-config";

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
    /\b(who|what|where|how|can|show|tell|project|skills|resume|cv|contact|email|hire|work|about)\b/i.test(query);

  const profName = config?.generalProfile?.name || profile.name;
  const profRoles = isEn
    ? config?.generalProfile?.rolesEn || profile.roles
    : config?.generalProfile?.roles || profile.roles;
  const profEmail = config?.generalProfile?.email || profile.contact.email;

  // Dynamic published projects
  const publishedProjects = (config?.projects || []).filter((p) => p.published !== false);
  const publishedCerts = (config?.certificates || []).filter((c) => c.published !== false);
  const activeTools = (config?.techStack || []).filter((t) => t.visible !== false);

  // 1. Greetings
  if (/^(halo|hai|hey|hi|hello|pagi|siang|sore|malam|assalamualaikum|tes|test|ping)/.test(query)) {
    return {
      reply: isEn
        ? `Hi there! I'm Miss Minute, ${config?.generalProfile?.nickname || "Zekk"}'s companion. What would you like to know about his projects, skills, or CV?`
        : `Halo! Mau aku antar ke seksi proyek, intip tech stack, atau buka berkas CV ATS ${config?.generalProfile?.nickname || "Zekk"}?`,
      action: "greeting",
      quickReplies: isEn
        ? ["Who is Zekk?", "View Projects", "Tech Stack", "Download CV"]
        : ["Siapa Zekk?", "Lihat Proyek", "Keahlian", "Download CV"],
    };
  }

  // 2. Who is Zekk / About
  if (
    /siapa|tentang|about|who is|biodata|profil|profile|latar belakang|kuliah|pendidikan|universitas|mahasiswa/i.test(
      query
    )
  ) {
    return {
      reply: isEn
        ? `${profName} is an Informatics student and a ${profRoles}. He crafts clean UI/UX designs in Figma and engineers modern Next.js & TypeScript web applications.`
        : `${profName} adalah mahasiswa Teknik Informatika sekaligus ${profRoles}. Ia fokus mendesain sistem antarmuka di Figma dan membangun web modern berbasis Next.js & TypeScript.`,
      action: "success",
      link: "#tentang",
      linkLabel: isEn ? "Read Full Bio" : "Buka Bagian Tentang",
      quickReplies: isEn ? ["Tech Stack", "Featured Projects", "Get in Touch"] : ["Tech Stack", "Proyek Unggulan", "Hubungi Zekk"],
    };
  }

  // 3. Projects / Portfolio
  if (/proyek|project|karya|portfolio|portofolio|bikin apa|hasil|showcase|aplikasi|sigap/i.test(query)) {
    const projectList = publishedProjects.length > 0
      ? publishedProjects.slice(0, 3).map((p) => (isEn && p.titleEn ? p.titleEn : p.title)).join(", ")
      : "";

    if (projectList) {
      return {
        reply: isEn
          ? `Here are some of ${profName}'s featured projects: ${projectList}. Each combines interactive prototyping with robust frontend engineering.`
          : `Beberapa proyek unggulan ${profName} meliputi: ${projectList}. Seluruh proyek dikerjakan dengan standar antarmuka Figma dan Next.js yang bersih.`,
        action: "success",
        link: "#proyek",
        linkLabel: isEn ? "Explore Projects" : "Lihat Grid Proyek",
        quickReplies: isEn ? ["Tech Stack", "Download CV", "Contact"] : ["Tech Stack", "Download CV", "Kontak"],
      };
    }

    return {
      reply: isEn
        ? `${profName}'s curated portfolio projects are being updated in the showcase. You can explore his code repositories on GitHub directly!`
        : `Koleksi proyek pilihan ${profName} sedang dikurasi di katalog publik. Kamu juga bisa langsung mengeksplorasi repositori kode di GitHub ZekkCode!`,
      action: "success",
      link: "https://github.com/ZekkCode",
      linkLabel: isEn ? "View GitHub Repos" : "Buka GitHub ZekkCode",
      quickReplies: isEn ? ["Tech Stack", "Download CV", "Contact"] : ["Tech Stack", "Download CV", "Kontak"],
    };
  }

  // 4. Skills / Tech Stack
  if (/skill|keahlian|stack|teknologi|tools|bahasa|figma|next|react|typescript|tailwind|flutter/i.test(query)) {
    const tools = activeTools.length > 0
      ? activeTools.slice(0, 8).map((s) => s.name).join(", ")
      : "Figma, Next.js, React, TypeScript, Tailwind CSS, Flutter, MySQL, GitHub";

    return {
      reply: isEn
        ? `${profName} specializes in UI/UX research & design in Figma, and engineering web applications with ${tools}.`
        : `Keahlian utama ${profName} mencakup perancangan UI/UX & Design System di Figma, serta rekayasa frontend menggunakan ${tools}.`,
      action: "success",
      link: "#stack",
      linkLabel: isEn ? "View Tech Stack" : "Lihat Tech Stack Lengkap",
      quickReplies: isEn ? ["Certifications", "Projects", "Services"] : ["Sertifikat", "Proyek", "Layanan"],
    };
  }

  // 5. CV / Resume / Ats
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

  // 6. Certifications
  if (/sertifikat|sertifikasi|certificate|credential|binar|dicoding|bnsp/i.test(query)) {
    const certsCount = publishedCerts.length > 0
      ? publishedCerts.length
      : 8;

    return {
      reply: isEn
        ? `${profName} holds ${certsCount} verified credentials including Binar Academy UI/UX Research & Design, Dicoding Frontend Web, and national BNSP certifications.`
        : `${profName} memiliki ${certsCount} sertifikat terverifikasi, antara lain Binar Academy UI/UX Research & Design, Dicoding Indonesia Frontend Web, dan sertifikasi BNSP.`,
      action: "success",
      link: "#certificates",
      linkLabel: isEn ? "View Certificates" : "Lihat Daftar Sertifikat",
      quickReplies: isEn ? ["Projects", "Download CV", "Contact"] : ["Proyek", "Unduh CV", "Kontak"],
    };
  }

  // 7. Contact / Hire / Email
  if (/kontak|contact|email|hubungi|hire|kerja sama|freelance|whatsapp|wa|pesan|jasa/i.test(query)) {
    return {
      reply: isEn
        ? `You can reach out directly via email at ${profEmail} or through GitHub (@ZekkCode). He is open for UI/UX and Frontend collaborations!`
        : `Kamu bisa menghubungi Zekk langsung via email di ${profEmail} atau melalui GitHub (@ZekkCode). Zekk terbuka untuk proyek UI/UX maupun Web Frontend!`,
      action: "success",
      link: "#kontak",
      linkLabel: isEn ? "Go to Contact Form" : "Menuju Form Kontak",
      quickReplies: isEn ? ["Send Email", "View CV", "Back to Top"] : ["Kirim Email", "Buka CV", "Kembali ke Atas"],
    };
  }

  // 8. Services / Layanan
  if (/layanan|services|bisa bantu apa|service|jasa apa/i.test(query)) {
    return {
      reply: isEn
        ? "Zekk provides core services in UI/UX & Design Systems, Frontend Web Development, Visual Identity & Digital Graphics, and IT Support & Systems."
        : "Zekk menyediakan 4 pilar layanan: UI/UX & Desain Sistem, Frontend Web Development, Identitas Visual & Grafis, dan Dukungan IT & Sistem Linux.",
      action: "success",
      link: "#services",
      linkLabel: isEn ? "View Services" : "Lihat 4 Pilar Layanan",
      quickReplies: isEn ? ["Tech Stack", "Projects", "Hire Zekk"] : ["Tech Stack", "Proyek", "Kerja Sama"],
    };
  }

  // 9. Default / Fallback
  return {
    reply: isEn
      ? `I can guide you through ${profName}'s projects, tech stack, experience, CV ATS, and contact info. Which one would you like to explore?`
      : `Aku bisa bantu jelaskan proyek unggulan, tech stack, riwayat pengalaman, CV ATS, dan kontak ${profName}. Mau tahu yang mana dulu?`,
    action: "idle",
    quickReplies: isEn
      ? ["Who is Zekk?", "Show Projects", "View CV", "Get in Touch"]
      : ["Siapa Zekk?", "Lihat Proyek", "Buka CV", "Kontak Zekk"],
  };
}
