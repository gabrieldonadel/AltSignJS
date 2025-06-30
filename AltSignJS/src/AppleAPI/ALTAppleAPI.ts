import { ALTAccount } from "../Model/AppleAPI/ALTAccount";
import { ALTAnisetteData } from "../Model/AppleAPI/ALTAnisetteData";
import { ALTTeam } from "../Model/AppleAPI/ALTTeam";
import { ALTDevice } from "../Model/AppleAPI/ALTDevice";
import { ALTCertificate } from "../Model/AppleAPI/ALTCertificate";
import { ALTAppID } from "../Model/AppleAPI/ALTAppID";
import { ALTAppGroup } from "../Model/AppleAPI/ALTAppGroup";
import { ALTProvisioningProfile } from "../Model/AppleAPI/ALTProvisioningProfile";
import { ALTAppleAPISession } from "./ALTAppleAPISession";
import { ALTAppleAPIError, getALTAppleAPIErrorMessage } from "../Errors";
import { SRP } from "./SRP";
import fetch from "node-fetch";
import * as plist from "plist";

const ALTAuthenticationProtocolVersion = "A1234";
const ALTProtocolVersion = "QH65B2";
const ALTAppIDKey =
  "ba2ec180e6ca6e6c6a542255453b24d6e6e5b2be0cc48bc1b0d8ad64cfe0228f";
const ALTClientID = "XABBG36SBA";

export class ALTAppleAPI {
  private static _sharedAPI: ALTAppleAPI;
  private baseURL: string;
  private servicesBaseURL: string;
  private srp: SRP;

  private constructor() {
    this.baseURL = `https://developerservices2.apple.com/services/${ALTProtocolVersion}/`;
    this.servicesBaseURL = "https://developerservices2.apple.com/services/v1/";
    this.srp = new SRP();
  }

  static get sharedAPI(): ALTAppleAPI {
    if (!ALTAppleAPI._sharedAPI) {
      ALTAppleAPI._sharedAPI = new ALTAppleAPI();
    }
    return ALTAppleAPI._sharedAPI;
  }

  private async sendRequest(
    requestURL: string,
    additionalParameters: { [key: string]: any } | null,
    session: ALTAppleAPISession | null,
    team: ALTTeam | null,
    isServicesRequest: boolean = false
  ): Promise<{
    responseDictionary: { [key: string]: any } | null;
    error: Error | null;
  }> {
    let url = requestURL;
    let body: string | Buffer | undefined;
    let headers: { [key: string]: string } = {};
    let method = "POST";

    if (isServicesRequest) {
      const queryItems: string[] = [];
      if (team) {
        queryItems.push(`teamId=${team.identifier}`);
      }
      for (const key in additionalParameters) {
        queryItems.push(`${key}=${additionalParameters[key]}`);
      }
      const queryString = queryItems.join("&");

      body = JSON.stringify({ urlEncodedQueryParams: queryString });
      headers = {
        "Content-Type": "application/vnd.api+json",
        "X-HTTP-Method-Override": method,
      };
    } else {
      const parameters: { [key: string]: any } = {
        clientId: ALTClientID,
        protocolVersion: ALTProtocolVersion,
        requestId: Math.random().toString(36).substring(2).toUpperCase(),
        ...(additionalParameters ?? {}),
      };

      if (team) {
        parameters.teamId = team.identifier;
      }

      body = plist.build(parameters);
      url = `${requestURL}?clientId=${ALTClientID}`;
      headers = {
        "Content-Type": "text/x-xml-plist",
        Accept: "text/x-xml-plist",
      };
    }

    headers = {
      ...headers,
      "User-Agent": "Xcode",
      "Accept-Language": "en-us",
      "X-Apple-App-Info": "com.apple.gs.xcode.auth",
      "X-Xcode-Version": "11.2 (11B41)",
    };

    if (session) {
      headers = {
        ...headers,
        "X-Apple-I-Identity-Id": session.dsid,
        "X-Apple-GS-Token": session.authToken,
        "X-Apple-I-MD-M": session.anisetteData.machineID,
        "X-Apple-I-MD": session.anisetteData.oneTimePassword,
        "X-Apple-I-MD-LU": session.anisetteData.localUserID,
        "X-Apple-I-MD-RINFO": session.anisetteData.routingInfo.toString(),
        "X-Mme-Device-Id": session.anisetteData.deviceUniqueIdentifier,
        "X-Mme-Client-Info": session.anisetteData.deviceDescription,
        "X-Apple-I-Client-Time": session.anisetteData.date.toISOString(),
        "X-Apple-Locale": session.anisetteData.locale.toString(),
        "X-Apple-I-TimeZone": session.anisetteData.timeZone,
      };
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      const responseText = await response.text();
      let responseDictionary: { [key: string]: any } | null = null;

      if (responseText.length === 0) {
        responseDictionary = {};
      } else if (isServicesRequest) {
        responseDictionary = JSON.parse(responseText);
      } else {
        responseDictionary = plist.parse(responseText) as {
          [key: string]: any;
        };
      }

      return { responseDictionary, error: null };
    } catch (error: any) {
      return { responseDictionary: null, error };
    }
  }

  private async sendAuthenticationRequest(
    requestDictionary: { [key: string]: any },
    anisetteData: ALTAnisetteData
  ): Promise<{
    responseDictionary: { [key: string]: any } | null;
    error: Error | null;
  }> {
    const requestURL = "https://gsa.apple.com/grandslam/GsService2";

    const parameters = {
      Header: { Version: "1.0.1" },
      Request: requestDictionary,
    };

    const bodyData = plist.build(parameters);

    const httpHeaders = {
      "Content-Type": "text/x-xml-plist",
      "X-MMe-Client-Info": anisetteData.deviceDescription,
      Accept: "*/*",
      "User-Agent": "akd/1.0 CFNetwork/978.0.7 Darwin/18.7.0",
    };

    try {
      const response = await fetch(requestURL, {
        method: "POST",
        headers: httpHeaders,
        body: bodyData,
      });

      const responseText = await response.text();
      const responseDictionary = plist.parse(responseText) as {
        [key: string]: any;
      };

      const status = responseDictionary["Response"]?.["Status"];
      const errorCode = parseInt(status?.["ec"]);

      if (errorCode !== 0) {
        let error: Error | null = null;
        switch (errorCode) {
          case -22406:
            error = new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.IncorrectCredentials)
            );
            break;
          default:
            const errorDescription = status?.["em"];
            const localizedDescription = `${errorDescription} (${errorCode})`;
            error = new Error(localizedDescription);
            error.name = ALTAppleAPIError[ALTAppleAPIError.Unknown];
            break;
        }
        return { responseDictionary: null, error };
      } else {
        return {
          responseDictionary: responseDictionary["Response"],
          error: null,
        };
      }
    } catch (error: any) {
      return { responseDictionary: null, error };
    }
  }

  private processResponse<T>(
    responseDictionary: { [key: string]: any },
    parseHandler: () => T | null,
    resultCodeHandler: (resultCode: number) => Error | null
  ): { result: T | null; error: Error | null } {
    const parsedResult = parseHandler();
    if (parsedResult !== null) {
      return { result: parsedResult, error: null };
    }

    const resultCode = parseInt(responseDictionary["resultCode"]);
    if (resultCode === 0) {
      return { result: null, error: null };
    }

    const customError = resultCodeHandler(resultCode);
    if (customError) {
      return { result: null, error: customError };
    }

    const errorDescription =
      responseDictionary["userString"] ?? responseDictionary["resultString"];
    const errorMessage = `${errorDescription} (${resultCode})`;
    const error = new Error(errorMessage);
    error.name = ALTAppleAPIError[ALTAppleAPIError.Unknown];
    return { result: null, error };
  }

  async authenticate(
    appleID: string,
    password: string,
    anisetteData: ALTAnisetteData,
    verificationHandler: (
      completionHandler: (verificationCode: string | null) => void
    ) => void
  ): Promise<{
    account: ALTAccount | null;
    session: ALTAppleAPISession | null;
    error: Error | null;
  }> {
    const clientDictionary = {
      bootstrap: true,
      icscrec: true,
      loc: "en_US", // Placeholder for NSLocale.currentLocale.localeIdentifier
      pbe: false,
      prkgen: true,
      svct: "iCloud",
      "X-Apple-I-Client-Time": anisetteData.date.toISOString(),
      "X-Apple-Locale": anisetteData.locale.toString(),
      "X-Apple-I-TimeZone": anisetteData.timeZone,
      "X-Apple-I-MD": anisetteData.oneTimePassword,
      "X-Apple-I-MD-LU": anisetteData.localUserID,
      "X-Apple-I-MD-M": anisetteData.machineID,
      "X-Apple-I-MD-RINFO": anisetteData.routingInfo.toString(),
      "X-Mme-Device-Id": anisetteData.deviceUniqueIdentifier,
      "X-Apple-I-SRL-NO": anisetteData.deviceSerialNumber,
    };

    const { A_data, clientEphemeral } = this.srp.clientStartAuthentication();

    const parameters1 = {
      A2k: A_data,
      ps: ["s2k", "s2k_fo"],
      cpd: clientDictionary,
      u: appleID,
      o: "init",
    };

    const { responseDictionary: response1, error: requestError1 } =
      await this.sendAuthenticationRequest(parameters1, anisetteData);

    if (response1 === null) {
      return { account: null, session: null, error: requestError1 };
    }

    const sp = response1["sp"];
    const isS2K = sp === "s2k";

    const salt = response1["s"];
    const iterations = response1["i"];
    const B_data = response1["B"];
    const c = response1["c"];

    if (!c || !salt || !iterations || !B_data) {
      return {
        account: null,
        session: null,
        error: new Error("Missing SRP challenge parameters."),
      };
    }

    const passwordKey = this.srp.pbkdf2SRP(
      password,
      salt,
      parseInt(iterations),
      isS2K
    );

    const srpResult = this.srp.clientProcessChallenge(
      appleID,
      passwordKey,
      salt,
      B_data
    );

    if (!srpResult) {
      return {
        account: null,
        session: null,
        error: new Error(
          getALTAppleAPIErrorMessage(
            ALTAppleAPIError.AuthenticationHandshakeFailed
          )
        ),
      };
    }

    const { M1_data, sessionKey } = srpResult;

    const parameters2 = {
      c: c,
      M1: M1_data,
      cpd: clientDictionary,
      u: appleID,
      o: "complete",
    };

    const { responseDictionary: response2, error: requestError2 } =
      await this.sendAuthenticationRequest(parameters2, anisetteData);

    if (response2 === null) {
      return { account: null, session: null, error: requestError2 };
    }

    const M2_data = response2["M2"];
    if (!M2_data || !this.srp.clientVerifySession(M2_data)) {
      return {
        account: null,
        session: null,
        error: new Error(
          getALTAppleAPIErrorMessage(
            ALTAppleAPIError.AuthenticationHandshakeFailed
          )
        ),
      };
    }

    const spd = response2["spd"];
    const sc = response2["sc"];
    const np = response2["np"];

    if (!np) {
      return {
        account: null,
        session: null,
        error: new Error("Missing neg proto hash."),
      };
    }

    const decryptedData = this.srp.decryptDataCBC(
      sessionKey,
      Buffer.alloc(16),
      spd
    ); // Placeholder IV
    if (!decryptedData) {
      return {
        account: null,
        session: null,
        error: new Error("Failed to decrypt login response."),
      };
    }

    const decryptedDictionary = plist.parse(decryptedData.toString()) as {
      [key: string]: any;
    };

    const adsid = decryptedDictionary["adsid"];
    const idmsToken = decryptedDictionary["GsIdmsToken"];

    if (!adsid || !idmsToken) {
      return {
        account: null,
        session: null,
        error: new Error("Missing adsid or idmsToken."),
      };
    }

    const statusDictionary = response2["Status"];
    const authType = statusDictionary?.["au"];

    if (authType === "trustedDeviceSecondaryAuth") {
      // Handle Two-Factor
      const { success, error: twoFactorError } = await new Promise<{
        success: boolean;
        error: Error | null;
      }>((resolve) => {
        verificationHandler(async (verificationCode) => {
          if (verificationCode === null) {
            resolve({
              success: false,
              error: new Error(
                getALTAppleAPIErrorMessage(
                  ALTAppleAPIError.RequiresTwoFactorAuthentication
                )
              ),
            });
            return;
          }
          const { success, error } = await this.requestTwoFactorCodeForDSID(
            adsid,
            idmsToken,
            verificationCode,
            anisetteData
          );
          resolve({ success, error });
        });
      });

      if (!success) {
        return { account: null, session: null, error: twoFactorError };
      }

      // Re-authenticate after successful 2FA
      return this.authenticate(
        appleID,
        password,
        anisetteData,
        verificationHandler
      );
    } else {
      // Fetch Auth Token
      const sk = decryptedDictionary["sk"];
      const c_token = decryptedDictionary["c"];

      if (!sk || !c_token) {
        return {
          account: null,
          session: null,
          error: new Error("Missing sk or c_token for auth token fetch."),
        };
      }

      const apps = ["com.apple.gs.xcode.auth"];
      const checksum = this.srp.createAppTokensChecksum(sk, adsid, apps);

      const tokenParameters = {
        u: adsid,
        app: apps,
        c: c_token,
        t: idmsToken,
        checksum: checksum,
        cpd: clientDictionary,
        o: "apptokens",
      };

      const { authToken, error: authTokenError } =
        await this.fetchAuthTokenWithParameters(
          tokenParameters,
          sk,
          anisetteData
        );

      if (authToken === null) {
        return { account: null, session: null, error: authTokenError };
      }

      const session = new ALTAppleAPISession(adsid, authToken, anisetteData);
      const { account, error: accountError } =
        await this.fetchAccountForSession(session);

      if (account === null) {
        return { account: null, session: null, error: accountError };
      }

      return { account, session, error: null };
    }
  }

  private async fetchAuthTokenWithParameters(
    parameters: { [key: string]: any },
    sk: Buffer,
    anisetteData: ALTAnisetteData
  ): Promise<{ authToken: string | null; error: Error | null }> {
    const { responseDictionary, error: requestError } =
      await this.sendAuthenticationRequest(parameters, anisetteData);

    if (responseDictionary === null) {
      return { authToken: null, error: requestError };
    }

    const encryptedToken = responseDictionary["et"];
    const decryptedToken = this.srp.decryptDataGCM(sk, encryptedToken);

    if (!decryptedToken) {
      return {
        authToken: null,
        error: new Error("Failed to decrypt apptoken."),
      };
    }

    const decryptedTokenDictionary = plist.parse(decryptedToken.toString()) as {
      [key: string]: any;
    };

    const app = parameters["app"]?.[0];
    const tokenDictionary = decryptedTokenDictionary["t"]?.[app];
    const token = tokenDictionary?.["token"];

    if (!token) {
      return {
        authToken: null,
        error: new Error("Missing token in decrypted apptoken."),
      };
    }

    return { authToken: token, error: null };
  }

  private async requestTwoFactorCodeForDSID(
    dsid: string,
    idmsToken: string,
    verificationCode: string,
    anisetteData: ALTAnisetteData
  ): Promise<{ success: boolean; error: Error | null }> {
    const identityToken = `${dsid}:${idmsToken}`;
    const encodedIdentityToken = Buffer.from(identityToken).toString("base64");

    const httpHeaders = {
      "Content-Type": "text/x-xml-plist",
      "User-Agent": "Xcode",
      Accept: "text/x-xml-plist",
      "Accept-Language": "en-us",
      "X-Apple-App-Info": "com.apple.gs.xcode.auth",
      "X-Xcode-Version": "11.2 (11B41)",
      "X-Apple-Identity-Token": encodedIdentityToken,
      "X-Apple-I-MD-M": anisetteData.machineID,
      "X-Apple-I-MD": anisetteData.oneTimePassword,
      "X-Apple-I-MD-LU": anisetteData.localUserID,
      "X-Apple-I-MD-RINFO": anisetteData.routingInfo.toString(),
      "X-Mme-Device-Id": anisetteData.deviceUniqueIdentifier,
      "X-Mme-Client-Info": anisetteData.deviceDescription,
      "X-Apple-I-Client-Time": anisetteData.date.toISOString(),
      "X-Apple-Locale": anisetteData.locale.toString(),
      "X-Apple-I-TimeZone": anisetteData.timeZone,
      "security-code": verificationCode, // Added for validation step
    };

    const validateURL = "https://gsa.apple.com/grandslam/GsService2/validate";

    try {
      const response = await fetch(validateURL, {
        method: "POST",
        headers: httpHeaders,
      });

      const responseText = await response.text();
      const responseDictionary = plist.parse(responseText) as {
        [key: string]: any;
      };

      const errorCode = parseInt(responseDictionary["ec"]);

      if (errorCode !== 0) {
        let error: Error | null = null;
        switch (errorCode) {
          case -21669:
            error = new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.IncorrectVerificationCode
              )
            );
            break;
          default:
            const errorDescription = responseDictionary["em"];
            const localizedDescription = `${errorDescription} (${errorCode})`;
            error = new Error(localizedDescription);
            error.name = ALTAppleAPIError[ALTAppleAPIError.Unknown];
            break;
        }
        return { success: false, error };
      } else {
        return { success: true, error: null };
      }
    } catch (error: any) {
      return { success: false, error };
    }
  }

  private async fetchAccountForSession(
    session: ALTAppleAPISession
  ): Promise<{ account: ALTAccount | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}viewDeveloper.action`,
      null,
      session,
      null
    );

    if (responseDictionary === null) {
      return { account: null, error: requestError };
    }

    const { result: account, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["developer"];
        if (!dictionary) return null;
        return new ALTAccount(dictionary);
      },
      (resultCode) => {
        return null; // No specific error handling for now
      }
    );

    return { account, error };
  }

  async fetchTeamsForAccount(
    account: ALTAccount,
    session: ALTAppleAPISession
  ): Promise<{ teams: ALTTeam[] | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}listTeams.action`,
      null,
      session,
      null
    );

    if (responseDictionary === null) {
      return { teams: null, error: requestError };
    }

    const { result: teams, error } = this.processResponse(
      responseDictionary,
      () => {
        const array = responseDictionary["teams"];
        if (!array) return null;

        const parsedTeams: ALTTeam[] = [];
        for (const dictionary of array) {
          const team = ALTTeam.fromResponseDictionary(account, dictionary);
          if (team) parsedTeams.push(team);
        }
        return parsedTeams;
      },
      (resultCode) => {
        return null; // No specific error handling for now
      }
    );

    if (teams && teams.length === 0) {
      return {
        teams: null,
        error: new Error(getALTAppleAPIErrorMessage(ALTAppleAPIError.NoTeams)),
      };
    }

    return { teams, error };
  }

  async fetchDevicesForTeam(
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ devices: ALTDevice[] | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/listDevices.action`,
      null,
      session,
      team
    );

    if (responseDictionary === null) {
      return { devices: null, error: requestError };
    }

    const { result: devices, error } = this.processResponse(
      responseDictionary,
      () => {
        const array = responseDictionary["devices"];
        if (!array) return null;

        const parsedDevices: ALTDevice[] = [];
        for (const dictionary of array) {
          const device = ALTDevice.fromResponseDictionary(dictionary);
          if (device) parsedDevices.push(device);
        }
        return parsedDevices;
      },
      (resultCode) => {
        return null; // No specific error handling for now
      }
    );

    return { devices, error };
  }

  async registerDevice(
    name: string,
    identifier: string,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ device: ALTDevice | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/addDevice.action`,
      { deviceNumber: identifier, name: name },
      session,
      team
    );

    if (responseDictionary === null) {
      return { device: null, error: requestError };
    }

    const { result: device, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["device"];
        if (!dictionary) return null;
        return ALTDevice.fromResponseDictionary(dictionary);
      },
      (resultCode) => {
        switch (resultCode) {
          case 35:
            if (
              responseDictionary["userString"]
                ?.toLowerCase()
                .includes("already exists")
            ) {
              return new Error(
                getALTAppleAPIErrorMessage(
                  ALTAppleAPIError.DeviceAlreadyRegistered
                )
              );
            } else {
              return new Error(
                getALTAppleAPIErrorMessage(ALTAppleAPIError.InvalidDeviceID)
              );
            }
          default:
            return null;
        }
      }
    );

    return { device, error };
  }

  async fetchCertificatesForTeam(
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ certificates: ALTCertificate[] | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.servicesBaseURL}certificates`,
      { "filter[certificateType]": "IOS_DEVELOPMENT" },
      session,
      team,
      true
    );

    if (responseDictionary === null) {
      return { certificates: null, error: requestError };
    }

    const { result: certificates, error } = this.processResponse(
      responseDictionary,
      () => {
        const array = responseDictionary["data"];
        if (!array) return null;

        const parsedCertificates: ALTCertificate[] = [];
        for (const dictionary of array) {
          const certificate = ALTCertificate.fromResponseDictionary(dictionary);
          if (certificate) parsedCertificates.push(certificate);
        }
        return parsedCertificates;
      },
      (resultCode) => {
        return null; // No specific error handling for now
      }
    );

    return { certificates, error };
  }

  async addCertificateWithMachineName(
    machineName: string,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ certificate: ALTCertificate | null; error: Error | null }> {
    // ALTCertificateRequest is not yet implemented, so this will be a placeholder.
    // In a real scenario, you would generate a CSR here.
    const dummyCSR = "dummy_csr_content";
    const dummyPrivateKey = Buffer.from("dummy_private_key");

    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/submitDevelopmentCSR.action`,
      {
        csrContent: dummyCSR,
        machineId: Math.random().toString(36).substring(2).toUpperCase(),
        machineName: machineName,
      },
      session,
      team
    );

    if (responseDictionary === null) {
      return { certificate: null, error: requestError };
    }

    const { result: certificate, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["certRequest"];
        if (!dictionary) return null;
        const cert = ALTCertificate.fromResponseDictionary(dictionary);
        if (cert) {
          cert.privateKey = dummyPrivateKey; // Assign the dummy private key
        }
        return cert;
      },
      (resultCode) => {
        switch (resultCode) {
          case 3250:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.InvalidCertificateRequest
              )
            );
          default:
            return null;
        }
      }
    );

    return { certificate, error };
  }

  async revokeCertificate(
    certificate: ALTCertificate,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ success: boolean; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.servicesBaseURL}certificates/${certificate.identifier}`,
      null,
      session,
      team,
      true
    );

    if (responseDictionary === null) {
      return { success: false, error: requestError };
    }

    const { result, error } = this.processResponse(
      responseDictionary,
      () => responseDictionary, // Just return the dictionary if successful
      (resultCode) => {
        switch (resultCode) {
          case 7252:
            return null; // Success, but no specific object to parse
          default:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.CertificateDoesNotExist
              )
            );
        }
      }
    );

    return { success: result !== null, error };
  }

  async fetchAppIDsForTeam(
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ appIDs: ALTAppID[] | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/listAppIds.action`,
      null,
      session,
      team
    );

    if (responseDictionary === null) {
      return { appIDs: null, error: requestError };
    }

    const { result: appIDs, error } = this.processResponse(
      responseDictionary,
      () => {
        const array = responseDictionary["appIds"];
        if (!array) return null;

        const parsedAppIDs: ALTAppID[] = [];
        for (const dictionary of array) {
          const appID = ALTAppID.fromResponseDictionary(dictionary);
          if (appID) parsedAppIDs.push(appID);
        }
        return parsedAppIDs;
      },
      (resultCode) => {
        return null; // No specific error handling for now
      }
    );

    return { appIDs, error };
  }

  async addAppIDWithName(
    name: string,
    bundleIdentifier: string,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ appID: ALTAppID | null; error: Error | null }> {
    const sanitizedName = name.replace(/[^a-zA-Z0-9\s]/g, "");

    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/addAppId.action`,
      { identifier: bundleIdentifier, name: sanitizedName },
      session,
      team
    );

    if (responseDictionary === null) {
      return { appID: null, error: requestError };
    }

    const { result: appID, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["appId"];
        if (!dictionary) return null;
        return ALTAppID.fromResponseDictionary(dictionary);
      },
      (resultCode) => {
        switch (resultCode) {
          case 35:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.InvalidAppIDName)
            );
          case 9120:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.MaximumAppIDLimitReached
              )
            );
          case 9401:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.BundleIdentifierUnavailable
              )
            );
          case 9412:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.InvalidBundleIdentifier
              )
            );
          default:
            return null;
        }
      }
    );

    return { appID, error };
  }

  async updateAppID(
    appID: ALTAppID,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ appID: ALTAppID | null; error: Error | null }> {
    const parameters: { [key: string]: any } = { appIdId: appID.identifier };
    for (const feature in appID.features) {
      parameters[feature] = appID.features[feature];
    }

    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/updateAppId.action`,
      parameters,
      session,
      team
    );

    if (responseDictionary === null) {
      return { appID: null, error: requestError };
    }

    const { result: updatedAppID, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["appId"];
        if (!dictionary) return null;
        return ALTAppID.fromResponseDictionary(dictionary);
      },
      (resultCode) => {
        switch (resultCode) {
          case 35:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.InvalidAppIDName)
            );
          case 9100:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.AppIDDoesNotExist)
            );
          case 9412:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.InvalidBundleIdentifier
              )
            );
          default:
            return null;
        }
      }
    );

    return { appID: updatedAppID, error };
  }

  async deleteAppID(
    appID: ALTAppID,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ success: boolean; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/deleteAppId.action`,
      { appIdId: appID.identifier },
      session,
      team
    );

    if (responseDictionary === null) {
      return { success: false, error: requestError };
    }

    const { result, error } = this.processResponse(
      responseDictionary,
      () => {
        const resultCode = responseDictionary["resultCode"];
        return resultCode === 0 ? true : null;
      },
      (resultCode) => {
        switch (resultCode) {
          case 9100:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.AppIDDoesNotExist)
            );
          default:
            return null;
        }
      }
    );

    return { success: result !== null, error };
  }

  async fetchAppGroupsForTeam(
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ groups: ALTAppGroup[] | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/listApplicationGroups.action`,
      null,
      session,
      team
    );

    if (responseDictionary === null) {
      return { groups: null, error: requestError };
    }

    const { result: groups, error } = this.processResponse(
      responseDictionary,
      () => {
        const array = responseDictionary["applicationGroupList"];
        if (!array) return null;

        const parsedGroups: ALTAppGroup[] = [];
        for (const dictionary of array) {
          const group = new ALTAppGroup(dictionary);
          parsedGroups.push(group);
        }
        return parsedGroups;
      },
      (resultCode) => {
        return null; // No specific error handling for now
      }
    );

    return { groups, error };
  }

  async addAppGroupWithName(
    name: string,
    groupIdentifier: string,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ group: ALTAppGroup | null; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/addApplicationGroup.action`,
      { identifier: groupIdentifier, name: name },
      session,
      team
    );

    if (responseDictionary === null) {
      return { group: null, error: requestError };
    }

    const { result: group, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["applicationGroup"];
        if (!dictionary) return null;
        return new ALTAppGroup(dictionary);
      },
      (resultCode) => {
        switch (resultCode) {
          case 35:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.InvalidAppGroup)
            );
          default:
            return null;
        }
      }
    );

    return { group, error };
  }

  async assignAppID(
    appID: ALTAppID,
    groups: ALTAppGroup[],
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ success: boolean; error: Error | null }> {
    const groupIDs = groups.map((group) => group.identifier);

    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/assignApplicationGroupToAppId.action`,
      { appIdId: appID.identifier, applicationGroups: groupIDs },
      session,
      team
    );

    if (responseDictionary === null) {
      return { success: false, error: requestError };
    }

    const { result, error } = this.processResponse(
      responseDictionary,
      () => {
        const resultCode = responseDictionary["resultCode"];
        return resultCode === 0 ? true : null;
      },
      (resultCode) => {
        switch (resultCode) {
          case 9115:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.AppIDDoesNotExist)
            );
          case 35:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.AppGroupDoesNotExist)
            );
          default:
            return null;
        }
      }
    );

    return { success: result !== null, error };
  }

  async fetchProvisioningProfileForAppID(
    appID: ALTAppID,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{
    provisioningProfile: ALTProvisioningProfile | null;
    error: Error | null;
  }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/downloadTeamProvisioningProfile.action`,
      { appIdId: appID.identifier },
      session,
      team
    );

    if (responseDictionary === null) {
      return { provisioningProfile: null, error: requestError };
    }

    const { result: provisioningProfile, error } = this.processResponse(
      responseDictionary,
      () => {
        const dictionary = responseDictionary["provisioningProfile"];
        if (!dictionary) return null;
        return ALTProvisioningProfile.fromResponseDictionary(dictionary);
      },
      (resultCode) => {
        switch (resultCode) {
          case 8201:
            return new Error(
              getALTAppleAPIErrorMessage(ALTAppleAPIError.AppIDDoesNotExist)
            );
          default:
            return null;
        }
      }
    );

    return { provisioningProfile, error };
  }

  async deleteProvisioningProfile(
    provisioningProfile: ALTProvisioningProfile,
    team: ALTTeam,
    session: ALTAppleAPISession
  ): Promise<{ success: boolean; error: Error | null }> {
    const { responseDictionary, error: requestError } = await this.sendRequest(
      `${this.baseURL}ios/deleteProvisioningProfile.action`,
      {
        provisioningProfileId: provisioningProfile.identifier,
        teamId: team.identifier,
      },
      session,
      team
    );

    if (responseDictionary === null) {
      return { success: false, error: requestError };
    }

    const { result, error } = this.processResponse(
      responseDictionary,
      () => {
        const resultCode = responseDictionary["resultCode"];
        return resultCode === 0 ? true : null;
      },
      (resultCode) => {
        switch (resultCode) {
          case 35:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.InvalidProvisioningProfileIdentifier
              )
            );
          case 8101:
            return new Error(
              getALTAppleAPIErrorMessage(
                ALTAppleAPIError.ProvisioningProfileDoesNotExist
              )
            );
          default:
            return null;
        }
      }
    );

    return { success: result !== null, error };
  }
}
