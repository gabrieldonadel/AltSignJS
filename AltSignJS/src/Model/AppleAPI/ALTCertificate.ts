import * as forge from "node-forge";
const ALTCertificatePEMPrefix = "-----BEGIN CERTIFICATE-----";
export class ALTCertificate {
  name: string;
  serialNumber: string;
  identifier?: string;
  machineName?: string;
  machineIdentifier?: string;
  data?: Buffer;
  privateKey?: Buffer;
  constructor(
    name: string,
    serialNumber: string,
    data?: Buffer,
    privateKey?: Buffer,
    identifier?: string,
    machineName?: string,
    machineIdentifier?: string
  ) {
    this.name = name;
    this.serialNumber = serialNumber;
    this.data = data;
    this.privateKey = privateKey;
    this.identifier = identifier;
    this.machineName = machineName;
    this.machineIdentifier = machineIdentifier;
  }
  static fromResponseDictionary(responseDictionary: {
    [key: string]: any;
  }): ALTCertificate | null {
    const identifier = responseDictionary["id"];
    const attributesDictionary =
      responseDictionary["attributes"] ?? responseDictionary;
    let data: Buffer | undefined;
    if (attributesDictionary["certContent"]) {
      data = attributesDictionary["certContent"];
    } else if (attributesDictionary["certificateContent"]) {
      data = Buffer.from(attributesDictionary["certificateContent"], "base64");
    }
    const machineName = attributesDictionary["machineName"];
    const machineIdentifier = attributesDictionary["machineId"];
    if (data) {
      return ALTCertificate.fromData(
        data,
        identifier,
        machineName,
        machineIdentifier
      );
    } else {
      const name = attributesDictionary["name"];
      const serialNumber =
        attributesDictionary["serialNumber"] ??
        attributesDictionary["serialNum"];
      return new ALTCertificate(
        name,
        serialNumber,
        undefined,
        undefined,
        identifier,
        machineName,
        machineIdentifier
      );
    }
  }
  static fromP12Data(
    p12Data: Buffer,
    password?: string
  ): ALTCertificate | null {
    const p12Asn1 = forge.asn1.fromDer(p12Data.toString("binary"));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag];
    const keyBags = p12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!certBag || !keyBag) {
      return null;
    }
    const certificate = certBag[0].cert as forge.pki.Certificate;
    const privateKey = keyBag[0].key as forge.pki.PrivateKey;
    const pem = forge.pki.certificateToPem(certificate);
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const certificateData = Buffer.from(pem);
    const privateKeyData = Buffer.from(privateKeyPem);
    return ALTCertificate.fromData(
      certificateData,
      undefined,
      undefined,
      undefined,
      privateKeyData
    );
  }
  static fromData(
    data: Buffer,
    identifier?: string,
    machineName?: string,
    machineIdentifier?: string,
    privateKey?: Buffer
  ): ALTCertificate | null {
    let pemData = data.toString();
    if (!pemData.startsWith(ALTCertificatePEMPrefix)) {
      const base64Data = data.toString("base64");
      pemData = `${ALTCertificatePEMPrefix}
${base64Data}
-----END CERTIFICATE-----`;
    }
    const certificate = forge.pki.certificateFromPem(pemData);
    const commonName = certificate.subject.getField("CN").value;
    const serialNumber = certificate.serialNumber.replace(/^(0+)/, "");
    if (!commonName || !serialNumber) {
      return null;
    }
    return new ALTCertificate(
      commonName,
      serialNumber,
      Buffer.from(pemData),
      privateKey,
      identifier,
      machineName,
      machineIdentifier
    );
  }
  p12Data(password?: string): Buffer | null {
    if (!this.data || !this.privateKey) {
      return null;
    }
    const certificate = forge.pki.certificateFromPem(this.data.toString());
    const privateKey = forge.pki.privateKeyFromPem(this.privateKey.toString());
    const p12 = forge.pkcs12.toPkcs12Asn1(
      privateKey,
      [certificate],
      password ?? ""
    );
    const der = forge.asn1.toDer(p12).getBytes();
    return Buffer.from(der, "binary");
  }
}
