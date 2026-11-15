"use client";

import ProfileCard from "@/components/profile-card";
import {
  resolveProfileCardAvatar,
  resolveProfileCardImageFit,
  resolveProfileCardMiniAvatar,
} from "@/lib/content/identity-images";
import { useSiteConfig } from "@/lib/site-store";
import { profile } from "@/lib/profile";

export function ProfileCardStage() {
  const { profileCard: pc, generalProfile, lanyard } = useSiteConfig();
  const imageContext = { profileCard: pc, generalProfile, lanyard };
  const resolvedAvatar = resolveProfileCardAvatar(imageContext).url;
  const resolvedMiniAvatar = resolveProfileCardMiniAvatar(imageContext).url;
  const resolvedImageFit = resolveProfileCardImageFit(imageContext);

  return (
    <div className="flex w-full min-w-0 items-center justify-center">
      <ProfileCard
        {...pc}
        name={pc.name || generalProfile?.name || profile.name}
        title={pc.title || generalProfile?.roles || profile.roles}
        avatarUrl={resolvedAvatar}
        iconUrl={pc.iconUrl || undefined}
        miniAvatarUrl={resolvedMiniAvatar}
        imageFit={resolvedImageFit}
        backdropColor={pc.backdropColor || undefined}
        onContactClick={() => {
          window.location.href = `mailto:${generalProfile?.email || profile.contact.email}`;
        }}
      />
    </div>
  );
}
