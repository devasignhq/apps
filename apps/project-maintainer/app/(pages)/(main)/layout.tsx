/* eslint-disable @next/next/no-img-element */
"use client";
import { HiOutlineSelector, HiPlus } from "react-icons/hi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/app/utils/data";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { FaCheck } from "react-icons/fa6";
import { useCustomSearchParams, usePopup } from "@devasign/shared/hooks";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { InstallationAPI } from "@/app/services/installation.service";
import { useRequest } from "ahooks";
import { TbBrowser, TbLogout } from "react-icons/tb";
import { useLogoutUser } from "@/lib/firebase";
import { FiSettings } from "react-icons/fi";
import { openInNewTab } from "@/app/utils/helper";
import { toast } from "react-toastify";

/**
 * Persistent layout shell for all authenticated project-maintainer pages.
 *
 * Responsibilities:
 * - Renders the top bar with logo, active installation name, and a dropdown
 *   switcher for multi-installation accounts (e.g. personal + org installs).
 * - Auto-fetches the full installation list on mount (with retry + cache).
 *   When switching installations, writes `installationChange=true` to the URL
 *   so child pages can detect the change and reload their data.
 * - Conditionally hides the nav tabs on the onboarding page, which has its
 *   own standalone flow.
 * - Enforces desktop-only access on tablet/mobile viewports.
 */

export default function MainLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const logoutUser = useLogoutUser();
    const currentPath = usePathname();
    const checkPath = (path: string) => currentPath.includes(path) || currentPath === path;
    const { menuButtonRef, menuRef, openMenu, toggleMenu } = usePopup();
    const { updateSearchParams } = useCustomSearchParams();
    const { 
        installationList, 
        activeInstallation,
        setInstallationList,
        setActiveInstallation
    } = useInstallationStore();

    /**
     * Fetches all GitHub App installations for the current user.
     * On first load, defaults to the first installation. On subsequent loads,
     * re-selects the previously active installation (by ID) to preserve context.
     */
    const { loading: fetchingInstallations } = useRequest(
        () => InstallationAPI.getInstallations(),
        {
            retryCount: 2,
            cacheKey: "installation-list",
            onSuccess: (response) => {
                if (!response) {
                    toast.error("Failed to fetch installations. Please reload page to try again");
                    return;
                };
                
                setInstallationList(response.data);
                if (!activeInstallation) {
                    setActiveInstallation(response.data[0]);
                } else {
                    // Re-select the same installation with fresh data
                    const mostRecentData = response.data.find(ins => ins.id === activeInstallation.id);
                    setActiveInstallation(mostRecentData!);
                }
            }
        }
    );

    return (
        <main className="h-full w-full px-[6.75%] flex flex-col">
            <section className="pt-5 flex items-center justify-between">
                <img src="/davasign-logo.svg" alt="DevAsign" className="h-auto w-auto" />
                <div className="flex items-center gap-2.5">
                    {activeInstallation && <>
                        <div className="relative">
                            <div className="flex items-center gap-2.5 text-light-100">
                                <span className="flex items-center gap-[15px] text-headline-small">
                                    {activeInstallation.account.login}
                                </span>
                                {activeInstallation.status !== "ACTIVE" && (
                                    <div className="px-2.5 py-[7px] bg-dark-300 text-table-header">
                                        Inactive
                                    </div>
                                )}
                                <button 
                                    ref={menuButtonRef}
                                    onClick={toggleMenu}
                                >
                                    <HiOutlineSelector className="text-2xl text-[#BCBCBC]" />
                                </button>
                            </div>
                            {openMenu && (
                                <div 
                                    ref={menuRef}
                                    className="absolute -left-6 top-[calc(100%+20px)] z-10 w-[250px] p-[15px] 
                                        bg-dark-400 border border-dark-200 shadow-[-20px_4px_40px_0px_#000000]"
                                >
                                    <div className="w-full flex flex-col gap-2.5">
                                        {(fetchingInstallations && installationList.length === 0) ? (
                                            <>
                                                {[...Array(3)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="h-8 w-full bg-dark-300 rounded animate-pulse"
                                                    />
                                                ))}
                                            </>
                                        ) : (
                                            installationList.map((installation) => {
                                                return activeInstallation.id === installation.id ? (
                                                    <button
                                                        key={installation.id}
                                                        className="pb-2.5 flex items-center justify-between gap-2.5 border-b border-dark-200"
                                                    >
                                                        <p className="text-body-medium text-light-100">{installation.account.login}</p>
                                                        <FaCheck className="text-xl text-light-100" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        key={installation.id}
                                                        className="group flex items-center justify-between gap-2.5"
                                                        /* Switching installations injects `installationChange=true`
                                                           into the URL. Child pages watch for this param to reload
                                                           their task lists, transactions, etc. for the new context. */
                                                        onClick={() => {
                                                            setActiveInstallation(installation);
                                                            updateSearchParams({ installationChange: true }, true);
                                                            toggleMenu();
                                                        }}
                                                    >
                                                        <p className="text-body-medium text-dark-100 group-hover:text-light-100">
                                                            {installation.account.login}
                                                        </p>
                                                        <div className={`px-2.5 py-[7px] text-body-small ${installation.status === "ACTIVE" 
                                                            ? "text-dark-500 bg-primary-100" 
                                                            : "text-light-100 bg-dark-300"}` 
                                                        }>
                                                            {installation.status === "ACTIVE" ? "Active" : "Inactive"}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                    <Link href={ROUTES.INSTALLATION.NEW} target="_blank">
                                        <ButtonPrimary
                                            format="OUTLINE"
                                            text="New Installation"
                                            sideItem={<HiPlus />}
                                            attributes={{ type: "button" }}
                                            extendedClassName="w-full mt-[30px]"
                                        />
                                    </Link>
                                </div>
                            )}
                        </div>
                        <button 
                            title="Installation Settings" 
                            onClick={() => openInNewTab(activeInstallation.htmlUrl)}
                        >
                            <FiSettings className="text-2xl text-light-100 hover:text-light-200" />
                        </button>
                    </>}
                    <button title="Logout" onClick={logoutUser}>
                        <TbLogout className="text-2xl text-light-100 hover:text-light-200" />
                    </button>
                </div>
            </section>
            {/* Hide the main nav during the onboarding flow, which has its own standalone UI */}
            {!currentPath.includes(ROUTES.ONBOARDING) && (<>
                <nav className="w-full flex items-center gap-[15px] text-title-large text-dark-200 mt-[15px]">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`px-[5px] py-[20px] ${checkPath(item.path) 
                                ? "text-light-100 border-b border-light-100" 
                                : "hover:text-[#F0C298]"}`
                            }
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <hr className="h-[0.5px] w-full text-dark-200" />
            </>)}

            <section className="desktop-only grow">
                {children}
            </section>

            <div className="mobile-tablet-only grow grid place-content-center">
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
        </main>
    );
}

const navItems = [
    // { name: "Overview", path: ROUTES.OVERVIEW },
    { name: "Tasks", path: ROUTES.TASKS },
    { name: "Wallet", path: ROUTES.WALLET }
    // { name: "Contributors", path: ROUTES.CONTRIBUTORS },
    // { name: "Settings", alias: "/settings", path: ROUTES.SETTINGS.MANAGE_TEAM },
];
