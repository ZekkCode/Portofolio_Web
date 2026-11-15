import type { AboutPersonaConfig, LanyardConfig, ProfileCardConfig } from "./types";

export const DEFAULT_PORTRAIT_AVATAR_URL = "/profile.webp";
export const DEFAULT_FRONTEND_CARD_URL = "/card-front-v2.webp";
export const DEFAULT_DESIGNER_CARD_URL = "/card-back-v2.webp";
export const LEGACY_MISSING_PORTRAIT_PLACEHOLDER = "/avatar-portrait.webp";

export const PORTRAIT_RECOMMENDED_WIDTH = 600;
export const PORTRAIT_RECOMMENDED_HEIGHT = 750;
export const PORTRAIT_ASPECT_RATIO_LABEL = "4:5";
export const CARD_ASPECT_RATIO_LABEL = "1457:2048 (~5:7)";

const KNOWN_CARD_FILENAMES = new Set([
  "card-front.webp",
  "card-front.svg",
  "card-front-v2.webp",
  "card-back.webp",
  "card-back-v2.webp",
]);

export type IdentityImageConfigSlice = {
  generalProfile?: {
    avatarUrl?: string;
    aboutPersona?: Partial<AboutPersonaConfig>;
  };
  profileCard?: Partial<ProfileCardConfig>;
  lanyard?: Partial<LanyardConfig>;
};

export type PortraitResolution = {
  url: string;
  rawUrl: string;
  source:
    | "generalProfile.avatarUrl"
    | "profileCard.avatarUrl"
    | "profileCard.miniAvatarUrl"
    | "hologram-portrait"
    | "fallback-portrait";
  isFallback: boolean;
  rejectedCardUrl?: string;
  rejectedMissingUrl?: string;
  isRepoLowResPortrait: boolean;
};

export type LanyardImageResolution = {
  frontImage: string;
  backImage: string;
  strapImage: string;
  frontSource: "lanyard.frontImage" | "default-frontend-card";
  backSource: "lanyard.backImage" | "default-designer-card";
};

export type AboutPersonaImageResolution = {
  frontImage: string;
  backImage: string;
  frontSource:
    | "generalProfile.aboutPersona.frontImage"
    | "lanyard.frontImage"
    | "default-frontend-card";
  backSource:
    | "generalProfile.aboutPersona.backImage"
    | "lanyard.backImage"
    | "default-designer-card";
};

export type IdentityImageSourceMap = {
  globalPortrait: PortraitResolution;
  hologramAvatar: PortraitResolution;
  hologramMiniAvatar: PortraitResolution;
  hologramImageFit: "cover" | "contain";
  frontendCard: string;
  graphicDesignerCard: string;
  aboutPersona: AboutPersonaImageResolution;
  lanyard: LanyardImageResolution;
};

function normalizePathname(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).pathname.toLowerCase();
    }
  } catch {
    // Keep manual normalization below for relative paths or malformed URLs.
  }
  return trimmed.split(/[?#]/)[0].trim().toLowerCase();
}

export function isKnownCardAssetUrl(url?: string): boolean {
  const pathname = normalizePathname(url);
  if (!pathname) return false;
  const filename = pathname.split("/").pop() || "";
  if (KNOWN_CARD_FILENAMES.has(filename)) return true;
  return /^(card-front|card-back)(?:-v\d+)?\.(webp|png|jpe?g|svg)$/i.test(filename);
}

export function isMissingPortraitAliasUrl(url?: string): boolean {
  return normalizePathname(url) === LEGACY_MISSING_PORTRAIT_PLACEHOLDER;
}

export function isIdentityCardAssetUrl(
  url?: string,
  config?: IdentityImageConfigSlice
): boolean {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return false;
  if (isKnownCardAssetUrl(trimmed)) return true;
  if (!config) return false;

  const activeCardUrls = [
    config.lanyard?.frontImage,
    config.lanyard?.backImage,
    config.generalProfile?.aboutPersona?.frontImage,
    config.generalProfile?.aboutPersona?.backImage,
  ]
    .map((candidate) => (typeof candidate === "string" ? candidate.trim() : ""))
    .filter(Boolean);

  return activeCardUrls.includes(trimmed);
}

function isUsablePortraitUrl(
  url?: string,
  config?: IdentityImageConfigSlice
): boolean {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return false;
  if (isIdentityCardAssetUrl(trimmed, config)) return false;
  if (isMissingPortraitAliasUrl(trimmed)) return false;
  return true;
}

export function isRepoPlaceholderPortraitUrl(url?: string): boolean {
  return normalizePathname(url) === DEFAULT_PORTRAIT_AVATAR_URL;
}

/**
 * Resolves the global human portrait used across profile metadata and as fallback for avatars.
 * Never resolves to an ID card artwork or non-existent alias path.
 */
export function resolveGlobalPortrait(
  config?: IdentityImageConfigSlice
): PortraitResolution {
  const rawUrl = config?.generalProfile?.avatarUrl?.trim() || "";
  if (isUsablePortraitUrl(rawUrl, config)) {
    return {
      url: rawUrl,
      rawUrl,
      source: "generalProfile.avatarUrl",
      isFallback: false,
      isRepoLowResPortrait: isRepoPlaceholderPortraitUrl(rawUrl),
    };
  }

  return {
    url: DEFAULT_PORTRAIT_AVATAR_URL,
    rawUrl,
    source: "fallback-portrait",
    isFallback: true,
    rejectedCardUrl: isIdentityCardAssetUrl(rawUrl, config) ? rawUrl : undefined,
    rejectedMissingUrl: isMissingPortraitAliasUrl(rawUrl) ? rawUrl : undefined,
    isRepoLowResPortrait: true,
  };
}

/**
 * Resolves the Hologram Profile Card's main human portrait.
 * Priority: profileCard.avatarUrl (non-card) -> generalProfile portrait -> /profile.webp.
 */
export function resolveProfileCardAvatar(
  config?: IdentityImageConfigSlice
): PortraitResolution {
  const rawUrl = config?.profileCard?.avatarUrl?.trim() || "";
  if (isUsablePortraitUrl(rawUrl, config)) {
    return {
      url: rawUrl,
      rawUrl,
      source: "profileCard.avatarUrl",
      isFallback: false,
      isRepoLowResPortrait: isRepoPlaceholderPortraitUrl(rawUrl),
    };
  }

  const globalPortrait = resolveGlobalPortrait(config);
  return {
    url: globalPortrait.url,
    rawUrl,
    source:
      globalPortrait.source === "generalProfile.avatarUrl"
        ? "generalProfile.avatarUrl"
        : "fallback-portrait",
    isFallback: true,
    rejectedCardUrl:
      isIdentityCardAssetUrl(rawUrl, config)
        ? rawUrl
        : globalPortrait.rejectedCardUrl,
    rejectedMissingUrl:
      isMissingPortraitAliasUrl(rawUrl)
        ? rawUrl
        : globalPortrait.rejectedMissingUrl,
    isRepoLowResPortrait: globalPortrait.isRepoLowResPortrait,
  };
}

/**
 * Resolves the small footer avatar inside the Hologram Profile Card.
 * Priority: profileCard.miniAvatarUrl (non-card) -> Hologram main portrait -> /profile.webp.
 */
export function resolveProfileCardMiniAvatar(
  config?: IdentityImageConfigSlice
): PortraitResolution {
  const rawUrl = config?.profileCard?.miniAvatarUrl?.trim() || "";
  if (isUsablePortraitUrl(rawUrl, config)) {
    return {
      url: rawUrl,
      rawUrl,
      source: "profileCard.miniAvatarUrl",
      isFallback: false,
      isRepoLowResPortrait: isRepoPlaceholderPortraitUrl(rawUrl),
    };
  }

  const mainAvatar = resolveProfileCardAvatar(config);
  return {
    url: mainAvatar.url,
    rawUrl,
    source: mainAvatar.isFallback ? mainAvatar.source : "hologram-portrait",
    isFallback: true,
    rejectedCardUrl:
      isIdentityCardAssetUrl(rawUrl, config)
        ? rawUrl
        : mainAvatar.rejectedCardUrl,
    rejectedMissingUrl:
      isMissingPortraitAliasUrl(rawUrl)
        ? rawUrl
        : mainAvatar.rejectedMissingUrl,
    isRepoLowResPortrait: mainAvatar.isRepoLowResPortrait,
  };
}

/**
 * Ensures portrait fallbacks fill their 4:5 container cleanly without legacy "contain" ID-card padding.
 */
export function resolveProfileCardImageFit(
  config?: IdentityImageConfigSlice
): "cover" | "contain" {
  const rawFit = config?.profileCard?.imageFit;
  const rawCardAvatar = config?.profileCard?.avatarUrl?.trim() || "";
  if (isUsablePortraitUrl(rawCardAvatar, config)) {
    return rawFit === "contain" ? "contain" : "cover";
  }
  const rawGlobal = config?.generalProfile?.avatarUrl?.trim() || "";
  if (!rawCardAvatar && isUsablePortraitUrl(rawGlobal, config) && rawFit === "contain") {
    return "contain";
  }
  return "cover";
}

export function resolveLanyardImages(
  config?: IdentityImageConfigSlice
): LanyardImageResolution {
  const rawFront = config?.lanyard?.frontImage?.trim() || "";
  const rawBack = config?.lanyard?.backImage?.trim() || "";
  const strapImage = config?.lanyard?.strapImage?.trim() || "";

  const frontImage = rawFront || DEFAULT_FRONTEND_CARD_URL;
  const backImage = rawBack || DEFAULT_DESIGNER_CARD_URL;

  return {
    frontImage,
    backImage,
    strapImage,
    frontSource: rawFront ? "lanyard.frontImage" : "default-frontend-card",
    backSource: rawBack ? "lanyard.backImage" : "default-designer-card",
  };
}

export function resolveAboutPersonaImages(
  config?: IdentityImageConfigSlice
): AboutPersonaImageResolution {
  const rawAboutFront = config?.generalProfile?.aboutPersona?.frontImage?.trim() || "";
  const rawAboutBack = config?.generalProfile?.aboutPersona?.backImage?.trim() || "";
  const rawLanyardFront = config?.lanyard?.frontImage?.trim() || "";
  const rawLanyardBack = config?.lanyard?.backImage?.trim() || "";

  const frontImage = rawAboutFront || rawLanyardFront || DEFAULT_FRONTEND_CARD_URL;
  const backImage = rawAboutBack || rawLanyardBack || DEFAULT_DESIGNER_CARD_URL;

  return {
    frontImage,
    backImage,
    frontSource: rawAboutFront
      ? "generalProfile.aboutPersona.frontImage"
      : rawLanyardFront
        ? "lanyard.frontImage"
        : "default-frontend-card",
    backSource: rawAboutBack
      ? "generalProfile.aboutPersona.backImage"
      : rawLanyardBack
        ? "lanyard.backImage"
        : "default-designer-card",
  };
}

export function getIdentityImageSourceMap(
  config?: IdentityImageConfigSlice
): IdentityImageSourceMap {
  return {
    globalPortrait: resolveGlobalPortrait(config),
    hologramAvatar: resolveProfileCardAvatar(config),
    hologramMiniAvatar: resolveProfileCardMiniAvatar(config),
    hologramImageFit: resolveProfileCardImageFit(config),
    frontendCard: DEFAULT_FRONTEND_CARD_URL,
    graphicDesignerCard: DEFAULT_DESIGNER_CARD_URL,
    aboutPersona: resolveAboutPersonaImages(config),
    lanyard: resolveLanyardImages(config),
  };
}
