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

const Account = () => {
    const router = useAuthenticatedUserCheck();
    const { searchParams } = useCustomSearchParams();
    const installationId = searchParams.get("installation_id");
    const { setCurrentUser } = useUserStore();

    const getInstallation = () => {
        if (installationId) {
            router.push(`${ROUTES.INSTALLATION.CREATE}?installation_id=${installationId}`);
        }
    };

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

                if (response.data._count && response.data._count.installations > 0) {
                    router.push(ROUTES.TASKS);
                    return;
                }
                router.push(ROUTES.ONBOARDING);
            },
            onError: (err, params) => {
                const error = err as unknown as ErrorResponse;
                if (error.code === "NOT_FOUND") {
                    createUser(params[0]);
                    return;
                }
                handleApiErrorResponse(error, "Failed to fetch user.");
            }
        }
    );

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
