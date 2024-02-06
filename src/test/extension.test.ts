import * as vscode from "vscode";
import * as sinon from "sinon";

suite("Extension Test Suite", () => {
  let showInputBoxStub: sinon.SinonStub;
  let showInformationMessageStub: sinon.SinonStub;
  let executeCommandSpy: sinon.SinonSpy;
  let notificationSpy: sinon.SinonSpy;
  let showErrorMessageStub: sinon.SinonStub;

  setup(() => {
    showErrorMessageStub = sinon.stub(vscode.window, "showErrorMessage");
    showInputBoxStub = sinon.stub(vscode.window, "showInputBox");
    showInformationMessageStub = sinon.stub(
      vscode.window,
      "showInformationMessage"
    );

    showInputBoxStub.onFirstCall().resolves("test-client-id");
    showInputBoxStub.onSecondCall().resolves("test-api-key");
    executeCommandSpy = sinon.spy(vscode.commands, "executeCommand");
    notificationSpy = sinon.spy(vscode.window, "withProgress");
  });

  teardown(() => {
    showErrorMessageStub.restore();
    showInputBoxStub.restore();
    showInformationMessageStub.restore();
    executeCommandSpy.restore();
    notificationSpy.restore();
  });

  test("soos-sca-scan.configureSecrets command should save secrets", async () => {
    await vscode.commands.executeCommand("soos-sca-scan.configureSecrets");
    sinon.assert.calledWith(
      showInformationMessageStub,
      "SOOS SCA secrets configured successfully."
    );
  });

  test("soos-sca-scan.clearSecrets command should clear secrets", async () => {
    await vscode.commands.executeCommand("soos-sca-scan.clearSecrets");
    sinon.assert.calledWith(
      showInformationMessageStub,
      "SOOS SCA extension secrets cleared successfully."
    );
  });

  test("soos-sca-scan.scan command should show error if secrets are not set", async () => {
    await vscode.commands.executeCommand("soos-sca-scan.scan");
    sinon.assert.calledWith(
      showErrorMessageStub,
      "Please configure the extension secrets first. [Configure](command:soos-sca-scan.configureSecrets)"
    );
  });

  test("soos-sca-scan.scan command should show error if project name is not set", async () => {
    await vscode.commands.executeCommand("soos-sca-scan.configureSecrets");
    await vscode.workspace
      .getConfiguration("soos-sca-scan")
      .update("projectName", "", true);
    await vscode.commands.executeCommand("soos-sca-scan.scan");
    sinon.assert.calledWithMatch(
      showErrorMessageStub,
      "Please configure the extension first. [Configure](command:soos-sca-scan.configure)"
    );
  });

  test("soos-sca-scan.configure command should open extension settings", async () => {
    await vscode.commands.executeCommand("soos-sca-scan.configure");
    sinon.assert.calledWith(
      executeCommandSpy,
      "workbench.action.openSettings",
      { query: "soos-sca-scan" }
    );
  });

  test("soos-sca-scan.scan command should start if secrets and project name is set", async () => {
    await vscode.commands.executeCommand("soos-sca-scan.configureSecrets");
    await vscode.workspace
      .getConfiguration("soos-sca-scan")
      .update("projectName", "test-project", true);
    await vscode.commands.executeCommand("soos-sca-scan.scan");
    sinon.assert.calledOnce(notificationSpy);
  });
});
