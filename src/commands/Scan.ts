import { IntegrationName, IntegrationType, ScanType } from "@soos-io/api-client";
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
    const sourceCodePath = uri?.fsPath ?? workspace.workspaceFolders?.at(0)?.uri.fsPath;
    if (sourceCodePath === undefined) {
      window.showErrorMessage("No workspace available. Please open a folder to run an SCA scan.");
      return;
    }

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

          progress.report({
            increment: 25,
            message: "Locating manifests...",
          });

          const { manifestFiles, hashManifests } =
            await analysisService.findManifestsAndHashableFiles({
              clientId: config.clientId,
              projectHash: result.projectHash,
              filesToExclude: config.filesToExclude,
              directoriesToExclude: config.directoriesToExclude,
              sourceCodePath,
              packageManagers: config.packageManagers,
              fileMatchType: config.fileMatchType,
            });

          const { exitCode, errorMessage } =
            await analysisService.addManifestsAndHashableFilesToScan({
              clientId: config.clientId,
              projectHash: result.projectHash,
              branchHash: result.branchHash,
              analysisId: result.analysisId,
              scanType,
              scanStatusUrl: result.scanStatusUrl,
              fileMatchType: config.fileMatchType,
              manifestFiles,
              hashManifests,
            });
          if (exitCode !== 0) {
            window.showErrorMessage(
              convertLinksInTextToMarkdown(errorMessage ?? "An error occurred."),
            );
            return;
          }

          progress.report({ increment: 25, message: "Running Scan - this may take a minute..." });

          await analysisService.startScan({
            clientId: config.clientId,
            projectHash: result.projectHash,
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
            message: "Scan finished!",
          });

          const scanStatus = await analysisService.analysisApiClient.getScanStatus({
            scanStatusUrl: result.scanStatusUrl,
          });
          const scanStatusMessages = analysisService.getFinalScanStatusMessage(
            scanType,
            scanStatus,
            result.scanUrl,
            false,
          );
          const formattedMessage = convertLinksInTextToMarkdown(
            `${scanStatusMessages.at(0)} ${scanStatusMessages.slice(1).join(", ")}`,
          );
          window.showInformationMessage(formattedMessage);
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
