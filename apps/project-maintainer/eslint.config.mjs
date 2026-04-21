import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            "no-useless-escape": "off",
            "no-case-declarations": "off",
            "no-console": "warn",
            "no-debugger": "error",
            "no-duplicate-imports": "error",
            "no-unused-expressions": "error",
            "prefer-const": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-arrow-callback": "error",
            "prefer-template": "error",
            quotes: ["error", "double", { avoidEscape: true }],
            semi: ["error", "always"],
            "comma-dangle": ["error", "never"],
            "indent": ["error", 4, { SwitchCase: 1 }],
            "max-len": ["warn", { code: 300, ignoreUrls: true }],
            "eol-last": ["error", "always"],

            "@typescript-eslint/no-explicit-any": "error",
            // Configure TypeScript unused vars rule to ignore variables starting with underscore
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_"
                }
            ],
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-empty-object-type": "off"
        }
    },
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
            ".env",
            ".env.*",
            "no_git/",
            "*.log",
            ".git/",
            ".vscode/"
        ]
    }
];

export default eslintConfig;
