import { ExtensionContext } from "vscode";
import { registerScanCommand } from "./commands/Scan";
import { registerConfigureCommand } from "./commands/Configure";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(registerConfigureCommand());

  context.subscriptions.push(registerScanCommand());
}

export function deactivate() {}
