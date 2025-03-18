export enum ALTDeviceType {
  None = 0,
  iPhone = 1 << 1, // 2
  iPad = 1 << 2, // 4
  AppleTV = 1 << 3, // 8
  All = (1 << 1) | (1 << 2) | (1 << 3), // 14
}

export class ALTDevice {
  public readonly name: string;
  public readonly identifier: string;
  public readonly type: ALTDeviceType;

  constructor(name: string, identifier: string, type: ALTDeviceType) {
    this.name = name;
    this.identifier = identifier;
    this.type = type;
  }

  // Factory method for response parsing
  static fromResponse(response: Record<string, any>): ALTDevice | null {
    const name = response.name;
    const identifier = response.deviceNumber;
    const deviceClass = response.deviceClass?.toLowerCase() || "iphone";

    if (!name || !identifier) {
      return null;
    }

    let type: ALTDeviceType;
    switch (deviceClass) {
      case "iphone":
        type = ALTDeviceType.iPhone;
        break;
      case "ipad":
        type = ALTDeviceType.iPad;
        break;
      case "tvos":
        type = ALTDeviceType.AppleTV;
        break;
      default:
        type = ALTDeviceType.None;
    }

    return new ALTDevice(name.toString(), identifier.toString(), type);
  }

  // Create a copy
  copy(): ALTDevice {
    return new ALTDevice(this.name, this.identifier, this.type);
  }

  // Equality check
  equals(other: ALTDevice): boolean {
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
    return `${this.constructor.name}: Name: ${this.name}, UDID: ${this.identifier}`;
  }

  // Type checker helpers
  get isiPhone(): boolean {
    return (this.type & ALTDeviceType.iPhone) !== 0;
  }

  get isiPad(): boolean {
    return (this.type & ALTDeviceType.iPad) !== 0;
  }

  get isAppleTV(): boolean {
    return (this.type & ALTDeviceType.AppleTV) !== 0;
  }
}
