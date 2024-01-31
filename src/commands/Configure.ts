import { commands, extensions, window, workspace } from "vscode";
import { GitExtension } from "../git";
import { ensureNonEmptyValue } from "@soos-io/api-client/dist/utilities";

export interface IAnalysisArguments {
  apiKey: string;
  clientId: string;
  projectName: string;
  apiURL: string;
  directoriesToExclude: string[];
  filesToExclude: string[];
  packageManagers?: string[];
  branchName: string | null;
  commitHash: string | null;
}

export async function parseConfig(): Promise<IAnalysisArguments | null> {
  try {
    const config = workspace.getConfiguration("soos-sca-scan");
    const clientId = ensureNonEmptyValue(
      config.get<string>("clientId"),
      "clientId"
    );
    const apiKey = ensureNonEmptyValue(config.get<string>("apiKey"), "apiKey");
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
    window.showErrorMessage(
      `Please configure the extension first. [Configure](command:soos-sca-scan.configure)`
    );
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

export function registerConfigureCommand() {
  return commands.registerCommand("soos-sca-scan.configure", async () => {
    commands.executeCommand("workbench.action.openSettings", {
      query: "soos-sca-scan",
    });
  });
}
