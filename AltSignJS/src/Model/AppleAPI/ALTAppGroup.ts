export class ALTAppGroup {
  public readonly name: string;
  public readonly identifier: string;
  public readonly groupIdentifier: string;

  constructor(name: string, identifier: string, groupIdentifier: string) {
    this.name = name;
    this.identifier = identifier;
    this.groupIdentifier = groupIdentifier;
  }

  // Factory method for response parsing
  static fromResponse(response: Record<string, any>): ALTAppGroup | null {
    const name = response.name;
    const identifier = response.applicationGroup;
    const groupIdentifier = response.identifier;

    if (!name || !identifier || !groupIdentifier) {
      return null;
    }

    return new ALTAppGroup(
      name.toString(),
      identifier.toString(),
      groupIdentifier.toString()
    );
  }

  // Equality check
  equals(other: ALTAppGroup): boolean {
    return (
      this.identifier === other.identifier &&
      this.groupIdentifier === other.groupIdentifier
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

    return hashString(this.identifier) ^ hashString(this.groupIdentifier);
  }

  // String representation
  toString(): string {
    return `${this.constructor.name}: ID: ${this.identifier}, GroupID: ${this.groupIdentifier}`;
  }
}
