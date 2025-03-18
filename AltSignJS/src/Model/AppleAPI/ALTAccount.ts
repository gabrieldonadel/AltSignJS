export class ALTAccount {
  public readonly appleID: string;
  public readonly identifier: string;
  public readonly firstName: string;
  public readonly lastName: string;

  constructor(
    appleID: string,
    identifier: string,
    firstName: string,
    lastName: string
  ) {
    this.appleID = appleID;
    this.identifier = identifier;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  // Readonly computed property
  get name(): string {
    // Simple concatenation for basic functionality
    // For advanced localization, consider using Intl.DisplayNames
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Equivalent of initWithResponseDictionary
  static fromResponse(response: Record<string, any>): ALTAccount | null {
    const appleID = response.email;
    const identifier = response.personId?.toString();
    const firstName = response.firstName || response.dsFirstName;
    const lastName = response.lastName || response.dsLastName;

    if (!appleID || !identifier || !firstName || !lastName) {
      return null;
    }

    return new ALTAccount(
      appleID.toString(),
      identifier,
      firstName.toString(),
      lastName.toString()
    );
  }

  // Equality check
  equals(other: ALTAccount): boolean {
    return this.identifier === other.identifier;
  }

  // Description method
  toString(): string {
    return `${this.constructor.name}: Name: ${this.name}, Apple ID: ${this.appleID}`;
  }
}
