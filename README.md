# SOOS SCA Visual Studio Code Extension

SOOS is an independent software security company, located in Winooski, VT USA, building security software for your team. [SOOS, Software security, simplified](https://soos.io).

Use SOOS to scan your software for [vulnerabilities](https://app.soos.io/research/vulnerabilities) and [open source license](https://app.soos.io/research/licenses) issues with [SOOS Core SCA](https://soos.io/products/sca). [Generate and ingest SBOMs](https://soos.io/products/sbom-manager). [Export reports](https://kb.soos.io/project-exports-and-reports) to industry standards. Govern your open source dependencies. Run the [SOOS DAST vulnerability scanner](https://soos.io/products/dast) against your web apps or APIs. [Scan your Docker containers](https://soos.io/products/containers) for vulnerabilities. Check your source code for issues with [SAST Analysis](https://soos.io/products/sast).

[Demo SOOS](https://app.soos.io/demo) or [Register for a Free Trial](https://app.soos.io/register).

If you maintain an Open Source project, sign up for the Free as in Beer [SOOS Community Edition](https://soos.io/products/community-edition).

# SOOS Badge Status
[![Dependency Vulnerabilities](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi-hooks.soos.io%2Fapi%2Fshieldsio-badges%3FbadgeType%3DDependencyVulnerabilities%26pid%3Deux32n9vz%26)](https://app.soos.io)
[![Out Of Date Dependencies](https://img.shields.io/endpoint?url=https%3A%2F%2Fapi-hooks.soos.io%2Fapi%2Fshieldsio-badges%3FbadgeType%3DOutOfDateDependencies%26pid%3Deux32n9vz%26)](https://app.soos.io)

# Requirements

- You must have a valid SOOS account. [Register for a Free Trial](https://app.soos.io/register)

# How to use it

1. Configure the secrets using the `Configure SOOS SCA Secrets` command. You will be prompted for your client id and api key, which can both be found on the [integrate page](https://app.soos.io/integrate/sca/) within the SOOS app.

![Configure secrets](./assets/configure_secrets.png)

2. Configure Project Name and additional settings using the `Configure SOOS SCA Scan` command.

![Configure settings](./assets/configure_scan.png)

1. Once settings and secrets have been configured, you have two options to run a scan. You may either open the command palette and type `Run SOOS SCA Scan`, or select the folder directly from the sidebar and click on `Run SOOS SCA Scan`.

## Run a Scan with the Command Palette
![Perform scan from command palette](./assets/run_scan_command_palette.png)

## Run a Scan for a Folder
![Perform scan from menu](./assets/run_scan.png)

# Reference

- [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VS Code extension marketplace.
- [Extension Manifest](https://vscode-docs.readthedocs.io/en/latest/extensionAPI/extension-manifest/)
