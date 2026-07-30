// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended, // TS 권장 규칙 (any 사용 경고 등)
  prettierConfig,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": "off", // JS용 규칙은 끄고
      "@typescript-eslint/no-unused-vars": "warn", // TS용 규칙으로 대체
    },
  }
);