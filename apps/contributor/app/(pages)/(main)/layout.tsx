/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/app/utils/data";
import { TbBrowser, TbLogout } from "react-icons/tb";
import { useLogoutUser } from "@/lib/firebase";
import useUserStore from "@/app/state-management/useUserStore";

/**
 * Persistent layout shell for all authenticated (main) pages.
 *
 * Responsibilities:
 * - Renders the top bar with the logo and the current user's GitHub username.
 * - Conditionally shows the primary navigation tabs. The nav is hidden on
 *   standalone pages (Application, Complete-KYC) that have their own back-flow.
 * - Enforces desktop-only access: on tablet/mobile viewports the entire child
 *   content is replaced by a "Switch to Desktop" prompt, using CSS-driven
 *   `desktop-only` / `mobile-tablet-only` utility classes.
 */

export default function MainLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { currentUser } = useUserStore();
    const logoutUser = useLogoutUser();
    const currentPath = usePathname();
    /** Checks if the given path is part of or matches the current route (for active tab styling). */
    const checkPath = (path: string) => currentPath.includes(path) || currentPath === path;

    return (
        <main className="h-full w-full px-[6.75%] flex flex-col">
            <section className="pt-5 flex items-center justify-between">
                <img src="/davasign-logo.svg" alt="DevAsign" className="h-auto w-auto" />
                <div className="flex items-center gap-2.5">
                    <p className="text-headline-small text-light-100">
                        {currentUser?.username}
                    </p>
                    <button title="Logout" onClick={logoutUser}>
                        <TbLogout className="text-2xl text-light-100 hover:text-light-200" />
                    </button>
                </div>
            </section>
            {/* Hide the main nav on pages that exist outside the tab-based navigation flow */}
            {(!currentPath.includes(ROUTES.APPLICATION) && !currentPath.includes(ROUTES.COMPLETE_KYC)) && (
                <nav className="w-full flex items-center gap-[15px] border-b border-dark-200 text-title-large text-dark-200 mt-[15px]">
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
            )}

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
    { name: "Tasks", path: ROUTES.TASKS },
    // { name: "Explorer", path: ROUTES.EXPLORER },
    { name: "Wallet", path: ROUTES.WALLET }
    // { name: "Settings", alias: "/settings", path: ROUTES.SETTINGS },
];
