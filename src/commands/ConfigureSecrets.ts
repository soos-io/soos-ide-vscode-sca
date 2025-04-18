import { SecretStorage, commands, window } from "vscode";
import { ensureNonEmptyValue } from "../utilities";

const registerConfigureSecretsCommand = (secretStorage: SecretStorage) => {
  return commands.registerCommand("soos-sca-scan.configureSecrets", async () => {
    try {
      const clientId = ensureNonEmptyValue(
        await window.showInputBox({
          prompt: "Enter your SOOS Client ID",
          placeHolder: "Client ID",
          ignoreFocusOut: true,
          password: true,
        }),
        "clientId",
      );

      const apiKey = ensureNonEmptyValue(
        await window.showInputBox({
          prompt: "Enter your SOOS API Key",
          placeHolder: "API Key",
          ignoreFocusOut: true,
          password: true,
        }),
        "apiKey",
      );

      secretStorage.store("soos.clientId", clientId);
      secretStorage.store("soos.apiKey", apiKey);

      window.showInformationMessage("SOOS SCA secrets configured successfully.");
    } catch (error) {
      window.showErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "An error occurred while configuring the extension secrets.",
      );
    }
  });
};

const registerClearSecretsCommand = (secretStorage: SecretStorage) => {
  return commands.registerCommand("soos-sca-scan.clearSecrets", async () => {
    try {
      await secretStorage.delete("soos.clientId");
      await secretStorage.delete("soos.apiKey");

      window.showInformationMessage("SOOS SCA extension secrets cleared successfully.");
    } catch (error) {
      window.showErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "An error occurred while clearing the extension secrets.",
      );
    }
  });
};

export { registerConfigureSecretsCommand, registerClearSecretsCommand };
