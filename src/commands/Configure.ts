import { commands, window, workspace } from "vscode";

export interface IAnalysisArguments {
  apiKey: string;
  clientId: string;
  projectName: string;
  apiURL: string;
  directoriesToExclude?: string[];
  filesToExclude?: string[];
  packageManagers?: string[];
}

export function parseConfig(): IAnalysisArguments | null {
  const config = workspace.getConfiguration("soos-sca-scan");
  const clientId = config.get<string>("clientId");
  const apiKey = config.get<string>("apiKey");
  const projectName = config.get<string>("projectName");
  const apiURL = config.get<string>("apiURL");
  const filesToExclude = config.get<string[]>("filesToExclude") ?? [];
  const directoriesToExclude =
    config.get<string[]>("directoriesToExclude") ?? [];
  const packageManagers = config.get<string[]>("packageManagers") ?? [];

  if (!clientId || !apiKey || !projectName || !apiURL) {
    window.showInformationMessage("Please configure the extension first!");
    return null;
  }

  return {
    apiKey,
    clientId,
    projectName,
    apiURL,
    filesToExclude,
    directoriesToExclude,
    packageManagers,
  };
}

export function registerConfigureCommand() {
  return commands.registerCommand("soos-sca-scan.configure", async () => {
    commands.executeCommand("workbench.action.openSettings", {
      query: "soos-sca-scan",
    });
  });
}
