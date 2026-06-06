export const ROUTES = {
    ACCOUNT: "/authenticate/account",
    EXTENSION_SUCCESS: "/authenticate/extension-success",
    SUBSCRIPTION_PLAN: "/authenticate/subscription-plan",
    ONBOARDING: "/onboarding",
    OVERVIEW: "/overview",
    TASKS: "/tasks",
    // CONTRIBUTORS: "/contributors",
    WALLET: "/wallet",
    SETTINGS: {
        MANAGE_TEAM: "/settings/manage-team",
        PLANS_AND_BILLINGS: "/settings/plans-and-billings"
    },
    INSTALLATION: {
        NEW: "https://github.com/apps/devasign-app/installations/new",
        CREATE: "/installation"
    }
};

export const FEATURE_GATES = {
    REQUIRE_KYC: "require_kyc"
};

/**
 * Allowlist of supported IDE URL schemes for the extension auth redirect.
 * Restricting to known schemes prevents arbitrary-scheme injection from the
 * `extensionAuth` value stored in localStorage. Includes VS Code and its forks.
 */
export const ALLOWED_IDES = [
    "vscode", // Visual Studio Code
    "vscode-insiders", // VS Code Insiders
    "vscodium", // VSCodium (open-source VS Code build)
    "cursor", // Cursor
    "windsurf", // Windsurf (Codeium)
    "antigravity", // Google Antigravity
    "trae", // Trae (ByteDance)
    "positron" // Positron (Posit)
];
