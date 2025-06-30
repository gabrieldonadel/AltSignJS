import { ALTAccount } from "./ALTAccount";

export enum ALTTeamType {
  Unknown = 0,
  Free = 1,
  Individual = 2,
  Organization = 3,
}

export class ALTTeam {
  name: string;
  identifier: string;
  type: ALTTeamType;
  account: ALTAccount;

  constructor(
    name: string,
    identifier: string,
    type: ALTTeamType,
    account: ALTAccount
  ) {
    this.name = name;
    this.identifier = identifier;
    this.type = type;
    this.account = account;
  }

  static fromResponseDictionary(
    account: ALTAccount,
    responseDictionary: { [key: string]: any }
  ): ALTTeam | null {
    const name = responseDictionary["name"];
    const identifier = responseDictionary["teamId"];
    const teamType = responseDictionary["type"];

    if (!name || !identifier || !teamType) {
      return null;
    }

    let type = ALTTeamType.Unknown;

    if (teamType === "Company/Organization") {
      type = ALTTeamType.Organization;
    } else if (teamType === "Individual") {
      const memberships = responseDictionary["memberships"];
      const membership = memberships?.[0];
      const name = membership?.["name"];

      if (memberships?.length === 1 && name?.toLowerCase().includes("free")) {
        type = ALTTeamType.Free;
      } else {
        type = ALTTeamType.Individual;
      }
    } else {
      type = ALTTeamType.Unknown;
    }

    return new ALTTeam(name, identifier, type, account);
  }

  description(): string {
    return `<${this.constructor.name}: Name: ${this.name}>`;
  }

  isEqual(object: any): boolean {
    if (!(object instanceof ALTTeam)) {
      return false;
    }
    return this.identifier === object.identifier;
  }

  hash(): string {
    return this.identifier;
  }
}
