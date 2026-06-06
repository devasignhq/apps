"use client";
import { auth, getCurrentUser, useUnauthenticatedUserCheck } from "@/lib/firebase";
import { ALLOWED_IDES, ROUTES } from "@/app/utils/data";
import { useAsyncEffect, useLockFn } from "ahooks";
import { InstallationAPI } from "@/app/services/installation.service";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { toast } from "react-toastify";
import { useState } from "react";
import { TbProgress } from "react-icons/tb";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { MdOutlineCancel } from "react-icons/md";
import { handleApiErrorResponse, handleApiSuccessResponse } from "@/app/utils/helper";
import { useCustomSearchParams } from "@devasign/shared/hooks";

/**
 * GitHub App installation callback page.
 *
 * After a maintainer installs (or modifies) the DeVAsign GitHub App,
 * GitHub redirects here with `?installation_id=<id>` in the URL.
 * This page:
 *   1. Validates the user is authenticated (redirects to auth if not,
 *      preserving the installation_id for post-login pickup).
 *   2. Deduplicates — if the installation already exists in the local store,
 *      skips the API call and redirects straight to tasks.
 *   3. Saves the installation via the API. First-time installs route to
 *      onboarding; subsequent installs go to the tasks dashboard.
 *   4. On failure, shows a retry/reinstall prompt.
 */
type ReboundAction = "INSTALL" | "RETRY" | "";

const Installation = () => {
    const router = useUnauthenticatedUserCheck();
    const { searchParams } = useCustomSearchParams();
    const installationId = searchParams.get("installation_id");
    const [isProcessing, setIsProcessing] = useState(true);
    const [reboundAction, setReboundAction] = useState<ReboundAction>("");
    const {
        activeInstallation,
        installationList,
        setActiveInstallation,
        setInstallationList
    } = useInstallationStore();

    /**
     * Handles the redirect to the extension after installation.
     */
    const handleExtensionRedirect = async () => {
        const extensionAuthStr = localStorage.getItem("extensionAuth");
        if (!extensionAuthStr) {
            return false;
        }

        try {
            const extAuth = JSON.parse(extensionAuthStr);

            // Allowlist of supported IDE URL schemes to prevent arbitrary-scheme injection.
            if (typeof extAuth?.ide !== "string" || !ALLOWED_IDES.includes(extAuth.ide)) {
                localStorage.removeItem("extensionAuth");
                return false;
            }

            const refreshToken = auth.currentUser?.refreshToken;
            if (!refreshToken) {
                return false;
            }

            const ideLink = `${extAuth.ide}://devasign.devasign/auth?refreshToken=${encodeURIComponent(refreshToken)}`;

            localStorage.removeItem("extensionAuth");
            localStorage.setItem("ideLink", ideLink);
            router.push(ROUTES.EXTENSION_SUCCESS);
            return true;
        } catch {
            return false;
        }
    };

    /**
     * Save installation data to database
     */
    const saveInstallation = async () => {
        setIsProcessing(true);
        const user = await getCurrentUser();

        if (!installationId) {
            toast.error("Installation ID is missing.");
            setReboundAction("INSTALL");
            setIsProcessing(false);
            return;
        }

        if (!user) {
            router.push(`${ROUTES.ACCOUNT}?installation_id=${installationId}`);
            return;
        }

        // Dedup: skip the API call if this installation is already known
        const existingInstallation = installationList.find((inst) => inst.id === installationId);
        if (existingInstallation) {
            setActiveInstallation(existingInstallation);
            toast.info("Installation already exists.");
            
            // If the user arrived from the extension, construct a deep link to return them
            // to their IDE with their updated authentication and installation data.
            const redirected = await handleExtensionRedirect();
            if (redirected) return;

            router.push(ROUTES.TASKS);
            return;
        }

        try {
            const response = await InstallationAPI.createInstallation({ installationId });
            
            // First installation ever → route to onboarding; otherwise → tasks
            const noCurrentInstallations = !activeInstallation && installationList.length === 0;

            setReboundAction("");
            setActiveInstallation(response.data);
            setInstallationList([...installationList, response.data]);
            handleApiSuccessResponse(response);

            // If the user arrived from the extension, construct a deep link to return them
            // to their IDE with their updated authentication and installation data.
            const redirected = await handleExtensionRedirect();
            if (redirected) return;

            if (noCurrentInstallations) {
                router.push(ROUTES.ONBOARDING);
            } else {
                router.push(ROUTES.TASKS);
            }
        } catch (error) {
            handleApiErrorResponse(
                error,
                "Failed to save installation. Please reload page to try again."
            );
            setReboundAction("RETRY");
        } finally {
            setIsProcessing(false);
        }
    };

    useAsyncEffect(useLockFn(() => saveInstallation()), [router, installationId]);

    return (isProcessing || reboundAction === "") ? (
        <div className="fixed inset-0 z-100 bg-[#0000004D] grid place-content-center backdrop-blur-[14px] pointer-events-none">
            <div className="w-[820px] max-h-[92dvh] p-10 popup-modal relative bg-dark-500 pointer-events-auto">
                <TbProgress className="text-[44px] text-primary-400 mx-auto rotate-loading-slower" />
                <h2 className="text-headline-medium text-light-100 my-2.5 text-center">Saving Installation</h2>
                <p className="text-body-medium text-dark-100 mb-[30px] text-center">
                    Please wait while we save your installation with GitHub.
                </p>
            </div>
        </div>
    ) : (
        <div className="fixed inset-0 z-100 bg-[#0000004D] grid place-content-center backdrop-blur-[14px] pointer-events-none">
            <div className="w-[820px] max-h-[92dvh] p-10 popup-modal relative bg-dark-500 pointer-events-auto">
                <MdOutlineCancel className="text-[44px] text-indicator-500 mx-auto" />
                <h2 className="text-headline-medium text-light-100 my-2.5 text-center">Process Failed</h2>
                <p className="text-body-medium text-dark-100 mb-[30px] text-center">
                    The process was not successful. Please try again.
                </p>
                <ButtonPrimary
                    format="OUTLINE"
                    text={reboundAction === "INSTALL" ? "Reinstall GitHub App" : "Refresh"}
                    attributes={{
                        onClick: () => {
                            if (reboundAction === "INSTALL") {
                                router.push(ROUTES.INSTALLATION.NEW);
                            } else {
                                saveInstallation();
                            }
                        }
                    }}
                    extendedClassName="w-fit mx-auto"
                />
            </div>
        </div>
    );
};

export default Installation;
