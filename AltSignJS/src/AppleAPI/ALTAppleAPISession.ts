import { ALTAnisetteData } from "../Model/AppleAPI/ALTAnisetteData";

export class ALTAppleAPISession {
  dsid: string;
  authToken: string;
  anisetteData: ALTAnisetteData;

  constructor(dsid: string, authToken: string, anisetteData: ALTAnisetteData) {
    this.dsid = dsid;
    this.authToken = authToken;
    this.anisetteData = anisetteData;
  }

  description(): string {
    return `<${this.constructor.name}: DSID: ${this.dsid}, Auth Token: ${this.authToken}, Anisette Data: ${this.anisetteData}>`;
  }
}
