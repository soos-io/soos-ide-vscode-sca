import { ExtensionContext } from "vscode";
import { registerScanCommand } from "./commands/Scan";
import {
  registerClearSecretsCommand,
  registerConfigureSecretsCommand,
} from "./commands/ConfigureSecrets";
import { registerConfigureCommand } from "./commands/Configure";

const activate = (context: ExtensionContext) => {
  context.subscriptions.push(registerConfigureCommand());

  context.subscriptions.push(registerConfigureSecretsCommand(context.secrets));

  context.subscriptions.push(registerClearSecretsCommand(context.secrets));

  context.subscriptions.push(registerScanCommand(context.secrets));
};

const deactivate = () => {};

export { activate, deactivate };
