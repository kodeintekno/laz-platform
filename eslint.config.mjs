import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [{
  ignores: ["**/node_modules/**", "**/dist/**"],
}, {
  files: ["**/*.ts", "**/*.tsx"],
  plugins: { "@typescript-eslint": tseslint.plugin, "react-hooks": reactHooks },
  linterOptions: { reportUnusedDisableDirectives: false },
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: {
    "no-debugger": "error",
    "no-dupe-args": "error",
    "no-duplicate-case": "error",
    "no-unreachable": "error",
    "constructor-super": "error",
  },
}];
