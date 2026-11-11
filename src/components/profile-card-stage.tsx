"use client";

import ProfileCard from "@/components/profile-card";
import { useSiteConfig } from "@/lib/site-store";
import { profile } from "@/lib/profile";

export function ProfileCardStage() {
  const { profileCard: pc, generalProfile } = useSiteConfig();

  return (
    <div className="flex items-center justify-center">
      <ProfileCard
        {...pc}
        name={pc.name || generalProfile?.name || profile.name}
        title={pc.title || generalProfile?.roles || profile.roles}
        avatarUrl={pc.avatarUrl || generalProfile?.avatarUrl || undefined}
        iconUrl={pc.iconUrl || undefined}
        miniAvatarUrl={pc.miniAvatarUrl || undefined}
        imageFit={pc.imageFit || "contain"}
        backdropColor={pc.backdropColor || undefined}
        onContactClick={() => {
          window.location.href = `mailto:${generalProfile?.email || profile.contact.email}`;
        }}
      />
    </div>
  );
}
