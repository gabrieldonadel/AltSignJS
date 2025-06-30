import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import { ALTError, AltSignErrorDomain } from "./Errors";

export class NSFileManager {
  private fileManager: typeof fs;

  constructor() {
    this.fileManager = fs;
  }

  async unzipAppBundleAtURL(
    ipaPath: string,
    destinationDirectory: string
  ): Promise<string | null> {
    try {
      const zip = new AdmZip(ipaPath);
      zip.extractAllTo(destinationDirectory, true);

      const payloadPath = path.join(destinationDirectory, "Payload");
      const contents = await this.fileManager.promises.readdir(payloadPath);

      for (const item of contents) {
        if (item.toLowerCase().endsWith(".app")) {
          const appBundlePath = path.join(payloadPath, item);
          const newAppBundlePath = path.join(destinationDirectory, item);
          await this.fileManager.promises.rename(
            appBundlePath,
            newAppBundlePath
          );
          await this.fileManager.promises.rm(payloadPath, {
            recursive: true,
            force: true,
          });
          return newAppBundlePath;
        }
      }
      throw new Error("Missing app bundle");
    } catch (error: any) {
      if (error.message === "Missing app bundle") {
        throw new Error(
          JSON.stringify({
            domain: AltSignErrorDomain,
            code: ALTError.MissingAppBundle,
            userInfo: { url: ipaPath },
          })
        );
      }
      throw error;
    }
  }

  async zipAppBundleAtURL(appBundlePath: string): Promise<string | null> {
    try {
      const appBundleFilename = path.basename(appBundlePath);
      const appName = appBundleFilename.replace(/\.[^/.]+$/, "");
      const ipaName = `${appName}.ipa`;
      const ipaPath = path.join(path.dirname(appBundlePath), ipaName);

      if (this.fileManager.existsSync(ipaPath)) {
        await this.fileManager.promises.unlink(ipaPath);
      }

      const zip = new AdmZip();

      const payloadPathInZip = "Payload/";
      const appBundlePathInZip = path.join(payloadPathInZip, appBundleFilename);

      zip.addLocalFolder(appBundlePath, appBundlePathInZip);

      zip.writeZip(ipaPath);

      return ipaPath;
    } catch (error) {
      throw error;
    }
  }
}
