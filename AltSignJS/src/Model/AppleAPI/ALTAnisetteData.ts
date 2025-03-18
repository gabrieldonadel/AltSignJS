export class ALTAnisetteData {
  public readonly machineID: string;
  public readonly oneTimePassword: string;
  public readonly localUserID: string;
  public readonly routingInfo: bigint;
  public readonly deviceUniqueIdentifier: string;
  public readonly deviceSerialNumber: string;
  public readonly deviceDescription: string;
  public readonly date: Date;
  public readonly locale: string;
  public readonly timeZone: string;

  constructor(
    machineID: string,
    oneTimePassword: string,
    localUserID: string,
    routingInfo: bigint,
    deviceUniqueIdentifier: string,
    deviceSerialNumber: string,
    deviceDescription: string,
    date: Date,
    locale: string,
    timeZone: string
  ) {
    this.machineID = machineID;
    this.oneTimePassword = oneTimePassword;
    this.localUserID = localUserID;
    this.routingInfo = routingInfo;
    this.deviceUniqueIdentifier = deviceUniqueIdentifier;
    this.deviceSerialNumber = deviceSerialNumber;
    this.deviceDescription = deviceDescription;
    this.date = date;
    this.locale = locale;
    this.timeZone = timeZone;
  }

  // MARK: - Equality

  public equals(other: ALTAnisetteData): boolean {
    return (
      this.machineID === other.machineID &&
      this.oneTimePassword === other.oneTimePassword &&
      this.localUserID === other.localUserID &&
      this.routingInfo === other.routingInfo &&
      this.deviceUniqueIdentifier === other.deviceUniqueIdentifier &&
      this.deviceSerialNumber === other.deviceSerialNumber &&
      this.deviceDescription === other.deviceDescription &&
      this.date.getTime() === other.date.getTime() &&
      this.locale === other.locale &&
      this.timeZone === other.timeZone
    );
  }

  // MARK: - Copy

  public copy(): ALTAnisetteData {
    return new ALTAnisetteData(
      this.machineID,
      this.oneTimePassword,
      this.localUserID,
      this.routingInfo,
      this.deviceUniqueIdentifier,
      this.deviceSerialNumber,
      this.deviceDescription,
      new Date(this.date),
      this.locale,
      this.timeZone
    );
  }

  // MARK: - Serialization

  public static fromJSON(json: Record<string, string>): ALTAnisetteData | null {
    const {
      machineID,
      oneTimePassword,
      localUserID,
      routingInfo,
      deviceUniqueIdentifier,
      deviceSerialNumber,
      deviceDescription,
      date: dateString,
      locale: localeIdentifier,
      timeZone: timeZoneIdentifier,
    } = json;

    if (
      !machineID ||
      !oneTimePassword ||
      !localUserID ||
      !routingInfo ||
      !deviceUniqueIdentifier ||
      !deviceSerialNumber ||
      !deviceDescription ||
      !dateString ||
      !localeIdentifier ||
      !timeZoneIdentifier
    ) {
      return null;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    // In browser environments, consider using Intl.DateTimeFormat().resolvedOptions().timeZone
    // For Node.js, you might need a timezone library
    const timeZone = timeZoneIdentifier;

    return new ALTAnisetteData(
      machineID,
      oneTimePassword,
      localUserID,
      BigInt(routingInfo),
      deviceUniqueIdentifier,
      deviceSerialNumber,
      deviceDescription,
      date,
      localeIdentifier,
      timeZone
    );
  }

  public toJSON(): Record<string, string> {
    return {
      machineID: this.machineID,
      oneTimePassword: this.oneTimePassword,
      localUserID: this.localUserID,
      routingInfo: this.routingInfo.toString(),
      deviceUniqueIdentifier: this.deviceUniqueIdentifier,
      deviceSerialNumber: this.deviceSerialNumber,
      deviceDescription: this.deviceDescription,
      date: this.date.toISOString(),
      locale: this.locale,
      timeZone: this.timeZone,
    };
  }

  // MARK: - Description

  public toString(): string {
    return `Machine ID: ${this.machineID}
One-Time Password: ${this.oneTimePassword}
Local User ID: ${this.localUserID}
Routing Info: ${this.routingInfo}
Device UDID: ${this.deviceUniqueIdentifier}
Device Serial Number: ${this.deviceSerialNumber}
Device Description: ${this.deviceDescription}
Date: ${this.date.toISOString()}
Locale: ${this.locale}
Time Zone: ${this.timeZone}`;
  }
}
