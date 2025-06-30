// Entitlements
export type ALTEntitlement = string;
export const ALTEntitlementApplicationIdentifier: ALTEntitlement =
  "application-identifier";
export const ALTEntitlementKeychainAccessGroups: ALTEntitlement =
  "keychain-access-groups";
export const ALTEntitlementAppGroups: ALTEntitlement =
  "com.apple.security.application-groups";
export const ALTEntitlementGetTaskAllow: ALTEntitlement = "get-task-allow";
export const ALTEntitlementTeamIdentifier: ALTEntitlement =
  "com.apple.developer.team-identifier";
export const ALTEntitlementInterAppAudio: ALTEntitlement = "inter-app-audio";

// Features
export type ALTFeature = string;
export const ALTFeatureGameCenter: ALTFeature = "gameCenter";
export const ALTFeatureAppGroups: ALTFeature = "APG3427HIY";
export const ALTFeatureInterAppAudio: ALTFeature = "IAD53UNK2F";

export function ALTEntitlementForFeature(
  feature: ALTFeature
): ALTEntitlement | null {
  if (feature === ALTFeatureAppGroups) {
    return ALTEntitlementAppGroups;
  } else if (feature === ALTFeatureInterAppAudio) {
    return ALTEntitlementInterAppAudio;
  }

  return null;
}

export function ALTFeatureForEntitlement(
  entitlement: ALTEntitlement
): ALTFeature | null {
  if (entitlement === ALTEntitlementAppGroups) {
    return ALTFeatureAppGroups;
  } else if (entitlement === ALTEntitlementInterAppAudio) {
    return ALTFeatureInterAppAudio;
  }

  return null;
}
