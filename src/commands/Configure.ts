import { SecretStorage, commands, extensions, window, workspace } from "vscode";
import { GitExtension } from "../git";
import { ensureEnumValue, ensureNonEmptyValue } from "@soos-io/api-client/dist/utilities";
import * as Path from "path";
import { FileMatchTypeEnum, SOOS_CONSTANTS } from "@soos-io/api-client";

export interface IAnalysisArguments {
  apiKey: string;
  clientId: string;
  projectName: string;
  apiURL: string;
  directoriesToExclude: string[];
  filesToExclude: string[];
  packageManagers: string[];
  fileMatchType: FileMatchTypeEnum;
  branchName: string | null;
  commitHash: string | null;
}

export const parseConfig = async (
  secretStorage: SecretStorage,
  sourceCodePath: string,
): Promise<IAnalysisArguments | null> => {
  try {
    const config = workspace.getConfiguration("soos-sca-scan");
    const clientId = ensureNonEmptyValue(await secretStorage.get("soos.clientId"), "clientId");
    const apiKey = ensureNonEmptyValue(await secretStorage.get("soos.apiKey"), "apiKey");

    const projectName = ensureNonEmptyValue(
      config.get<string>("projectName") && config.get<string>("projectName")?.trim() !== ""
        ? config.get<string>("projectName")
        : Path.basename(sourceCodePath),
      "projectName",
    );
    const apiURL = config.get<string>("apiURL") ?? SOOS_CONSTANTS.Urls.API.Analysis;
    const filesToExclude = config.get<string[]>("filesToExclude") ?? [];
    const directoriesToExclude = config.get<string[]>("directoriesToExclude") ?? [];
    const packageManagers = config.get<string[]>("packageManagers") ?? [];
    const fileMatchType =
      (config.get<string>("fileMatchType")
        ? ensureEnumValue<FileMatchTypeEnum>(FileMatchTypeEnum, config.get<string>("fileMatchType"))
        : undefined) ?? FileMatchTypeEnum.Manifest;
    const { branchName, commitHash } = await getCurrentBranchAndCommit();

    return {
      apiKey,
      clientId,
      projectName,
      apiURL,
      filesToExclude,
      directoriesToExclude,
      packageManagers,
      fileMatchType,
      branchName,
      commitHash,
    };
  } catch (error) {
    if (error instanceof Error && error.message) {
      const message =
        error.message.includes("apiKey") || error.message.includes("clientId")
          ? "Please configure the extension secrets first. [Configure](command:soos-sca-scan.configureSecrets)"
          : `Please configure the extension first. [Configure](command:soos-sca-scan.configure) ${error.message}`;
      window.showErrorMessage(message);
    } else {
      window.showErrorMessage(
        `Error getting the extension configuration, please reconfigure the extension. [Configure](command:soos-sca-scan.configure)`,
      );
    }
  }
  return null;
};

export const getCurrentBranchAndCommit = async (): Promise<{
  branchName: string | null;
  commitHash: string | null;
}> => {
  const notFound = { branchName: null, commitHash: null };
  const gitExtension = extensions.getExtension<GitExtension>("vscode.git");
  if (!gitExtension || !gitExtension.isActive) {
    window.showWarningMessage("Git extension not found or inactive.");
    return notFound;
  }

  const git = gitExtension.exports;
  const repositories = git.getAPI(1).repositories;

  if (repositories.length === 0) {
    return notFound;
  }

  const currentHead = repositories[0].state.HEAD;
  if (!currentHead) {
    return notFound;
  }

  return {
    branchName: currentHead.name ?? null,
    commitHash: currentHead.commit ?? null,
  };
};

const registerConfigureCommand = () => {
  return commands.registerCommand("soos-sca-scan.configure", async () => {
    const commandToExecute = workspace.workspaceFile
      ? "workbench.action.openWorkspaceSettings"
      : "workbench.action.openSettings";
    await commands.executeCommand(commandToExecute, {
      query: "soos-sca-scan",
    });
  });
};

export { registerConfigureCommand };
