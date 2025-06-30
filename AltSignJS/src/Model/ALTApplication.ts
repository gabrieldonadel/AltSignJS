import * as fs from "fs";
import * as path from "path";
import * as plist from "plist";
import { ALTDeviceType } from "./AppleAPI/ALTDevice";
import { ALTProvisioningProfile } from "./AppleAPI/ALTProvisioningProfile";
import { ALTEntitlement } from "../Capabilities/ALTCapabilities";

interface NSOperatingSystemVersion {
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
}

function ALTDeviceTypeFromUIDeviceFamily(deviceFamily: number): ALTDeviceType {
  switch (deviceFamily) {
    case 1:
      return ALTDeviceType.iPhone;
    case 2:
      return ALTDeviceType.iPad;
    case 3:
      return ALTDeviceType.AppleTV;
    default:
      return ALTDeviceType.None;
  }
}

export class ALTApplication {
  name: string;
  bundleIdentifier: string;
  version: string;
  provisioningProfile?: ALTProvisioningProfile;
  appExtensions: Set<ALTApplication>;
  minimumiOSVersion: NSOperatingSystemVersion;
  supportedDeviceTypes: ALTDeviceType;
  entitlements: { [key in ALTEntitlement]?: any };
  entitlementsString: string;
  fileURL: string;

  constructor(fileURL: string) {
    const infoPlistPath = path.join(fileURL, "Info.plist");
    const infoDictionary = plist.parse(
      fs.readFileSync(infoPlistPath, "utf8")
    ) as any;

    const name =
      infoDictionary["CFBundleDisplayName"] ?? infoDictionary["CFBundleName"];
    const bundleIdentifier = infoDictionary["CFBundleIdentifier"];

    if (!name || !bundleIdentifier) {
      throw new Error("Invalid Info.plist");
    }

    const version = infoDictionary["CFBundleShortVersionString"] ?? "1.0";
    const minimumVersionString = infoDictionary["MinimumOSVersion"] ?? "1.0";

    const versionComponents = minimumVersionString.split(".").map(Number);

    const minimumVersion: NSOperatingSystemVersion = {
      majorVersion: versionComponents[0],
      minorVersion: versionComponents[1] ?? 0,
      patchVersion: versionComponents[2] ?? 0,
    };

    const deviceFamilies = infoDictionary["UIDeviceFamily"];
    let supportedDeviceTypes = ALTDeviceType.None;

    if (typeof deviceFamilies === "number") {
      supportedDeviceTypes = ALTDeviceTypeFromUIDeviceFamily(deviceFamilies);
    } else if (Array.isArray(deviceFamilies) && deviceFamilies.length > 0) {
      for (const deviceFamily of deviceFamilies) {
        supportedDeviceTypes |= ALTDeviceTypeFromUIDeviceFamily(deviceFamily);
      }
    } else {
      supportedDeviceTypes = ALTDeviceType.iPhone;
    }

    this.fileURL = fileURL;
    this.name = name;
    this.bundleIdentifier = bundleIdentifier;
    this.version = version;
    this.minimumiOSVersion = minimumVersion;
    this.supportedDeviceTypes = supportedDeviceTypes;

    // Placeholder for entitlements - actual implementation would involve parsing the embedded.mobileprovision
    this.entitlements = {};
    this.entitlementsString = "";

    const provisioningProfilePath = path.join(
      fileURL,
      "embedded.mobileprovision"
    );
    if (fs.existsSync(provisioningProfilePath)) {
      this.provisioningProfile =
        ALTProvisioningProfile.fromFile(provisioningProfilePath) ?? undefined;
    }

    this.appExtensions = new Set<ALTApplication>();
    const builtInPlugInsPath = path.join(fileURL, "PlugIns");
    if (fs.existsSync(builtInPlugInsPath)) {
      const plugIns = fs.readdirSync(builtInPlugInsPath);
      for (const plugIn of plugIns) {
        if (plugIn.toLowerCase().endsWith(".appex")) {
          const appExtensionPath = path.join(builtInPlugInsPath, plugIn);
          try {
            const appExtension = new ALTApplication(appExtensionPath);
            this.appExtensions.add(appExtension);
          } catch (error) {
            console.error(
              `Failed to load app extension at ${appExtensionPath}:`,
              error
            );
          }
        }
      }
    }
  }
}
