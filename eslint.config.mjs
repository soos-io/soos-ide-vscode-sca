import typescriptParser from "@typescript-eslint/parser";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: "./tsconfig.json",
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "prettier": prettierPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      ...prettierPlugin.configs.recommended.rules,

      "no-console": "error",
      "no-underscore-dangle": "error",
      "prefer-rest-params": "error",
      "no-param-reassign": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "eqeqeq": ["error", "smart"],
      "func-style": ["error", "expression", { allowArrowFunctions: true }],

      "prettier/prettier": ["error", { parser: "typescript" }],

      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/default-param-last": "error",
      "@/no-param-reassign": "error",
      "@/prefer-const": "error",
    },
  },
  {
    ignores: [".vscode/**", "out/**", ".vscode-test/**"],
  },
];
