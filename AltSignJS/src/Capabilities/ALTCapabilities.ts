// Entitlements
export type ALTEntitlement =
  | "application-identifier"
  | "keychain-access-groups"
  | "com.apple.security.application-groups"
  | "get-task-allow"
  | "com.apple.developer.team-identifier"
  | "inter-app-audio"
  | string; // Allows extensibility

export const ALTEntitlement = {
  ApplicationIdentifier: "application-identifier" as ALTEntitlement,
  KeychainAccessGroups: "keychain-access-groups" as ALTEntitlement,
  AppGroups: "com.apple.security.application-groups" as ALTEntitlement,
  GetTaskAllow: "get-task-allow" as ALTEntitlement,
  TeamIdentifier: "com.apple.developer.team-identifier" as ALTEntitlement,
  InterAppAudio: "inter-app-audio" as ALTEntitlement,
};

// Features
export type ALTFeature = "gameCenter" | "APG3427HIY" | "IAD53UNK2F" | string; // Allows extensibility

export const ALTFeature = {
  GameCenter: "gameCenter" as ALTFeature,
  AppGroups: "APG3427HIY" as ALTFeature,
  InterAppAudio: "IAD53UNK2F" as ALTFeature,
};

// Conversion functions
export function entitlementForFeature(
  feature: ALTFeature
): ALTEntitlement | null {
  switch (feature) {
    case ALTFeature.AppGroups:
      return ALTEntitlement.AppGroups;
    case ALTFeature.InterAppAudio:
      return ALTEntitlement.InterAppAudio;
    default:
      return null;
  }
}

export function featureForEntitlement(
  entitlement: ALTEntitlement
): ALTFeature | null {
  switch (entitlement) {
    case ALTEntitlement.AppGroups:
      return ALTFeature.AppGroups;
    case ALTEntitlement.InterAppAudio:
      return ALTFeature.InterAppAudio;
    default:
      return null;
  }
}
