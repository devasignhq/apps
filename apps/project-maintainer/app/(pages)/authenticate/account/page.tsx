"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { ROUTES } from "@/app/utils/data";
import { FaGithub } from "react-icons/fa";
import { UserAPI } from "@/app/services/user.service";
import { useLockFn, useRequest } from "ahooks";
import { toast } from "react-toastify";
import { ErrorResponse } from "@devasign/shared/models/_global";
import useUserStore from "@/app/state-management/useUserStore";
import { auth, getCurrentUser, githubProvider, useAuthenticatedUserCheck } from "@/lib/firebase";
import { signInWithPopup, getAdditionalUserInfo } from "@firebase/auth";
import { handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";
import { useCustomSearchParams } from "@devasign/shared/hooks";

/**
 * Authentication page for project maintainers.
 *
 * Uses Firebase's GitHub OAuth provider. After sign-in the page fetches
 * the user from the DeVAsign API; if NOT_FOUND, it auto-creates the account.
 *
 * Post-auth routing depends on whether the maintainer has existing installations:
 * - Has installations → tasks dashboard
 * - No installations  → onboarding flow
 *
 * If an `installation_id` query param is present (i.e. the user just
 * installed the GitHub App and was redirected here), it's preserved and
 * forwarded to the installation creation page after auth completes.
 */

const Account = () => {
    const router = useAuthenticatedUserCheck();
    const { searchParams } = useCustomSearchParams();
    const installationId = searchParams.get("installation_id");
    const { setCurrentUser } = useUserStore();

    /** If the user arrived via the GitHub App install callback, forward them to save the installation. */
    const getInstallation = () => {
        if (installationId) {
            router.push(`${ROUTES.INSTALLATION.CREATE}?installation_id=${installationId}`);
        }
    };

    /**
     * Auto-creates a new maintainer account. Triggered as a fallback
     * from `getUser` when the API returns NOT_FOUND.
     * New users always land on the onboarding page.
     */
    const { loading: creatingUser, run: createUser } = useRequest(
        useLockFn((githubUsername: string) => UserAPI.createUser({ githubUsername })),
        {
            manual: true,
            onSuccess: async (response, params) => {
                if (!response) {
                    toast.error("Failed to create user. Please try again.");
                    return;
                }

                handleApiSuccessResponse(response);
                const user = await getCurrentUser();
                setCurrentUser({ ...response.data, username: params[0], email: user?.email });
                getInstallation();

                router.push(ROUTES.ONBOARDING);
            },
            onError: (error) => {
                handleApiErrorResponse(error, "Failed to create user.");
            }
        }
    );

    /**
     * Fetches the existing maintainer record. Uses `_count.installations`
     * to decide whether to route to the tasks dashboard (has projects)
     * or the onboarding flow (no projects yet).
     *
     * On NOT_FOUND, falls through to `createUser` to auto-register.
     */
    const { loading: fetchingUser, run: getUser } = useRequest(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        useLockFn((githubUsername: string) => UserAPI.getUser()),
        {
            manual: true,
            onSuccess: async (response, params) => {
                if (!response) {
                    toast.error("Failed to fetch user. Please try again.");
                    return;
                }

                const user = await getCurrentUser();
                setCurrentUser({ ...response.data, username: params[0], email: user?.email });
                getInstallation();

                // Route based on whether the user has connected any repositories
                if (response.data._count && response.data._count.installations > 0) {
                    router.push(ROUTES.TASKS);
                    return;
                }
                router.push(ROUTES.ONBOARDING);
            },
            onError: (err, params) => {
                const error = err as unknown as ErrorResponse;
                // First-time user — auto-create their account
                if (error.code === "NOT_FOUND") {
                    createUser(params[0]);
                    return;
                }
                handleApiErrorResponse(error, "Failed to fetch user.");
            }
        }
    );

    /**
     * Opens the GitHub OAuth popup and extracts the GitHub username
     * from Firebase's additional user info to use as the API lookup key.
     */
    const handleGitHubAuth = async () => {
        try {
            const result = await signInWithPopup(auth, githubProvider);
            const additionalInfo = getAdditionalUserInfo(result);
            // const credential = GithubAuthProvider.credentialFromResult(result);

            getUser(additionalInfo!.username!);
        } catch {
            toast.error("GitHub sign-in failed. Please try again.");
        }
    };

    return (
        <div className="sm:pt-[105px] pt-[80px]">
            <h1 className="text-display-large text-light-100">Get Started</h1>
            <p className="text-body-medium text-dark-100 sm:pt-[42px] pt-6 sm:pb-10 pb-8">
                Login with your GitHub account to access your public  <br className="max-sm:hidden" />
                repositories and import your issues/tasks to DevAsign. After  <br className="max-sm:hidden" />
                importing, you can add bounties and manage contributor  <br className="max-sm:hidden" />
                payouts seamlessly.
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
                extendedClassName="w-[264px]"
            />
        </div>
    );
};

export default Account;
