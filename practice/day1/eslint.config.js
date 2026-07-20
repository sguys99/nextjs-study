// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended, // ESLint 권장 규칙 세트
  prettierConfig, // Prettier와 충돌하는 스타일 규칙 끄기
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // console, process 등 Node 전역 인식
      },
    },
    rules: {
      "no-unused-vars": "warn", // 안 쓴 변수는 경고 (학습 중엔 error 대신 warn이 편함)
    },
  },
];
