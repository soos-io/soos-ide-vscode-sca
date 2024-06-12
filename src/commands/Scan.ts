import {
  FileMatchTypeEnum,
  IntegrationName,
  IntegrationType,
  ScanStatus,
  ScanType,
} from "@soos-io/api-client";
import AnalysisService from "@soos-io/api-client/dist/services/AnalysisService";
import { commands, Uri, workspace, window, ProgressLocation, SecretStorage } from "vscode";
import { parseConfig } from "./Configure";
import { version } from "../../package.json";

const convertLinksInTextToMarkdown = (text: string): string => {
  const linkRegex = /(?:https?):\/\/[^\s/$.?#].[^\s]*/gi;
  const markdownText = text.replace(linkRegex, (match) => `[${match}](${match})`);
  return markdownText;
};

const registerScanCommand = (secretStorage: SecretStorage) => {
  return commands.registerCommand("soos-sca-scan.scan", async (uri: Uri) => {
    const scanType = ScanType.SCA;

    const sourceCodePath = uri?.fsPath ?? workspace.workspaceFolders?.[0]?.uri.fsPath;

    const config = await parseConfig(secretStorage, sourceCodePath);
    if (!config) {
      return;
    }

    window.withProgress(
      {
        location: ProgressLocation.Notification,
        title: "SOOS SCA Scan",
        cancellable: true,
      },
      async (progress) => {
        progress.report({ increment: 0, message: "Initializing scan..." });
        try {
          const analysisService = AnalysisService.create(config.apiKey, config.apiURL);

          let projectHash: string | undefined;
          let branchHash: string | undefined;
          let analysisId: string | undefined;

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
            scanType,
          });

          projectHash = result.projectHash;
          branchHash = result.branchHash;
          analysisId = result.analysisId;

          progress.report({
            increment: 25,
            message: "Locating manifests...",
          });

          const manifestsAndHashableFiles = await analysisService.findManifestsAndHashableFiles({
            clientId: config.clientId,
            projectHash,
            filesToExclude: config.filesToExclude,
            directoriesToExclude: config.directoriesToExclude,
            sourceCodePath: sourceCodePath,
            packageManagers: config.packageManagers,
            fileMatchType: config.fileMatchType,
          });

          const manifestFiles = manifestsAndHashableFiles.manifestFiles ?? [];
          const soosHashesManifests = manifestsAndHashableFiles.hashManifests ?? [];

          let errorMessage = null;

          if (config.fileMatchType === FileMatchTypeEnum.Manifest && manifestFiles.length === 0) {
            errorMessage =
              "No valid files found, cannot continue. For more help, please visit https://kb.soos.io/help/error-no-valid-manifests-found";
          }

          if (
            config.fileMatchType === FileMatchTypeEnum.FileHash &&
            soosHashesManifests.length === 0
          ) {
            errorMessage =
              "No valid files to hash were found, cannot continue. For more help, please visit https://kb.soos.io/help/error-no-valid-files-to-hash-found";
          }

          if (
            config.fileMatchType === FileMatchTypeEnum.ManifestAndFileHash &&
            soosHashesManifests.length === 0 &&
            manifestFiles.length === 0
          ) {
            errorMessage =
              "No valid files found, cannot continue. For more help, please visit https://kb.soos.io/help/error-no-valid-manifests-found and https://kb.soos.io/help/error-no-valid-files-to-hash-found";
          }

          if (errorMessage) {
            await analysisService.updateScanStatus({
              clientId: config.clientId,
              projectHash,
              branchHash,
              scanType,
              analysisId: analysisId,
              status: ScanStatus.Incomplete,
              message: errorMessage,
              scanStatusUrl: result.scanStatusUrl,
            });
            window.showErrorMessage(convertLinksInTextToMarkdown(errorMessage));
            return;
          }

          await analysisService.addManifestFilesToScan({
            clientId: config.clientId,
            projectHash,
            branchHash,
            analysisId: analysisId,
            scanType,
            scanStatusUrl: result.scanStatusUrl,
            manifestFiles: manifestFiles,
          });

          progress.report({ increment: 25, message: "Starting Scan..." });

          await analysisService.startScan({
            clientId: config.clientId,
            projectHash,
            analysisId: result.analysisId,
            scanType,
            scanUrl: result.scanUrl,
          });

          await analysisService.waitForScanToFinish({
            scanStatusUrl: result.scanStatusUrl,
            scanUrl: result.scanUrl,
            scanType,
          });

          progress.report({
            increment: 25,
            message: `Scan finished.`,
          });

          const scanStatus = await analysisService.analysisApiClient.getScanStatus({
            scanStatusUrl: result.scanStatusUrl,
          });
          const formattedOutput = analysisService
            .getFinalScanStatusMessage(scanType, scanStatus, result.scanUrl, false)
            .join("\r\n");
          window.showInformationMessage(convertLinksInTextToMarkdown(formattedOutput));
        } catch (error) {
          window.showErrorMessage(
            error instanceof Error && error.message
              ? convertLinksInTextToMarkdown(error.message)
              : `Error: ${error}`,
          );
        }
      },
    );
  });
};

export { registerScanCommand };
