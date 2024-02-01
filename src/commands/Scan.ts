import {
  IntegrationName,
  IntegrationType,
  ScanStatus,
  ScanType,
  soosLogger,
} from "@soos-io/api-client";
import AnalysisService from "@soos-io/api-client/dist/services/AnalysisService";
import {
  commands,
  Uri,
  workspace,
  window,
  ProgressLocation,
  SecretStorage,
} from "vscode";
import { parseConfig } from "./Configure";
import { version } from "../../package.json";

export function registerScanCommand(secretStorage: SecretStorage) {
  return commands.registerCommand("soos-sca-scan.scan", async (uri: Uri) => {
    const config = await parseConfig(secretStorage);
    if (!config) {
      return;
    }

    const sourceCodePath =
      uri?.fsPath ?? workspace.workspaceFolders?.[0]?.uri.fsPath;

    window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "SOOS SCA Scan",
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {
          console.log("User canceled the long running operation");
        });
        progress.report({ increment: 0, message: "Initializing scan..." });
        try {
          const analysisService = AnalysisService.create(
            config.apiKey,
            config.apiURL
          );

          let projectHash: string | undefined;
          let branchHash: string | undefined;
          let analysisId: string | undefined;
          let scanStatusUrl: string | undefined;
          progress.report({ increment: 25, message: "Creating scan..." });

          const result = await analysisService.setupScan({
            clientId: config.clientId,
            projectName: config.projectName,
            branchName: config.branchName ?? "",
            commitHash: config.commitHash,
            buildVersion: null,
            buildUri: null,
            branchUri: null,
            operatingEnvironment: "",
            integrationName: IntegrationName.VisualStudioCode,
            integrationType: IntegrationType.IDE,
            appVersion: null,
            scriptVersion: version,
            contributingDeveloperAudit: [],
            scanType: ScanType.SCA,
          });

          projectHash = result.projectHash;
          branchHash = result.branchHash;
          analysisId = result.analysisId;
          scanStatusUrl = result.scanStatusUrl;

          soosLogger.logLineSeparator();

          progress.report({
            increment: 25,
            message: "Locating manifests...",
          });

          const manifestFiles = await analysisService.searchManifestFiles({
            clientId: config.clientId,
            projectHash,
            filesToExclude: config.filesToExclude,
            directoriesToExclude: config.directoriesToExclude,
            sourceCodePath: sourceCodePath,
            packageManagers: config.packageManagers,
          });

          if (manifestFiles.length === 0) {
            const errorMessage =
              "No valid manifests found, cannot continue. For more help, please visit https://kb.soos.io/help/error-no-valid-manifests-found";
            await analysisService.updateScanStatus({
              clientId: config.clientId,
              projectHash,
              branchHash,
              scanType: ScanType.SCA,
              analysisId: analysisId,
              status: ScanStatus.Incomplete,
              message: errorMessage,
              scanStatusUrl: result.scanStatusUrl,
            });
          }

          const allUploadsFailed = await analysisService.addManifestFilesToScan(
            {
              clientId: config.clientId,
              projectHash,
              branchHash,
              analysisId: analysisId,
              manifestFiles: manifestFiles,
            }
          );

          if (allUploadsFailed) {
            await analysisService.updateScanStatus({
              clientId: config.clientId,
              projectHash,
              branchHash,
              scanType: ScanType.SCA,
              analysisId: analysisId,
              status: ScanStatus.Incomplete,
              message: `Error uploading manifests.`,
              scanStatusUrl: result.scanStatusUrl,
            });
          }
          progress.report({ increment: 25, message: "Starting Scan..." });

          soosLogger.logLineSeparator();
          await analysisService.startScan({
            clientId: config.clientId,
            projectHash,
            analysisId: result.analysisId,
            scanType: ScanType.SCA,
            scanUrl: result.scanUrl,
          });

          await analysisService.waitForScanToFinish({
            scanStatusUrl: result.scanStatusUrl,
            scanUrl: result.scanUrl,
            scanType: ScanType.SCA,
          });

          progress.report({
            increment: 25,
            message: `Scan finished.`,
          });

          window.showInformationMessage(
            `Scan finished. [Click here to view results](${result.scanUrl})`
          );
        } catch (error) {
          window.showInformationMessage(
            `Error: ${error instanceof Error ? error.message : error}`
          );
        }
      }
    );
  });
}
