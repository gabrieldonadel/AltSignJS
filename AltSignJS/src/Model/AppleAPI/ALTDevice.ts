export enum ALTDeviceType {
  iPhone = 1 << 1,
  iPad = 1 << 2,
  AppleTV = 1 << 3,
  None = 0,
  All = iPhone | iPad | AppleTV,
}

export class ALTDevice {
  name: string;
  identifier: string;
  type: ALTDeviceType;

  constructor(name: string, identifier: string, type: ALTDeviceType) {
    this.name = name;
    this.identifier = identifier;
    this.type = type;
  }

  static fromResponseDictionary(responseDictionary: {
    [key: string]: any;
  }): ALTDevice | null {
    const name = responseDictionary["name"];
    const identifier = responseDictionary["deviceNumber"];

    if (!name || !identifier) {
      return null;
    }

    let deviceType = ALTDeviceType.None;
    const deviceClass = responseDictionary["deviceClass"] ?? "iphone";
    if (deviceClass === "iphone") {
      deviceType = ALTDeviceType.iPhone;
    } else if (deviceClass === "ipad") {
      deviceType = ALTDeviceType.iPad;
    } else if (deviceClass === "tvOS") {
      deviceType = ALTDeviceType.AppleTV;
    }

    return new ALTDevice(name, identifier, deviceType);
  }

  description(): string {
    return `<${this.constructor.name}: Name: ${this.name}, UDID: ${this.identifier}>`;
  }

  isEqual(object: any): boolean {
    if (!(object instanceof ALTDevice)) {
      return false;
    }
    return this.identifier === object.identifier;
  }

  hash(): string {
    return this.identifier;
  }

  copy(): ALTDevice {
    return new ALTDevice(this.name, this.identifier, this.type);
  }
}
