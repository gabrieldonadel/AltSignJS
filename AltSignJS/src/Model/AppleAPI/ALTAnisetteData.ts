export class ALTAnisetteData {
  machineID: string;
  oneTimePassword: string;
  localUserID: string;
  routingInfo: bigint;
  deviceUniqueIdentifier: string;
  deviceSerialNumber: string;
  deviceDescription: string;
  date: Date;
  locale: Intl.Locale;
  timeZone: string;

  constructor(
    machineID: string,
    oneTimePassword: string,
    localUserID: string,
    routingInfo: bigint,
    deviceUniqueIdentifier: string,
    deviceSerialNumber: string,
    deviceDescription: string,
    date: Date,
    locale: Intl.Locale,
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

  static fromJSON(json: { [key: string]: string }): ALTAnisetteData | null {
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
    const locale = new Intl.Locale(localeIdentifier);

    return new ALTAnisetteData(
      machineID,
      oneTimePassword,
      localUserID,
      BigInt(routingInfo),
      deviceUniqueIdentifier,
      deviceSerialNumber,
      deviceDescription,
      date,
      locale,
      timeZoneIdentifier
    );
  }

  toJSON(): { [key: string]: string } {
    return {
      machineID: this.machineID,
      oneTimePassword: this.oneTimePassword,
      localUserID: this.localUserID,
      routingInfo: this.routingInfo.toString(),
      deviceUniqueIdentifier: this.deviceUniqueIdentifier,
      deviceSerialNumber: this.deviceSerialNumber,
      deviceDescription: this.deviceDescription,
      date: this.date.toISOString(),
      locale: this.locale.toString(),
      timeZone: this.timeZone,
    };
  }
}
