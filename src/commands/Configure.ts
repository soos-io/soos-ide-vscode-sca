import { SecretStorage, commands, extensions, window, workspace } from "vscode";
import { GitExtension } from "../git";
import { ensureNonEmptyValue } from "@soos-io/api-client/dist/utilities";

export interface IAnalysisArguments {
  apiKey: string;
  clientId: string;
  projectName: string;
  apiURL: string;
  directoriesToExclude: string[];
  filesToExclude: string[];
  packageManagers: string[];
  branchName: string | null;
  commitHash: string | null;
}

export async function parseConfig(
  secretStorage: SecretStorage
): Promise<IAnalysisArguments | null> {
  try {
    const config = workspace.getConfiguration("soos-sca-scan");
    const clientId = ensureNonEmptyValue(
      await secretStorage.get("soos.clientId"),
      "clientId"
    );
    const apiKey = ensureNonEmptyValue(
      await secretStorage.get("soos.apiKey"),
      "apiKey"
    );

    const projectName = ensureNonEmptyValue(
      config.get<string>("projectName"),
      "projectName"
    );
    const apiURL = ensureNonEmptyValue(config.get<string>("apiURL"), "apiURL");
    const filesToExclude = config.get<string[]>("filesToExclude") ?? [];
    const directoriesToExclude =
      config.get<string[]>("directoriesToExclude") ?? [];
    const packageManagers = config.get<string[]>("packageManagers") ?? [];
    const { branchName, commitHash } = await getCurrentBranchAndCommit();

    return {
      apiKey,
      clientId,
      projectName,
      apiURL,
      filesToExclude,
      directoriesToExclude,
      packageManagers,
      branchName,
      commitHash,
    };
  } catch (error) {
    if (error instanceof Error) {
      error.message.includes("apiKey") || error.message.includes("clientId")
        ? window.showErrorMessage(
            `Please configure the extension secrets first. [Configure](command:soos-sca-scan.configureSecrets)`
          )
        : window.showErrorMessage(
            `Please configure the extension first. [Configure](command:soos-sca-scan.configure) 
            ${error.message}`
          );
    } else {
      window.showErrorMessage(
        `Error getting the extension configuration, make sure all configuration is set. [Configure](command:soos-sca-scan.configure)`
      );
    }
  }
  return null;
}

export async function getCurrentBranchAndCommit(): Promise<{
  branchName: string | null;
  commitHash: string | null;
}> {
  const notFound = { branchName: null, commitHash: null };
  const gitExtension = extensions.getExtension<GitExtension>("vscode.git");
  if (!gitExtension || !gitExtension.isActive) {
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
}

const registerConfigureCommand = () => {
  return commands.registerCommand("soos-sca-scan.configure", async () => {
    commands.executeCommand("workbench.action.openSettings", {
      query: "soos-sca-scan",
    });
  });
};

export { registerConfigureCommand };
