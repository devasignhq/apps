"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { UserAPI } from "@/app/services/user.service";
import { ROUTES, FEATURE_GATES } from "@/app/utils/data";
import { handleApiErrorResponse } from "@/app/utils/helper";
import { useUnauthenticatedUserCheck } from "@/lib/firebase";
import { useToggle } from "ahooks";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { LuShieldHalf, LuShieldOff } from "react-icons/lu";
import snsWebSdk from "@sumsub/websdk";
import { useCustomSearchParams } from "@devasign/shared/hooks";
import useUserStore from "@/app/state-management/useUserStore";
import { useFeatureGate } from "@statsig/react-bindings";

/**
 * KYC verification page powered by the Sumsub Web SDK.
 *
 * Flow:
 * 1. Gated behind authentication (useUnauthenticatedUserCheck).
 * 2. If the user is already verified OR the KYC feature gate is off,
 *    they are immediately redirected to the appropriate next page.
 * 3. Otherwise, the user can start the Sumsub identity check. The SDK
 *    is rendered inside a modal overlay and communicates results via `onMessage`.
 * 4. On a successful "GREEN" review, the user's verified status is
 *    updated locally and they are navigated forward.
 * 5. Users may skip KYC, but they'll be warned that certain enterprise
 *    bounties will be unavailable without verification.
 *
 * Query params:
 * - `taskId`:   Preserved through the flow so the user lands on the
 *               correct bounty application page afterwards.
 * - `prevPage`: If set, the user returns to that page instead of the
 *               default application/tasks route after verification.
 */
/** Shape of the Sumsub SDK callback payload when `idCheck.onApplicantStatusChanged` fires. */
type SumsubPayload = {
    reviewStatus: string;
    reviewResult: {
        reviewAnswer: string;
    }
}

const Application = () => {
    useUnauthenticatedUserCheck();
    const router = useRouter();
    const { currentUser, setCurrentUser } = useUserStore();
    const { searchParams } = useCustomSearchParams();
    const { value: isKycCheckEnabled } = useFeatureGate(FEATURE_GATES.REQUIRE_KYC);
    const taskId = searchParams.get("taskId");
    const prevPage = searchParams.get("prevPage");
    const [generatingToken, setGeneratingToken] = useState(false);
    const [displaySumsubWebsdk, setDisplaySumsubWebsdk] = useState(false);
    const [openSkipKycModal, { toggle: toggleSkipKycModal }] = useToggle(false);

    /**
     * Determines where to redirect after KYC is complete (or skipped).
     * Priority: prevPage query param > taskId application page > tasks dashboard.
     */
    const handleNavigation = useCallback(() => {
        if (prevPage) {
            const route = ROUTES[prevPage as keyof typeof ROUTES];
            return router.push(`${route || ROUTES.TASKS}${taskId ? `?taskId=${taskId}` : ""}`);
        }

        if (!taskId) {
            return router.push(ROUTES.TASKS);
        }

        router.push(`${ROUTES.APPLICATION}?taskId=${taskId}`);
    }, [prevPage, router, taskId]);

    // Auto-redirect if KYC is already done or the feature gate is off.
    // Prevents verified users from seeing the KYC prompt unnecessarily.
    useEffect(() => {
        if (currentUser?.verified || !isKycCheckEnabled) {
            handleNavigation();
        }
    }, [currentUser, handleNavigation, isKycCheckEnabled]);

    /**
     * Initialises and mounts the Sumsub verification widget.
     * The second argument to `snsWebSdk.init` is a token-refresh callback
     * invoked automatically when the access token expires mid-session.
     *
     * We listen for `idCheck.onApplicantStatusChanged` — the only event
     * that signals a definitive verification outcome. A "GREEN" answer
     * means the check passed.
     */
    const launchWebSdk = (accessToken: string) => {
        const snsWebSdkInstance = snsWebSdk.init(
            accessToken,
            () => UserAPI.generateSumsubToken().then((res) => res.data.token)
        )
            .withConf({
                //language of WebSDK texts and comments (ISO 639-1 format)
                lang: "en"
            })
            .onMessage((type, payload) => {
                if (
                    type.toString() !== "idCheck.onApplicantStatusChanged" &&
                    typeof payload !== "object"
                ) return;

                const sumsubPayload = payload as SumsubPayload;
                if (
                    sumsubPayload?.reviewStatus === "completed" &&
                    sumsubPayload?.reviewResult?.reviewAnswer === "GREEN"
                ) {
                    handleNavigation();
                    setCurrentUser({ ...currentUser!, verified: true });
                }
            })
            .build();

        snsWebSdkInstance.launch("#sumsub-websdk-container");
    };

    /** Requests a server-generated Sumsub access token, then launches the SDK widget. */
    const handleSumsubToken = async () => {
        setGeneratingToken(true);

        try {
            const response = await UserAPI.generateSumsubToken();
            setDisplaySumsubWebsdk(true);
            launchWebSdk(response.data.token);
        } catch (error) {
            handleApiErrorResponse(
                error,
                "Failed to initialize KYC. Please Try again."
            );
        } finally {
            setGeneratingToken(false);
        }
    };

    return (
        <>
            <div className="w-[850px] mt-[65px] mx-auto">
                <h1 className="text-headline-large text-light-100">Verify Your Identity</h1>
                <p className="text-body-medium text-dark-100 mt-[15px] mb-[30px]">
                    Large open-source project need to be certain that bad actors aren’t working on their
                    codebase. Kindly complete the KYC verification to work on such bounties.
                </p>
                <div className="flex items-center gap-2.5">
                    <ButtonPrimary
                        format="SOLID"
                        text={generatingToken ? "Starting..." : "Start KYC Verification"}
                        sideItem={<LuShieldHalf />}
                        attributes={{
                            onClick: handleSumsubToken,
                            disabled: generatingToken
                        }}
                    />
                    <ButtonPrimary
                        format="OUTLINE"
                        text="Skip"
                        sideItem={<FiArrowUpRight />}
                        attributes={{
                            onClick: toggleSkipKycModal,
                            disabled: generatingToken
                        }}
                    />
                </div>
                <div className={`fixed inset-0 z-100 flex items-center justify-center ${displaySumsubWebsdk ? "block" : "hidden"}`}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        id="sumsub-websdk-container"
                        className="relative z-101 w-full max-w-[820px] max-h-[92dvh] overflow-y-auto bg-white rounded-xl"
                    />
                </div>
            </div>

            {openSkipKycModal && (
                <div className="fixed inset-0 z-100 bg-[#0000004D] grid place-content-center backdrop-blur-[14px] pointer-events-none">
                    <div className="w-[820px] max-h-[92dvh] p-10 popup-modal relative bg-dark-500 pointer-events-auto">
                        <LuShieldOff className="text-[44px] text-primary-400 mx-auto" />
                        <h2 className="text-headline-medium text-light-100 my-2.5 text-center">Skip KYC Verification</h2>
                        <p className="text-body-medium text-dark-100 mb-[30px] text-center">
                            If you don’t complete the KYC verification, you won’t be able to work
                            on certain <br /> bounties, especially those from enterprise customers.
                        </p>
                        <div className="w-fit mx-auto flex items-center gap-2 5">
                            <ButtonPrimary
                                format="OUTLINE"
                                text="Go Back"
                                attributes={{ onClick: toggleSkipKycModal }}
                            />
                            <ButtonPrimary
                                format="SOLID"
                                text="Yes, Skip Verification"
                                attributes={{ onClick: handleNavigation }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Application;
