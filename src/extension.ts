import { ExtensionContext } from "vscode";
import { registerScanCommand } from "./commands/Scan";
import { registerConfigureCommand } from "./commands/Configure";
import {
  registerClearSecretsCommand,
  registerConfigureSecretsCommand,
} from "./commands/ConfigureSecrets";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(registerConfigureCommand());

  context.subscriptions.push(registerConfigureSecretsCommand(context.secrets));

  context.subscriptions.push(registerClearSecretsCommand(context.secrets));

  context.subscriptions.push(registerScanCommand(context.secrets));
}

export function deactivate() {}
