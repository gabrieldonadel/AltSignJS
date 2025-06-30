import { ALTTeam } from "../Model/AppleAPI/ALTTeam";
import { ALTCertificate } from "../Model/AppleAPI/ALTCertificate";
import { ALTProvisioningProfile } from "../Model/AppleAPI/ALTProvisioningProfile";
import { ALTApplication } from "../Model/ALTApplication";
import { NSFileManager } from "../FileManager+Apps";
import { ALTError, AltSignErrorDomain } from "../Errors";
import * as path from "path";
import * as fs from "fs";
import plist from "plist";

export class ALTSigner {
  team: ALTTeam;
  certificate: ALTCertificate;

  constructor(team: ALTTeam, certificate: ALTCertificate) {
    this.team = team;
    this.certificate = certificate;
  }

  async signAppAtURL(
    appURL: string,
    provisioningProfiles: ALTProvisioningProfile[]
  ): Promise<{ success: boolean; error: Error | null }> {
    let ipaPath: string | null = null;
    let appBundlePath: string | null = null;
    const fileManager = new NSFileManager();

    const cleanup = async (success: boolean, error: Error | null) => {
      if (ipaPath) {
        try {
          // Assuming the temporary directory is the parent of ipaPath
          await fs.promises.rm(path.dirname(ipaPath), {
            recursive: true,
            force: true,
          });
        } catch (removeError) {
          console.error(`Failed to clean up after resigning: ${removeError}`);
        }
      }
      return { success, error };
    };

    try {
      if (appURL.toLowerCase().endsWith(".ipa")) {
        ipaPath = appURL;
        const outputDirectory = path.join(
          path.dirname(appURL),
          `${Date.now()}`
        );
        await fs.promises.mkdir(outputDirectory, { recursive: true });

        const unzippedAppBundlePath = await fileManager.unzipAppBundleAtURL(
          appURL,
          outputDirectory
        );
        if (!unzippedAppBundlePath) {
          return cleanup(
            false,
            new Error(
              JSON.stringify({
                domain: AltSignErrorDomain,
                code: ALTError.MissingAppBundle,
              })
            )
          );
        }
        appBundlePath = unzippedAppBundlePath;
      } else {
        appBundlePath = appURL;
      }

      if (!appBundlePath) {
        return cleanup(
          false,
          new Error(
            JSON.stringify({
              domain: AltSignErrorDomain,
              code: ALTError.InvalidApp,
            })
          )
        );
      }

      const application = new ALTApplication(appBundlePath);

      const profileForApp = (
        app: ALTApplication
      ): ALTProvisioningProfile | undefined => {
        for (const profile of provisioningProfiles) {
          if (profile.bundleIdentifier === app.bundleIdentifier) {
            return profile;
          }
        }
        return undefined;
      };

      const entitlementsByFileURL: { [key: string]: string } = {};

      const prepareApp = async (app: ALTApplication): Promise<Error | null> => {
        const profile = profileForApp(app);
        if (!profile) {
          return new Error(
            JSON.stringify({
              domain: AltSignErrorDomain,
              code: ALTError.MissingProvisioningProfile,
            })
          );
        }

        const profileURL = path.join(app.fileURL, "embedded.mobileprovision");
        await fs.promises.writeFile(profileURL, profile.data);

        // Placeholder for entitlements processing. In a real scenario, you'd parse and modify entitlements.
        // For now, we'll just use the profile's entitlements.
        const entitlementsData = plist.build(profile.entitlements);
        entitlementsByFileURL[app.fileURL] = entitlementsData;

        return null;
      };

      let prepareError: Error | null = await prepareApp(application);
      if (prepareError) {
        return cleanup(false, prepareError);
      }

      for (const appExtension of application.appExtensions) {
        prepareError = await prepareApp(appExtension);
        if (prepareError) {
          return cleanup(false, prepareError);
        }
      }

      // --- Placeholder for actual signing process ---
      // This is where you would integrate with a native module or external binary like ldid.
      // For demonstration, we'll just simulate success.
      console.log(
        `Simulating signing for ${appBundlePath} with certificate ${this.certificate.name}`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate work
      console.log("Signing simulated successfully.");
      // --- End Placeholder ---

      if (ipaPath) {
        const resignedIPAURL = await fileManager.zipAppBundleAtURL(
          appBundlePath
        );
        if (!resignedIPAURL) {
          return cleanup(false, new Error("Failed to re-zip app bundle."));
        }
        await fs.promises.rename(resignedIPAURL, ipaPath);
      }

      return cleanup(true, null);
    } catch (error: any) {
      return cleanup(false, error);
    }
  }
}
