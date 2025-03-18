import { ALTAnisetteData } from "../Model/AppleAPI/ALTAnisetteData";

export class ALTAppleAPISession {
  public readonly dsid: string;
  public readonly authToken: string;
  public readonly anisetteData: ALTAnisetteData;

  constructor(dsid: string, authToken: string, anisetteData: ALTAnisetteData) {
    this.dsid = dsid;
    this.authToken = authToken;
    this.anisetteData = anisetteData;
  }

  // Mimic Objective-C's description method
  public toString(): string {
    return `<${this.constructor.name}: DSID: ${this.dsid}, Auth Token: ${
      this.authToken
    }, Anisette Data: ${JSON.stringify(this.anisetteData)}>`;
  }
}
