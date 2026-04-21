"use client";
import { ReactNode, useMemo } from "react";
import { LogLevel, StatsigProvider } from "@statsig/react-bindings";
import useUserStore from "./state-management/useUserStore";

export default function Statsig({ children }: { children: ReactNode }) {
    const { currentUser } = useUserStore();
    const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;

    // The user object sent to Statsig
    const user = useMemo(() => ({
        // Only set userID if the user is authentically logged in
        ...(currentUser?.userId ? { userID: currentUser.userId } : {}),
        email: currentUser?.email || undefined,
        custom: {
            username: currentUser?.username,
            hasWallet: !!currentUser?.wallet,
            verified: currentUser?.verified
        }
    }), [currentUser]);

    // If no sdkKey, return children without StatsigProvider
    if (!sdkKey) {
        return <>{children}</>;
    }

    return (
        <StatsigProvider
            sdkKey={sdkKey}
            user={user}
            options={{ logLevel: process.env.NODE_ENV === "development" ? LogLevel.Debug : LogLevel.Error }}
        >
            {children}
        </StatsigProvider>
    );
}
