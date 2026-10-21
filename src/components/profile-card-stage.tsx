"use client";

import ProfileCard from "@/components/profile-card";
import { useSiteConfig } from "@/lib/site-store";
import { profile } from "@/lib/profile";

export function ProfileCardStage() {
  const { profileCard: pc } = useSiteConfig();

  return (
    <div className="flex items-center justify-center">
      <ProfileCard
        {...pc}
        avatarUrl={pc.avatarUrl || undefined}
        iconUrl={pc.iconUrl || undefined}
        miniAvatarUrl={pc.miniAvatarUrl || undefined}
        backdropColor={pc.backdropColor || undefined}
        onContactClick={() => {
          window.location.href = `mailto:${profile.contact.email}`;
        }}
      />
    </div>
  );
}
