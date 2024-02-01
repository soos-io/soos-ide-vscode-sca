import { ensureNonEmptyValue } from "@soos-io/api-client/dist/utilities";
import { SecretStorage, commands, window } from "vscode";

export function registerConfigureSecretsCommand(secretStorage: SecretStorage) {
  return commands.registerCommand(
    "soos-sca-scan.configureSecrets",
    async () => {
      try {
        const clientId = ensureNonEmptyValue(
          await window.showInputBox({
            prompt: "Enter your SOOS Client ID",
            placeHolder: "Client ID",
          }),
          "clientId"
        );

        const apiKey = ensureNonEmptyValue(
          await window.showInputBox({
            prompt: "Enter your SOOS API Key",
            placeHolder: "API Key",
          }),
          "apiKey"
        );

        secretStorage.store("soos.clientId", clientId);
        secretStorage.store("soos.apiKey", apiKey);
      } catch (error) {
        if (error instanceof Error) {
          window.showErrorMessage(error.message);
        } else {
          window.showErrorMessage(
            "An error occurred while configuring the extension secrets."
          );
        }
      }
    }
  );
}

export function registerClearSecretsCommand(secretStorage: SecretStorage) {
  return commands.registerCommand("soos-sca-scan.clearSecrets", async () => {
    try {
      await secretStorage.delete("soos.clientId");
      await secretStorage.delete("soos.apiKey");

      window.showInformationMessage(
        "SOOS SCA extension secrets cleared successfully."
      );
    } catch (error) {
      if (error instanceof Error) {
        window.showErrorMessage(error.message);
      } else {
        window.showErrorMessage(
          "An error occurred while clearing the extension secrets."
        );
      }
    }
  });
}
