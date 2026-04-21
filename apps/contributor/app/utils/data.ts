export const ROUTES = {
    AUTHENTICATE: "/authenticate",
    COMPLETE_KYC: "/complete-kyc",
    APPLICATION: "/application",
    TASKS: "/tasks",
    EXPLORER: "/explorer",
    WALLET: "/wallet",
    SETTINGS: "/settings"
};

export const isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public";

export const FEATURE_GATES = {
    REQUIRE_KYC: "require_kyc"
};
