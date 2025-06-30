export const AltSignErrorDomain = "com.rileytestut.AltSign";
export enum ALTError {
  Unknown,
  InvalidApp,
  MissingAppBundle,
  MissingInfoPlist,
  MissingProvisioningProfile,
}

export const ALTAppleAPIErrorDomain = "com.rileytestut.ALTAppleAPI";
export enum ALTAppleAPIError {
  Unknown,
  InvalidParameters,
  IncorrectCredentials,
  AppSpecificPasswordRequired,
  NoTeams,
  InvalidDeviceID,
  DeviceAlreadyRegistered,
  InvalidCertificateRequest,
  CertificateDoesNotExist,
  InvalidAppIDName,
  InvalidBundleIdentifier,
  BundleIdentifierUnavailable,
  AppIDDoesNotExist,
  MaximumAppIDLimitReached,
  InvalidAppGroup,
  AppGroupDoesNotExist,
  InvalidProvisioningProfileIdentifier,
  ProvisioningProfileDoesNotExist,
  RequiresTwoFactorAuthentication,
  IncorrectVerificationCode,
  AuthenticationHandshakeFailed,
}

export function getAltSignErrorMessage(error: ALTError): string {
  switch (error) {
    case ALTError.Unknown:
      return "An unknown error occurred.";
    case ALTError.InvalidApp:
      return "The app is invalid.";
    case ALTError.MissingAppBundle:
      return "The provided .ipa does not contain an app bundle.";
    case ALTError.MissingInfoPlist:
      return "The provided app is missing its Info.plist.";
    case ALTError.MissingProvisioningProfile:
      return "Could not find matching provisioning profile.";
    default:
      return "An unknown error occurred.";
  }
}

export function getALTAppleAPIErrorMessage(error: ALTAppleAPIError): string {
  switch (error) {
    case ALTAppleAPIError.Unknown:
      return "An unknown error occurred.";
    case ALTAppleAPIError.InvalidParameters:
      return "The provided parameters are invalid.";
    case ALTAppleAPIError.IncorrectCredentials:
      return "Incorrect Apple ID or password.";
    case ALTAppleAPIError.AppSpecificPasswordRequired:
      return "An app-specific password is required. You can create one at appleid.apple.com.";
    case ALTAppleAPIError.NoTeams:
      return "You are not a member of any development teams.";
    case ALTAppleAPIError.InvalidDeviceID:
      return "This device's UDID is invalid.";
    case ALTAppleAPIError.DeviceAlreadyRegistered:
      return "This device is already registered with this team.";
    case ALTAppleAPIError.InvalidCertificateRequest:
      return "The certificate request is invalid.";
    case ALTAppleAPIError.CertificateDoesNotExist:
      return "There is no certificate with the requested serial number for this team.";
    case ALTAppleAPIError.InvalidAppIDName:
      return "The name for this app is invalid.";
    case ALTAppleAPIError.InvalidBundleIdentifier:
      return "The bundle identifier for this app is invalid.";
    case ALTAppleAPIError.BundleIdentifierUnavailable:
      return "The bundle identifier for this app has already been registered.";
    case ALTAppleAPIError.AppIDDoesNotExist:
      return "There is no App ID with the requested identifier on this team.";
    case ALTAppleAPIError.MaximumAppIDLimitReached:
      return "You may only register 10 App IDs every 7 days.";
    case ALTAppleAPIError.InvalidAppGroup:
      return "The provided app group is invalid.";
    case ALTAppleAPIError.AppGroupDoesNotExist:
      return "App group does not exist";
    case ALTAppleAPIError.InvalidProvisioningProfileIdentifier:
      return "The identifier for the requested provisioning profile is invalid.";
    case ALTAppleAPIError.ProvisioningProfileDoesNotExist:
      return "There is no provisioning profile with the requested identifier on this team.";
    case ALTAppleAPIError.RequiresTwoFactorAuthentication:
      return "This account requires signing in with two-factor authentication.";
    case ALTAppleAPIError.IncorrectVerificationCode:
      return "Incorrect verification code.";
    case ALTAppleAPIError.AuthenticationHandshakeFailed:
      return "Failed to perform authentication handshake with server.";
    default:
      return "An unknown error occurred.";
  }
}
