import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    // msw init が生成するファイル。手動編集・lint対象外
    ignores: ["public/mockServiceWorker.js"],
  },
];
