export class ALTAppGroup {
  name: string;
  identifier: string;
  groupIdentifier: string;

  constructor(responseDictionary: { [key: string]: any }) {
    const name = responseDictionary["name"];
    const identifier = responseDictionary["applicationGroup"];
    const groupIdentifier = responseDictionary["identifier"];

    if (!name || !identifier || !groupIdentifier) {
      throw new Error("Invalid response dictionary.");
    }

    this.name = name;
    this.identifier = identifier;
    this.groupIdentifier = groupIdentifier;
  }

  description(): string {
    return `<${this.constructor.name}: ID: ${this.identifier}, GroupID: ${this.groupIdentifier}>`;
  }

  isEqual(object: any): boolean {
    if (!(object instanceof ALTAppGroup)) {
      return false;
    }
    return (
      this.identifier === object.identifier &&
      this.groupIdentifier === object.groupIdentifier
    );
  }

  hash(): string {
    return `${this.identifier}^${this.groupIdentifier}`;
  }
}
