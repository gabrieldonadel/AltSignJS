import * as fs from "fs";
import * as plist from "plist";
import {
  ALTEntitlement,
  ALTEntitlementApplicationIdentifier,
} from "../../Capabilities/ALTCapabilities";
import { ALTCertificate } from "./ALTCertificate";

export class ALTProvisioningProfile {
  name: string;
  identifier?: string;
  UUID: string;
  bundleIdentifier: string;
  teamIdentifier: string;
  creationDate: Date;
  expirationDate: Date;
  entitlements: { [key in ALTEntitlement]?: any };
  certificates: ALTCertificate[];
  deviceIDs: string[];
  isFreeProvisioningProfile: boolean;
  data: Buffer;

  private constructor(
    data: Buffer,
    name: string,
    UUID: string,
    bundleIdentifier: string,
    teamIdentifier: string,
    creationDate: Date,
    expirationDate: Date,
    entitlements: { [key in ALTEntitlement]?: any },
    certificates: ALTCertificate[],
    deviceIDs: string[],
    isFreeProvisioningProfile: boolean,
    identifier?: string
  ) {
    this.data = data;
    this.name = name;
    this.UUID = UUID;
    this.bundleIdentifier = bundleIdentifier;
    this.teamIdentifier = teamIdentifier;
    this.creationDate = creationDate;
    this.expirationDate = expirationDate;
    this.entitlements = entitlements;
    this.certificates = certificates;
    this.deviceIDs = deviceIDs;
    this.isFreeProvisioningProfile = isFreeProvisioningProfile;
    this.identifier = identifier;
  }

  static fromFile(fileURL: string): ALTProvisioningProfile | null {
    try {
      const data = fs.readFileSync(fileURL);
      return ALTProvisioningProfile.fromData(data);
    } catch (error) {
      console.error(
        `Error reading provisioning profile from file ${fileURL}:`,
        error
      );
      return null;
    }
  }

  static fromData(
    data: Buffer,
    identifier?: string
  ): ALTProvisioningProfile | null {
    const dictionary = ALTProvisioningProfile.dictionaryFromEncodedData(data);

    if (!dictionary) {
      return null;
    }

    const name = dictionary["Name"];
    const UUID = dictionary["UUID"];
    const teamIdentifier = dictionary["TeamIdentifier"]?.[0];
    const creationDate = dictionary["CreationDate"];
    const expirationDate = dictionary["ExpirationDate"];
    const entitlements = dictionary["Entitlements"];
    const deviceIDs = dictionary["ProvisionedDevices"];

    if (
      !name ||
      !UUID ||
      !teamIdentifier ||
      !creationDate ||
      !expirationDate ||
      !entitlements ||
      !deviceIDs
    ) {
      console.error(
        "Missing required provisioning profile data in dictionary.",
        dictionary
      );
      return null;
    }

    const isFreeProvisioningProfile = dictionary["LocalProvision"] ?? false;

    let bundleIdentifier: string | undefined;
    for (const entitlementKey in entitlements) {
      if (entitlementKey === ALTEntitlementApplicationIdentifier) {
        const value = entitlements[entitlementKey];
        const location = value.indexOf(".");
        if (location !== -1) {
          bundleIdentifier = value.substring(location + 1);
          break;
        }
      }
    }

    if (!bundleIdentifier) {
      console.error(
        "Could not determine bundle identifier from provisioning profile entitlements."
      );
      return null;
    }

    const certificates: ALTCertificate[] = [];
    const certificatesArray = dictionary["DeveloperCertificates"];
    if (Array.isArray(certificatesArray)) {
      for (const certData of certificatesArray) {
        const certificate = ALTCertificate.fromData(certData);
        if (certificate) {
          certificates.push(certificate);
        }
      }
    }

    return new ALTProvisioningProfile(
      data,
      name,
      UUID,
      bundleIdentifier,
      teamIdentifier,
      creationDate,
      expirationDate,
      entitlements,
      certificates,
      deviceIDs,
      isFreeProvisioningProfile,
      identifier
    );
  }

  static fromResponseDictionary(responseDictionary: {
    [key: string]: any;
  }): ALTProvisioningProfile | null {
    const identifier = responseDictionary["provisioningProfileId"];
    const data = responseDictionary["encodedProfile"];

    if (!identifier || !data) {
      return null;
    }

    // Assuming 'data' is a base64 encoded string or a Buffer directly
    const bufferData =
      typeof data === "string" ? Buffer.from(data, "base64") : data;

    return ALTProvisioningProfile.fromData(bufferData, identifier);
  }

  // Placeholder for ASN.1 parsing. A proper implementation would use a library like 'asn1.js' or similar.
  static dictionaryFromEncodedData(
    encodedData: Buffer
  ): { [key: string]: any } | null {
    try {
      // Attempt to find the plist XML declaration within the binary data
      const xmlString = encodedData.toString("utf8");
      const plistStart = xmlString.indexOf("<?xml");
      const plistEnd = xmlString.indexOf("</plist>");

      if (plistStart !== -1 && plistEnd !== -1) {
        const rawPlist = xmlString.substring(
          plistStart,
          plistEnd + "</plist>".length
        );
        return plist.parse(rawPlist) as { [key: string]: any };
      } else {
        // Fallback: if it's not a clear XML string, try to parse it directly as binary plist
        // This might fail if it's not a binary plist or if it's wrapped in other binary data
        return plist.parse(encodedData.toString("binary")) as {
          [key: string]: any;
        };
      }
    } catch (error) {
      console.error("Error parsing provisioning profile data:", error);
      return null;
    }
  }

  description(): string {
    return `<${this.constructor.name}: Name: ${this.name}, UUID: ${this.UUID}, App BundleID: ${this.bundleIdentifier}>`;
  }

  isEqual(object: any): boolean {
    if (!(object instanceof ALTProvisioningProfile)) {
      return false;
    }
    return this.UUID === object.UUID && this.data.equals(object.data);
  }

  hash(): string {
    return `${this.UUID}^${this.data.toString("hex")}`;
  }

  copy(): ALTProvisioningProfile {
    const copiedProfile = ALTProvisioningProfile.fromData(
      this.data,
      this.identifier
    );
    if (!copiedProfile) {
      throw new Error("Failed to copy provisioning profile.");
    }
    return copiedProfile;
  }
}
