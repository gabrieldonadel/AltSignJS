import { ALTAccount } from "./ALTAccount";

export enum ALTTeamType {
  Unknown = 0,
  Free = 1,
  Individual = 2,
  Organization = 3,
}

export class ALTTeam {
  public readonly name: string;
  public readonly identifier: string;
  public readonly type: ALTTeamType;
  public readonly account: ALTAccount;

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

  // Factory method for response parsing
  static fromResponse(
    response: Record<string, any>,
    account: ALTAccount
  ): ALTTeam | null {
    const name = response.name;
    const identifier = response.teamId;
    const teamType = response.type;

    if (!name || !identifier || !teamType) {
      return null;
    }

    let type: ALTTeamType = ALTTeamType.Unknown;

    switch (teamType) {
      case "Company/Organization":
        type = ALTTeamType.Organization;
        break;

      case "Individual": {
        const memberships: any[] = response.memberships || [];
        const membership = memberships[0];

        if (
          memberships.length === 1 &&
          membership?.name?.toLowerCase().includes("free")
        ) {
          type = ALTTeamType.Free;
        } else {
          type = ALTTeamType.Individual;
        }
        break;
      }

      default:
        type = ALTTeamType.Unknown;
    }

    return new ALTTeam(name, identifier, type, account);
  }

  // Equality check
  equals(other: ALTTeam): boolean {
    return this.identifier === other.identifier;
  }

  // Hash code simulation
  get hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this.identifier.length; i++) {
      const char = this.identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash;
  }

  // String representation
  toString(): string {
    return `${this.constructor.name}: Name: ${this.name}`;
  }
}
