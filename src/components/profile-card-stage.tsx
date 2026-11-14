"use client";

import ProfileCard from "@/components/profile-card";
import { useSiteConfig } from "@/lib/site-store";
import { profile } from "@/lib/profile";

export function ProfileCardStage() {
  const { profileCard: pc, generalProfile, lanyard } = useSiteConfig();
  const resolvedAvatar = pc.avatarUrl || generalProfile?.avatarUrl || "/card-front-v2.webp";
  const frontCardUrl = lanyard.frontImage || "/card-front-v2.webp";
  const backCardUrl = lanyard.backImage || "/card-back-v2.webp";
  const secondaryAvatar =
    (resolvedAvatar === "/card-front-v2.webp" || resolvedAvatar === frontCardUrl) &&
    resolvedAvatar !== backCardUrl
      ? backCardUrl
      : undefined;

  return (
    <div className="flex w-full min-w-0 items-center justify-center">
      <ProfileCard
        {...pc}
        name={pc.name || generalProfile?.name || profile.name}
        title={pc.title || generalProfile?.roles || profile.roles}
        avatarUrl={resolvedAvatar}
        secondaryAvatarUrl={secondaryAvatar}
        iconUrl={pc.iconUrl || undefined}
        miniAvatarUrl={pc.miniAvatarUrl || resolvedAvatar}
        imageFit={pc.imageFit || "cover"}
        backdropColor={pc.backdropColor || undefined}
        onContactClick={() => {
          window.location.href = `mailto:${generalProfile?.email || profile.contact.email}`;
        }}
      />
    </div>
  );
}
