// Assuming ALTFeature is defined elsewhere as a string type
type ALTFeature = string;

export class ALTAppID {
  public readonly name: string;
  public readonly identifier: string;
  public readonly bundleIdentifier: string;
  public readonly expirationDate: Date | null;
  public readonly features: Record<ALTFeature, any>;

  constructor(
    name: string,
    identifier: string,
    bundleIdentifier: string,
    expirationDate: Date | null,
    features: Record<ALTFeature, any>
  ) {
    this.name = name;
    this.identifier = identifier;
    this.bundleIdentifier = bundleIdentifier;
    this.expirationDate = expirationDate ? new Date(expirationDate) : null;
    this.features = { ...features };
  }

  // Factory method for response parsing
  static fromResponse(response: Record<string, any>): ALTAppID | null {
    const name = response.name;
    const identifier = response.appIdId;
    const bundleIdentifier = response.identifier;

    if (!name || !identifier || !bundleIdentifier) {
      return null;
    }

    const allFeatures = response.features || {};
    const enabledFeatures: ALTFeature[] = response.enabledFeatures || [];

    const features: Record<ALTFeature, any> = {};
    for (const feature of enabledFeatures) {
      features[feature] = allFeatures[feature];
    }

    const expirationDate = response.expirationDate
      ? new Date(response.expirationDate)
      : null;

    return new ALTAppID(
      name.toString(),
      identifier.toString(),
      bundleIdentifier.toString(),
      expirationDate,
      features
    );
  }

  // Equality check
  equals(other: ALTAppID): boolean {
    return (
      this.identifier === other.identifier &&
      this.bundleIdentifier === other.bundleIdentifier
    );
  }

  // Hash code simulation
  get hashCode(): number {
    const hashString = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32-bit integer
      }
      return hash;
    };

    return hashString(this.identifier) ^ hashString(this.bundleIdentifier);
  }

  // Create a deep copy
  copy(): ALTAppID {
    return new ALTAppID(
      this.name,
      this.identifier,
      this.bundleIdentifier,
      this.expirationDate ? new Date(this.expirationDate) : null,
      { ...this.features }
    );
  }

  // String representation
  toString(): string {
    return `${this.constructor.name}: Name: ${this.name}, ID: ${this.identifier}, BundleID: ${this.bundleIdentifier}`;
  }
}
