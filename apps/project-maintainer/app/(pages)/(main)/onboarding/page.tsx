"use client";
import Image from "next/image";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { FiArrowUpRight } from "react-icons/fi";
import { HiPlus } from "react-icons/hi";
import CreateTaskModal from "@/app/(pages)/(main)/tasks/modals/CreateTaskModal";
import { useToggle } from "ahooks";
import FundWalletModal from "@/app/(pages)/(main)/wallet/modals/FundWalletModal";
import useUserStore from "@/app/state-management/useUserStore";
import { useStreamAccountBalance } from "@/app/services/horizon.service";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import useTaskStore from "@/app/state-management/useTaskStore";
import { moneyFormat } from "@/app/utils/helper";
import { ROUTES } from "@/app/utils/data";
import { useEffect } from "react";
import { useGetInstallationRepositories } from "@/app/utils/hooks";
import { useUnauthenticatedUserCheck } from "@/lib/firebase";
import Link from "next/link";
import Tooltip from "@devasign/shared/components/Tooltip";

/**
 * First-run onboarding wizard for new project maintainers.
 *
 * Guides users through a sequential setup:
 *   1. Connect Project Repository — prompts to install the DeVAsign
 *      GitHub App if no installation exists yet.
 *   2. Fund Wallet — once an installation is connected, shows live
 *      USDC/XLM balances and a "Top Up" button.
 *   3. Create First Bounty — shown as a draft bar with a count of
 *      selected issues. "Create Bounty" is only enabled when the wallet
 *      has a positive USDC balance AND the installation is active.
 *
 * The balance is polled every 10 seconds (via `manualBalanceCheck`) because
 * the Horizon SSE stream can be unreliable during the initial top-up window
 * when the Stellar account may not have been fully funded yet.
 */

const Onboarding = () => {
    const router = useUnauthenticatedUserCheck();
    const { currentUser } = useUserStore();
    const { activeInstallation } = useInstallationStore();
    const { draftTasks } = useTaskStore();
    const {
        xlmBalance,
        usdcBalance,
        manualBalanceCheck
    } = useStreamAccountBalance(
        activeInstallation?.wallet.address,
        activeInstallation?.id
    );
    const [openCreateTaskModal, { toggle: toggleCreateTaskModal }] = useToggle(false);
    const [openFundWalletModal, { toggle: toggleFundWalletModal }] = useToggle(false);

    const {
        repositories: installationRepos,
        loading: loadingInstallationRepos
    } = useGetInstallationRepositories();

    // Poll balance on a 10s interval as a fallback for Horizon SSE,
    // which can miss the first account-creation event for new wallets.
    useEffect(() => {
        const interval = setInterval(() => {
            manualBalanceCheck();
        }, 10000);
        return () => clearInterval(interval);
    }, [manualBalanceCheck]);

    return (
        <>
            <div className="w-[850px] mt-[65px] mx-auto">
                <h1 className="text-display-large text-light-100">
                    Welcome to DevAsign,
                    <span className="text-display-medium text-light-200 font-extralight">
                        {` ${currentUser?.username} `}
                    </span>👋
                </h1>
                <div className="flex gap-[30px] mt-10 mb-[30px]">
                    {!activeInstallation ? (
                        <div className="w-full p-5 border border-primary-200">
                            <h6 className="text-headline-small font-black text-light-200 pb-2.5">Connect Project Repository</h6>
                            <p className="text-body-medium text-dark-100 mb-[30px]">
                                Install DevAsign app in GitHub and select the repositories you want to set bounties on.
                            </p>
                            <ButtonPrimary
                                format="SOLID"
                                text="Install in GitHub"
                                sideItem={<FiArrowUpRight />}
                                attributes={{
                                    onClick: () => window.location.href = ROUTES.INSTALLATION.NEW
                                }}
                                extendedClassName="bg-light-200 hover:bg-light-100"
                            />
                        </div>
                    ) : (
                        <div className="w-full p-5 border border-primary-200">
                            <h6 className="text-headline-small font-black text-light-100 pb-2.5">Fund Wallet</h6>
                            <p className="text-body-medium text-dark-100 mb-[30px]">
                                Top-up wallet to add bounties and manage contributor payouts seamlessly.
                            </p>
                            <div className="flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-[15px]">
                                    <p className="text-light-200">
                                        <span className="text-headline-large">{moneyFormat(usdcBalance).split(".")[0]}</span>
                                        <span className="text-headline-small font-normal">.{usdcBalance.split(".")[1] || "00"} USDC</span>
                                    </p>
                                    <div className="h-10 w-0.5 bg-primary-200" />
                                    <p className="text-primary-400">
                                        <span className="text-headline-large">{moneyFormat(xlmBalance).split(".")[0]}</span>
                                        <span className="text-headline-small font-normal">.{xlmBalance.split(".")[1] || "00"} XLM</span>
                                    </p>
                                </div>
                                <ButtonPrimary
                                    format="SOLID"
                                    text="Top Up"
                                    sideItem={<HiPlus />}
                                    attributes={{ onClick: toggleFundWalletModal }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {activeInstallation ? (
                    <div className="w-full draft-box relative py-[15px] px-5 my-[30px] bg-dark-400 flex items-center justify-between gap-[30px]">
                        <p className="flex items-center gap-[5px] text-title-large text-light-100">
                            <span>Draft: Issues Selected</span>
                            <span className="px-[5px] text-body-medium font-bold text-dark-500 bg-primary-100">
                                {draftTasks.length}
                            </span>
                        </p>
                        <div className="flex items-center gap-[30px]">
                            {/* "Create Bounty" is gated behind positive USDC balance to prevent
                                creating bounties the wallet can't cover */}
                            {Number(usdcBalance) > 0 && (
                                <Tooltip
                                    message="Reinstall or unsuspend DevAsign app on GitHub to create new tasks"
                                    disabled={activeInstallation?.status === "ACTIVE"}
                                >
                                    <button
                                        className="flex items-center gap-[5px] text-primary-100 text-button-large font-extrabold hover:text-light-100"
                                        onClick={toggleCreateTaskModal}
                                        disabled={activeInstallation?.status !== "ACTIVE"}
                                    >
                                        <span>Create Bounty</span>
                                        <HiPlus className="text-2xl" />
                                    </button>
                                </Tooltip>
                            )}
                            <Link
                                className="flex items-center gap-[5px] text-light-200 text-button-large font-extrabold hover:text-light-100"
                                href={ROUTES.TASKS}
                            >
                                <span>Skip</span>
                                <FiArrowUpRight className="text-2xl" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="w-full p-10 border border-primary-200 flex items-center justify-between gap-10 
                        bg-[linear-gradient(130.86deg,rgba(0,26,37,0.5)_15.53%,rgba(163,82,7,0.5)_79.38%)]"
                    >
                        <div className="flex items-center gap-[5px]">
                            <Image
                                src="/davasign-logo.svg"
                                alt="DevAsign"
                                width={50}
                                height={12.5}
                                className="h-[12.5px] w-auto"
                            />
                            <Image
                                src="/x.svg"
                                alt="X"
                                width={10}
                                height={10}
                                className="h-2.5 w-auto"
                            />
                            <Image
                                src="/scf-logo.svg"
                                alt="Stellar Community Fund"
                                width={128}
                                height={32}
                                className="h-[32px] w-auto"
                            />
                        </div>
                        <p className="text-body-tiny text-light-100">
                            Backed by Stellar Community Fund (SCF). We’re the infrastructure
                            powering fair <br /> compensation for open-source contribution.
                        </p>
                    </div>
                )}
            </div>

            {openCreateTaskModal && (
                <CreateTaskModal
                    installationRepos={installationRepos}
                    loadingInstallationRepos={loadingInstallationRepos}
                    toggleModal={toggleCreateTaskModal}
                    onSuccess={() => router.push(ROUTES.TASKS)}
                />
            )}
            {openFundWalletModal && <FundWalletModal toggleModal={toggleFundWalletModal} />}
        </>
    );
};

export default Onboarding;
