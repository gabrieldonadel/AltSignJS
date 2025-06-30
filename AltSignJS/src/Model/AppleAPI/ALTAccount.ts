export class ALTAccount {
  appleID: string;
  identifier: string;
  firstName: string;
  lastName: string;

  constructor(responseDictionary: { [key: string]: any }) {
    const appleID = responseDictionary["email"];
    const identifier = responseDictionary["personId"];
    const firstName =
      responseDictionary["firstName"] ?? responseDictionary["dsFirstName"];
    const lastName =
      responseDictionary["lastName"] ?? responseDictionary["dsLastName"];

    if (!appleID || !identifier || !firstName || !lastName) {
      throw new Error("Invalid response dictionary.");
    }

    this.appleID = appleID;
    this.identifier = identifier.toString();
    this.firstName = firstName;
    this.lastName = lastName;
  }

  get name(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  description(): string {
    return `<${this.constructor.name}: ${this.name}, Apple ID: ${this.appleID}>`;
  }

  isEqual(object: any): boolean {
    if (!(object instanceof ALTAccount)) {
      return false;
    }
    return this.identifier === object.identifier;
  }

  hash(): string {
    return this.identifier;
  }
}
