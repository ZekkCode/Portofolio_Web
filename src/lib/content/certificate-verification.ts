export type CertificateVerificationStatus =
  | "unverified"
  | "verified"
  | "needs_reverification";

export interface CertificateEvidenceShape {
  credentialUrl?: string;
  credentialPdf?: string;
  image?: string;
  credentialId?: string;
  verificationStatus?: CertificateVerificationStatus | string;
  verifiedAt?: string;
  verifiedEvidenceHash?: string;
}

export const LEGACY_CERT_SECTION_DESC_ID =
  "Sertifikasi kompetensi profesional terverifikasi.";
export const LEGACY_CERT_SECTION_DESC_EN =
  "Verified professional certifications and credentials.";

function isUsableEvidenceUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text/html") ||
    lower.startsWith("data:application/") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:")
  ) {
    return false;
  }
  return true;
}

/**
 * Mengecek apakah sertifikat memiliki minimal satu artefak bukti yang dapat diperiksa
 * (URL kredensial, dokumen PDF, atau gambar sertifikat).
 */
export function hasCertificateEvidence(cert?: CertificateEvidenceShape | null): boolean {
  if (!cert || typeof cert !== "object") return false;
  return (
    isUsableEvidenceUrl(cert.credentialUrl) ||
    isUsableEvidenceUrl(cert.credentialPdf) ||
    isUsableEvidenceUrl(cert.image)
  );
}

/**
 * Menghasilkan sidik ringkas deterministik untuk seluruh field bukti & identitas kredensial
 * sehingga perubahan bukti terdeteksi di UI maupun server tanpa menyalin data URI penuh.
 */
export function computeCertificateEvidenceHash(cert?: CertificateEvidenceShape | null): string {
  const payload = JSON.stringify([
    (cert?.credentialUrl || "").trim(),
    (cert?.credentialPdf || "").trim(),
    (cert?.image || "").trim(),
    (cert?.credentialId || "").trim(),
  ]);

  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = ((h2 << 5) + h2 + ch) >>> 0;
  }

  return `v1:${payload.length}:${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

/**
 * Menentukan status verifikasi efektif sertifikat secara ketat:
 * - Data lama tanpa field verificationStatus selalu dianggap 'unverified'.
 * - Keberadaan URL/PDF/gambar tidak otomatis menjadikan sertifikat terverifikasi.
 * - Status 'verified' tanpa bukti valid atau dengan hash bukti kedaluwarsa ditolak.
 */
export function resolveCertificateVerificationStatus(
  cert?: CertificateEvidenceShape | null
): CertificateVerificationStatus {
  if (!cert || typeof cert !== "object") return "unverified";

  const evidencePresent = hasCertificateEvidence(cert);
  const rawStatus = cert.verificationStatus;

  if (rawStatus === "verified") {
    if (!evidencePresent) {
      return "unverified";
    }
    if (
      typeof cert.verifiedEvidenceHash === "string" &&
      cert.verifiedEvidenceHash.trim() !== "" &&
      cert.verifiedEvidenceHash !== computeCertificateEvidenceHash(cert)
    ) {
      return "needs_reverification";
    }
    return "verified";
  }

  if (rawStatus === "needs_reverification") {
    return evidencePresent ? "needs_reverification" : "unverified";
  }

  return "unverified";
}

export function isCertificateVerified(cert?: CertificateEvidenceShape | null): boolean {
  return resolveCertificateVerificationStatus(cert) === "verified";
}

export function hasCertificateEvidenceMismatch(
  cert?: CertificateEvidenceShape | null
): boolean {
  if (!cert || cert.verificationStatus !== "verified") return false;
  if (!hasCertificateEvidence(cert)) return true;
  if (
    typeof cert.verifiedEvidenceHash === "string" &&
    cert.verifiedEvidenceHash.trim() !== "" &&
    cert.verifiedEvidenceHash !== computeCertificateEvidenceHash(cert)
  ) {
    return true;
  }
  return false;
}

export type CertificateTransitionKind =
  | "unchanged"
  | "verified"
  | "unverified"
  | "invalidated_removed"
  | "invalidated_changed"
  | "blocked_no_evidence";

/**
 * Menerapkan pembaruan sertifikat dan memastikan perubahan atau penghapusan bukti
 * otomatis membatalkan status terverifikasi lama serta meminta pemeriksaan ulang.
 */
export function applyCertificateUpdate<T extends CertificateEvidenceShape>(
  prev: T,
  updates: Partial<T>,
  nowIso: string = new Date().toISOString()
): { next: T; transition: CertificateTransitionKind } {
  const evidenceKeysChanged =
    ("credentialUrl" in updates &&
      (updates.credentialUrl || "").trim() !== (prev.credentialUrl || "").trim()) ||
    ("credentialPdf" in updates &&
      (updates.credentialPdf || "").trim() !== (prev.credentialPdf || "").trim()) ||
    ("image" in updates && (updates.image || "").trim() !== (prev.image || "").trim()) ||
    ("credentialId" in updates &&
      (updates.credentialId || "").trim() !== (prev.credentialId || "").trim());

  const merged: T = { ...prev, ...updates };
  const prevEffective = resolveCertificateVerificationStatus(prev);
  const evidencePresent = hasCertificateEvidence(merged);

  if (evidenceKeysChanged && (prevEffective === "verified" || prevEffective === "needs_reverification")) {
    if (!evidencePresent) {
      return {
        next: {
          ...merged,
          verificationStatus: "unverified",
          verifiedAt: undefined,
          verifiedEvidenceHash: undefined,
        },
        transition: prevEffective === "verified" ? "invalidated_removed" : "unverified",
      };
    }
    if (prevEffective === "verified") {
      return {
        next: {
          ...merged,
          verificationStatus: "needs_reverification",
          verifiedAt: undefined,
          verifiedEvidenceHash: undefined,
        },
        transition: "invalidated_changed",
      };
    }
  }

  if ("verificationStatus" in updates) {
    if (updates.verificationStatus === "verified") {
      if (!evidencePresent) {
        return {
          next: {
            ...merged,
            verificationStatus: "unverified",
            verifiedAt: undefined,
            verifiedEvidenceHash: undefined,
          },
          transition: "blocked_no_evidence",
        };
      }
      return {
        next: {
          ...merged,
          verificationStatus: "verified",
          verifiedAt:
            typeof merged.verifiedAt === "string" && merged.verifiedAt.trim()
              ? merged.verifiedAt
              : nowIso,
          verifiedEvidenceHash: computeCertificateEvidenceHash(merged),
        },
        transition: "verified",
      };
    }

    const targetStatus: CertificateVerificationStatus =
      updates.verificationStatus === "needs_reverification" && evidencePresent
        ? "needs_reverification"
        : "unverified";
    return {
      next: {
        ...merged,
        verificationStatus: targetStatus,
        verifiedAt: undefined,
        verifiedEvidenceHash: undefined,
      },
      transition: "unverified",
    };
  }

  // Jaga agar status terverifikasi tanpa bukti tidak pernah bertahan
  if (merged.verificationStatus === "verified" && !evidencePresent) {
    return {
      next: {
        ...merged,
        verificationStatus: "unverified",
        verifiedAt: undefined,
        verifiedEvidenceHash: undefined,
      },
      transition: "invalidated_removed",
    };
  }

  return { next: merged, transition: "unchanged" };
}

/**
 * Normalisasi status verifikasi untuk lapisan persistensi / pembacaan config.
 */
export function normalizeCertificateVerification<T extends CertificateEvidenceShape>(
  cert: T,
  fallbackVerifiedAt?: string
): T {
  const resolved = resolveCertificateVerificationStatus(cert);
  if (resolved === "verified") {
    return {
      ...cert,
      verificationStatus: "verified",
      verifiedAt:
        typeof cert.verifiedAt === "string" && cert.verifiedAt.trim()
          ? cert.verifiedAt.trim()
          : fallbackVerifiedAt,
      verifiedEvidenceHash:
        typeof cert.verifiedEvidenceHash === "string" && cert.verifiedEvidenceHash.trim()
          ? cert.verifiedEvidenceHash.trim()
          : computeCertificateEvidenceHash(cert),
    };
  }

  return {
    ...cert,
    verificationStatus: resolved,
    verifiedAt: undefined,
    verifiedEvidenceHash: undefined,
  };
}

/**
 * Mencegah klaim lama "kompetensi profesional terverifikasi" tampil jika belum seluruh
 * sertifikat terpublikasi memiliki pemeriksaan bukti yang terverifikasi.
 */
export function resolveCertificatesSectionDesc(
  rawDesc: string | undefined,
  certificates: CertificateEvidenceShape[],
  neutralFallback: string
): string {
  const trimmed = (rawDesc || "").trim();
  if (!trimmed) return neutralFallback;

  const isLegacyVerifiedClaim =
    trimmed === LEGACY_CERT_SECTION_DESC_ID ||
    trimmed === LEGACY_CERT_SECTION_DESC_EN;

  if (!isLegacyVerifiedClaim) {
    return trimmed;
  }

  const allVerified =
    certificates.length > 0 && certificates.every((c) => isCertificateVerified(c));
  return allVerified ? trimmed : neutralFallback;
}
