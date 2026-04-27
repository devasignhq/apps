/* eslint-disable @next/next/no-img-element */
"use client";
import { useViewPort } from "@devasign/shared/hooks";
import { TbBrowser } from "react-icons/tb";

/**
 * Authentication layout — split-panel design.
 *
 * Desktop (xl+): Left panel (42%) renders the auth form via `children`,
 * right panel (58%) shows the SCF co-branding and tagline. The gradient
 * bg is applied conditionally based on viewport width to avoid rendering
 * issues on very narrow desktop screens.
 *
 * Tablet/Mobile: The entire auth UI is replaced with a "Switch to Desktop"
 * prompt, consistent with the rest of the app's desktop-only enforcement.
 */

export default function AuthLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const viewPortWidth = useViewPort();

    return (
        <main className="h-full w-full">
            <div className="hidden xl:flex h-full w-full">
                <section className={`h-full w-[42%] text-light-100 max-sm:flex max-sm:flex-col 
                    max-sm:justify-between ${viewPortWidth <= 688 ? "auth-gradient" : ""}`}
                >
                    <div className="sm:h-full sm:w-full sm:pl-[16%] max-sm:px-5 pt-5">
                        <img src="/davasign-logo.svg" alt="DevAsign" className="h-auto w-auto" />
                        {children}
                    </div>
                    <div className="sm:hidden pb-[80px]">
                        <div className="flex items-center gap-2.5 justify-center">
                            <img
                                src="/davasign-logo.svg"
                                alt="DevAsign"
                                className="h-auto lg:w-auto w-[100px]"
                            />
                            <img
                                src="/x.svg"
                                alt="X"
                                className="h-auto lg:w-auto w-[10px]"
                            />
                            <img
                                src="/scf-logo.svg"
                                alt="Stellar Community Fund"
                                className="h-auto lg:w-auto sm:w-[130px] w-[115px]"
                            />
                        </div>
                        <p className="sm:text-body-medium text-body-tiny text-light-100 text-center mt-[30px]">
                            Backed by Stellar Community Fund (SCF). <br />
                            We’re the infrastructure powering fair compensation <br />
                            for open-source contribution.
                        </p>
                    </div>
                </section>
                <section className="max-sm:hidden h-full w-[58%] auth-gradient grid place-content-center">
                    <div>
                        <div className="flex items-center gap-2.5 justify-center">
                            <img 
                                src="/davasign-logo.svg" 
                                alt="DevAsign" 
                                className="h-auto lg:w-auto w-[100px]"
                            />
                            <img
                                src="/x.svg"
                                alt="X"
                                className="h-auto lg:w-auto w-[10px]"
                            />
                            <img
                                src="/scf-logo.svg"
                                alt="Stellar Community Fund"
                                className="h-auto lg:w-auto w-[130px]"
                            />
                        </div>
                        <p className="text-body-medium text-light-100 text-center mt-[30px]">
                            Backed by Stellar Community Fund (SCF). <br />
                            We’re the infrastructure powering fair compensation <br className="md:hidden" />
                            for open-source contribution.
                        </p>
                    </div>
                </section>
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
}
