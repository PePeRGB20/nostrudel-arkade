import { nip19 } from "nostr-tools";
import emojiRegex from "emoji-regex";
import { ProfileContent } from "applesauce-core/helpers";

import { truncatedId } from "./event";

// Extended profile content with Arkade support
export type ExtendedProfileContent = ProfileContent & {
  arkade?: string;
};

export function getSearchNames(profile: ProfileContent) {
  if (!profile) return [];

  return [profile.display_name, profile.name, profile.displayName].filter(Boolean) as string[];
}

const matchEmoji = emojiRegex();
export function getDisplayName(metadata: ProfileContent | undefined, pubkey: string, removeEmojis = false) {
  let displayName = metadata?.display_name || metadata?.displayName || metadata?.name;

  if (displayName) {
    if (removeEmojis) displayName = displayName.replaceAll(matchEmoji, "");
    return displayName;
  }

  return truncatedId(nip19.npubEncode(pubkey));
}

/** Extract Lightning address from user profile (lud16 or lud06) */
export function getLightningAddressFromProfile(profile: ProfileContent | undefined): string | undefined {
  return profile?.lud16 || profile?.lud06;
}

/** Extract Arkade address from user profile (must start with ark1) */
export function getArkadeAddressFromProfile(profile: ProfileContent | undefined): string | undefined {
  const arkade = (profile as ExtendedProfileContent)?.arkade;
  if (arkade && typeof arkade === "string" && arkade.startsWith("ark1")) {
    return arkade;
  }
  return undefined;
}
