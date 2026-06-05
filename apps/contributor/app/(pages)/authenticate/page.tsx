/* eslint-disable @next/next/no-img-element */
"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { ErrorResponse } from "@devasign/shared/models/_global";
import { UserDto } from "@/app/models/user.model";
import { UserAPI } from "@/app/services/user.service";
import useUserStore from "@/app/state-management/useUserStore";
import { ROUTES, FEATURE_GATES } from "@/app/utils/data";
import { handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";
import { useCustomSearchParams } from "@devasign/shared/hooks";
import { auth, getCurrentUser, githubProvider, useAuthenticatedUserCheck } from "@/lib/firebase";
import { signInWithPopup, getAdditionalUserInfo } from "@firebase/auth";
import { useRequest, useLockFn } from "ahooks";
import { useFeatureGate } from "@statsig/react-bindings";
import { FaGithub } from "react-icons/fa6";
import { toast } from "react-toastify";
import { TbBrowser } from "react-icons/tb";

/**
 * Authentication landing page — entry point for all contributor sign-ins.
 *
 * Uses Firebase's GitHub OAuth provider. After a successful sign-in the
 * page attempts to fetch the contributor's record from the DeVAsign API.
 * If the user doesn't exist yet (NOT_FOUND), it automatically triggers
 * account creation using the GitHub username.
 *
 * Post-auth routing logic:
 * - If a `taskId` query param is present, the user is forwarded to the
 *   bounty application page (or KYC page first, if required).
 * - Otherwise, they land on the tasks dashboard.
 *
 * Already-authenticated users are redirected away by `useAuthenticatedUserCheck`.
 */

const Account = () => {
    const router = useAuthenticatedUserCheck();
    const { searchParams } = useCustomSearchParams();
    const taskId = searchParams.get("taskId");
    const { setCurrentUser } = useUserStore();
    const { value: isKycCheckEnabled } = useFeatureGate(FEATURE_GATES.REQUIRE_KYC);

    /**
     * Determines the post-login redirect based on KYC requirements
     * and whether the user arrived from a specific bounty deep-link.
     *
     * @param requireKyc - If true (and the feature gate is on), redirects
     *                     to the KYC page before allowing access.
     */
    const onUserSuccess = (requireKyc = false) => {
        const shouldRedirectToKyc = isKycCheckEnabled && requireKyc;

        if (!taskId) {
            return shouldRedirectToKyc
                ? router.push(ROUTES.COMPLETE_KYC)
                : router.push(ROUTES.TASKS);
        }

        if (shouldRedirectToKyc) {
            router.push(`${ROUTES.COMPLETE_KYC}?taskId=${taskId}`);
            return;
        }

        router.push(`${ROUTES.APPLICATION}?taskId=${taskId}`);
    };

    /** Syncs the API user data into the Zustand store, merging in the Firebase email. */
    const updateUserState = async (userData: UserDto, username: string) => {
        const firebaseUser = await getCurrentUser();
        setCurrentUser({ ...userData, username, email: firebaseUser?.email });
    };

    /**
     * Auto-creates a new contributor account if the user doesn't exist
     * in the API yet. Triggered as a fallback from `getUser` on NOT_FOUND.
     * Uses `useLockFn` to prevent duplicate creation requests.
     */
    const { loading: creatingUser, run: createUser } = useRequest(
        useLockFn((githubUsername: string) => UserAPI.createUser({ githubUsername })),
        {
            manual: true,
            onSuccess: async (response, params) => {
                if (!response) {
                    toast.error("Failed to create user.");
                    return;
                }

                handleApiSuccessResponse(response);
                await updateUserState(response.data, params[0]);
                onUserSuccess(true);
            },
            onError: (error: unknown) => {
                handleApiErrorResponse(
                    error,
                    "Failed to create user. Please try again."
                );
            }
        }
    );

    /**
     * Fetches the existing contributor record. The response can be either
     * a bare UserDto or a wrapper containing `{ user, walletStatus }` depending
     * on whether the user's Stellar wallet has been provisioned.
     *
     * On NOT_FOUND, falls through to `createUser` so that first-time
     * contributors are auto-registered after GitHub OAuth.
     */
    const { loading: fetchingUser, run: getUser } = useRequest(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        useLockFn((githubUsername: string) => UserAPI.getUser()),
        {
            manual: true,
            cacheKey: "user-object",
            onSuccess: async (response, params) => {
                if (!response) {
                    toast.error("Failed to fetch user.");
                    return;
                }

                // Handle both response shapes: with and without walletStatus wrapper
                if ("walletStatus" in response.data) {
                    await updateUserState(response.data.user, params[0]);
                    onUserSuccess(!response.data.user.verified);
                } else {
                    await updateUserState(response.data, params[0]);
                    onUserSuccess(!response.data.verified);
                }
            },
            onError: (err, params) => {
                const error = err as unknown as ErrorResponse;
                // First-time user — create their account automatically
                if (error.code === "NOT_FOUND") {
                    createUser(params[0]);
                } else {
                    handleApiErrorResponse(
                        error,
                        "Failed to fetch user. Please try again."
                    );
                }
            }
        }
    );

    /**
     * Opens the GitHub OAuth popup via Firebase and extracts the GitHub
     * username from the additional user info. The username is then used
     * as the lookup/creation key for the DeVAsign backend.
     */
    const handleGitHubAuth = async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const additionalInfo = getAdditionalUserInfo(result);
            getUser(additionalInfo!.username!);
        } catch {
            toast.error("GitHub sign-in failed. Please try again.");
        }
    };

    return (
        <main className="h-dvh w-full flex flex-col items-center bg-dark-500 relative overflow-y-auto">
            <div className="desktop-only">
                {/* Background Glow */}
                <div className="absolute top-[292px] left-1/2 -translate-x-1/2 w-[1028px] 
                    h-[495px] bg-primary-100 opacity-10 pointer-events-none blur-[250px]"
                />

                <div className="z-10 flex flex-col items-center w-full max-w-[800px] px-5 pt-[80px] sm:pt-[150px]">
                    <img 
                        src="/davasign-logo.svg" 
                        alt="DevAsign" 
                        className="h-[25px] w-auto" 
                    />

                    <h1 className="text-display-large text-light-100 my-[30px] text-center">
                        Solve Bounties. Get Paid!
                    </h1>

                    <p className="text-body-medium text-dark-100 text-center mb-10">
                        Ship code on GitHub. The moment your PR is merged, USDC flows <br />
                        directly to your wallet. No invoices. No delays. Pure <br />
                        automation.
                    </p>

                    <ButtonPrimary
                        format="SOLID"
                        text={
                            creatingUser
                                ? "Saving User..."
                                : fetchingUser
                                    ? "Loading User..."
                                    : "Continue with GitHub"
                        }
                        sideItem={<FaGithub />}
                        attributes={{
                            onClick: handleGitHubAuth,
                            disabled: creatingUser || fetchingUser
                        }}
                        extendedClassName="w-[264px] bg-primary-400 mb-[79.5px]"
                    />
                </div>

                <div className="z-10 w-full max-w-[1000px] px-5 pb-10 flex justify-center">
                    <img
                        src="/Auth-Hero-Image.png"
                        alt="Dashboard Preview"
                        className="h-[450px] w-auto object-contain"
                    />
                </div>
            </div>

            <div className="mobile-tablet-only h-full flex flex-col justify-between">
                <img 
                    src="/davasign-logo.svg" 
                    alt="DevAsign" 
                    className="h-[25px] w-auto absolute top-5 left-5" 
                />
                <div className="grow grid place-content-center">
                    <div className="mb-14">
                        <TbBrowser className="text-3xl text-primary-100 mx-auto" />
                        <h2 className="text-body-medium text-light-200 my-5 text-center">
                            Switch to Desktop
                        </h2>
                        <p className="text-body-tiny text-light-100 text-center">
                            DevAsign is only accessible via desktop <br />
                            browsers for now. Tablet and mobile view will <br />
                            be available soon.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Account;
