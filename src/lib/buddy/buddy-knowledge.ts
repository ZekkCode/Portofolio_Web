import { profile } from "@/lib/profile";

export interface KnowledgeMatch {
  reply: string;
  action?: "greeting" | "success" | "thinking" | "idle";
  quickReplies?: string[];
  link?: string;
  linkLabel?: string;
}

export function queryBuddyKnowledge(rawMessage: string, langHint: "id" | "en" = "id"): KnowledgeMatch {
  const query = rawMessage.trim().toLowerCase();

  // English detection
  const isEn =
    langHint === "en" ||
    /\b(who|what|where|how|can|show|tell|project|skills|resume|cv|contact|email|hire|work|about)\b/i.test(query);

  // 1. Greetings
  if (/^(halo|hai|hey|hi|hello|pagi|siang|sore|malam|assalamualaikum|tes|test|ping)/.test(query)) {
    return {
      reply: isEn
        ? "Hi there! I'm Miss Minute, Zekk's companion. What would you like to know about his projects, skills, or CV?"
        : "Hai! Aku Miss Minute, buddy-nya Zekk. Mau lihat proyek unggulan, keahlian, atau tanya sesuatu tentang Zekk?",
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
        ? `${profile.name} (Zekk) is an Informatics Engineering student at UTM and a ${profile.roles}. He has been crafting clean UI/UX designs and high-performance Next.js web applications since ${profile.since}.`
        : `${profile.name} (Zekk) adalah mahasiswa Teknik Informatika UTM sekaligus ${profile.roles}. Sejak ${profile.since}, ia fokus mendesain sistem antarmuka di Figma dan membangun web modern berbasis Next.js & TypeScript.`,
      action: "success",
      link: "#tentang",
      linkLabel: isEn ? "Read Full Bio" : "Buka Bagian Tentang",
      quickReplies: isEn ? ["Tech Stack", "Featured Projects", "Get in Touch"] : ["Tech Stack", "Proyek Unggulan", "Hubungi Zekk"],
    };
  }

  // 3. Projects / Portfolio
  if (/proyek|project|karya|portfolio|portofolio|bikin apa|hasil|showcase|aplikasi|sigap/i.test(query)) {
    const list = profile.projects.slice(0, 3).map((p) => p.title).join(", ");
    return {
      reply: isEn
        ? `Here are some of Zekk's flagship projects: ${list}. Each combines interactive Figma prototyping with robust frontend engineering.`
        : `Beberapa proyek unggulan Zekk meliputi: ${list}. Seluruh proyek dikerjakan dengan standar antarmuka Figma dan Next.js yang bersih.`,
      action: "success",
      link: "#proyek",
      linkLabel: isEn ? "Explore Projects" : "Lihat Grid Proyek",
      quickReplies: isEn ? ["SIGAP-Pangan", "Tech Stack", "Download CV"] : ["SIGAP-Pangan", "Tech Stack", "Download CV"],
    };
  }

  // 4. Skills / Tech Stack
  if (/skill|keahlian|stack|teknologi|tools|bahasa|figma|next|react|typescript|tailwind/i.test(query)) {
    const tools = profile.stack.slice(0, 7).map((s) => s.name).join(", ");
    return {
      reply: isEn
        ? `Zekk specializes in UI/UX research & design in Figma, and engineering web apps with ${tools}, Three.js WebGL physics, and Tailwind CSS v4.`
        : `Keahlian utama Zekk mencakup perancangan UI/UX & Design System di Figma, serta rekayasa frontend menggunakan ${tools}, WebGL Three.js, dan Tailwind CSS v4.`,
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
        ? "You can inspect Zekk's authentic 2025 ATS-friendly CV on this page, complete with an interactive 3D WebGL paper simulation and instant PDF download!"
        : "Kamu bisa melihat berkas CV ATS otentik 2025 Zekk di bagian Berkas Karir, lengkap dengan simulasi interaktif lembaran 3D dan tombol unduh PDF resmi!",
      action: "success",
      link: "#cv",
      linkLabel: isEn ? "Open CV Folder" : "Buka Folder Berkas CV",
      quickReplies: isEn ? ["Contact Zekk", "Experience", "Skills"] : ["Kontak Zekk", "Pengalaman", "Keahlian"],
    };
  }

  // 6. Certifications
  if (/sertifikat|sertifikasi|certificate|credential|binar|dicoding|bnsp/i.test(query)) {
    return {
      reply: isEn
        ? "Zekk holds 29 verified credentials including Binar Academy UI/UX Research & Design, Dicoding Frontend Web, and national BNSP certifications."
        : "Zekk memiliki 29 sertifikat terverifikasi, antara lain Binar Academy UI/UX Research & Design, Dicoding Indonesia Frontend Web, dan sertifikasi BNSP.",
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
        ? `You can reach out directly via email at ${profile.contact.email} or through GitHub (@ZekkCode). He is open for UI/UX and Frontend collaborations!`
        : `Kamu bisa menghubungi Zekk langsung via email di ${profile.contact.email} atau melalui GitHub (@ZekkCode). Zekk terbuka untuk proyek UI/UX maupun Web Frontend!`,
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
        ? "Zekk provides 4 core services: UI/UX & Design Systems, Frontend Web Development, Visual Identity & Digital Graphics, and IT Support & Systems."
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
      ? "I can guide you through Zekk's projects, tech stack, experience, CV ATS, and contact info. Which one would you like to explore?"
      : "Aku bisa bantu jelaskan proyek unggulan, tech stack, riwayat pengalaman, CV ATS, dan kontak Zekk. Mau tahu yang mana dulu?",
    action: "idle",
    quickReplies: isEn
      ? ["Who is Zekk?", "Show Projects", "View CV", "Get in Touch"]
      : ["Siapa Zekk?", "Lihat Proyek", "Buka CV", "Kontak Zekk"],
  };
}
