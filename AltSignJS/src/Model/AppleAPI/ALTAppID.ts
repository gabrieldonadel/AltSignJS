import { ALTFeature } from "../../Capabilities/ALTCapabilities";

export class ALTAppID {
  name: string;
  identifier: string;
  bundleIdentifier: string;
  expirationDate?: Date;
  features: { [key in ALTFeature]?: any };

  constructor(
    name: string,
    identifier: string,
    bundleIdentifier: string,
    expirationDate: Date | undefined,
    features: { [key in ALTFeature]?: any }
  ) {
    this.name = name;
    this.identifier = identifier;
    this.bundleIdentifier = bundleIdentifier;
    this.expirationDate = expirationDate;
    this.features = features;
  }

  static fromResponseDictionary(responseDictionary: {
    [key: string]: any;
  }): ALTAppID | null {
    const name = responseDictionary["name"];
    const identifier = responseDictionary["appIdId"];
    const bundleIdentifier = responseDictionary["identifier"];

    if (!name || !identifier || !bundleIdentifier) {
      return null;
    }

    const allFeatures = responseDictionary["features"] ?? {};
    const enabledFeatures = responseDictionary["enabledFeatures"] ?? [];

    const features: { [key in ALTFeature]?: any } = {};
    for (const feature of enabledFeatures) {
      features[feature as ALTFeature] = allFeatures[feature];
    }

    const expirationDate = responseDictionary["expirationDate"];

    return new ALTAppID(
      name,
      identifier,
      bundleIdentifier,
      expirationDate,
      features
    );
  }

  description(): string {
    return `<${this.constructor.name}: Name: ${this.name}, ID: ${this.identifier}, BundleID: ${this.bundleIdentifier}>`;
  }

  isEqual(object: any): boolean {
    if (!(object instanceof ALTAppID)) {
      return false;
    }
    return (
      this.identifier === object.identifier &&
      this.bundleIdentifier === object.bundleIdentifier
    );
  }

  hash(): string {
    return `${this.identifier}^${this.bundleIdentifier}`;
  }

  copy(): ALTAppID {
    return new ALTAppID(
      this.name,
      this.identifier,
      this.bundleIdentifier,
      this.expirationDate,
      this.features
    );
  }
}
