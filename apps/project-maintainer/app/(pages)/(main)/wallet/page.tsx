"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { useState } from "react";
import Image from "next/image";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiArrowDownRight } from "react-icons/fi";
import { HiOutlineRefresh, HiPlus } from "react-icons/hi";
import { LiaExchangeAltSolid } from "react-icons/lia";
import AllTable from "./tables/AllTable";
import BountyTable from "./tables/BountyTable";
import TopUpTable from "./tables/TopUpTable";
import WithdrawalTable from "./tables/WithdrawalTable";
import SwapTable from "./tables/SwapTable";
import {
    useAsyncEffect,
    useInfiniteScroll,
    useLockFn,
    useToggle,
    useUpdateEffect
} from "ahooks";
import SwapAssetModal from "./modals/SwapAssetModal";
import WithdrawAssetModal from "./modals/WithdrawAssetModal";
import FundWalletModal from "./modals/FundWalletModal";
import { useStreamAccountBalance, HorizonHelper } from "@/app/services/horizon.service";
import useInstallationStore from "@/app/state-management/useInstallationStore";
import { moneyFormat } from "@/app/utils/helper";
import { WalletAPI } from "@/app/services/wallet.service";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import { useUnauthenticatedUserCheck } from "@/lib/firebase";

const Wallet = () => {
    useUnauthenticatedUserCheck();
    const { activeInstallation } = useInstallationStore();
    const {
        xlmBalance,
        usdcBalance,
        manualBalanceCheck
    } = useStreamAccountBalance(
        activeInstallation?.wallet.address,
        activeInstallation?.id
    );
    const [activeTab, setActiveTab] = useState(tabs[0]);
    const [openWithdrawAssetModal, { toggle: toggleWithdrawAssetModal }] = useToggle(false);
    const [openFundWalletModal, { toggle: toggleFundWalletModal }] = useToggle(false);
    const [openSwapAssetModal, { toggle: toggleSwapAssetModal }] = useToggle(false);
    const [isInitialPageLoad, setIsInitialPageLoad] = useState(true);
    const [swapAssetFrom, setSwapAssetFrom] = useState<"XLM" | "USDC">("XLM");

    const handleOpenSwapAssetModal = (from: "XLM" | "USDC") => {
        setSwapAssetFrom(from);
        toggleSwapAssetModal();
    };

    const handleSwapSuccess = () => {
        // Track the swap based on the current swap direction
        const toAsset = swapAssetFrom === "XLM" ? "USDC" : "XLM";
        HorizonHelper.trackSwap(swapAssetFrom, toAsset);
        reloadTransactions();
        manualBalanceCheck();
    };

    const {
        data: installationTransactions,
        loading: loadingTransactions,
        loadingMore: loadingMoreTransactions,
        noMore: noMoreTransactions,
        loadMore: loadMoreTransactions,
        reload: reloadTransactions
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            if (!activeInstallation) {
                return { list: [], pagination: null, pageToLoad: 1 };
            }

            const pageToLoad = currentData ? currentData.pageToLoad + 1 : 1;

            const category = activeTab.enum === "ALL"
                ? ""
                : activeTab.enum === "SWAP"
                    ? "SWAP_XLM,SWAP_USDC"
                    : activeTab.enum;

            const response = await WalletAPI.getTransactions(
                activeInstallation!.id,
                {
                    page: pageToLoad,
                    limit: 20,
                    sort: "desc",
                    ...(category && { categories: category })
                }
            );

            if (isInitialPageLoad) setIsInitialPageLoad(false);

            return {
                list: response.data,
                pagination: response.pagination,
                pageToLoad
            };
        },
        {
            isNoMore: (data) => !data?.pagination?.hasMore,
            reloadDeps: [activeInstallation, activeTab]
        }
    );

    // Record wallet topups on mount
    useAsyncEffect(useLockFn(async () => {
        if (!activeInstallation) return;

        try {
            const { data } = await WalletAPI.recordWalletTopups(activeInstallation.id);

            if (data.processed > 0) {
                reloadTransactions();
            }
        } catch { }
    }), [activeInstallation]);

    // Reload transactions when XLM or USDC balance changes
    useUpdateEffect(() => {
        reloadTransactions();
    }, [xlmBalance, usdcBalance]);

    // Table footer for infinite scroll
    const tableFooter = (
        <>
            {loadingMoreTransactions && (
                <div className="flex justify-center pt-5 pb-2.5">
                    <span className="text-body-medium text-light-100 flex items-center gap-2">
                        <AiOutlineLoading3Quarters className="animate-spin" />
                        Fetching more transactions
                    </span>
                </div>
            )}
            {(!loadingMoreTransactions && !noMoreTransactions) && (
                <div className="flex justify-center">
                    <button
                        className="w-fit mx-auto text-body-medium text-light-200 font-bold hover:text-light-100 pt-5 pb-2.5"
                        onClick={loadMoreTransactions}
                    >
                        Load More
                    </button>
                </div>
            )}
        </>
    );

    return (
        <>
            <div className="w-[80%] max-h-[calc(100dvh-123px)] mx-auto flex flex-col pb-5">
                <section className="w-full space-y-5 mt-[30px] mb-[50px]">
                    <div className="flex items-start justify-between">
                        <h1 className="text-display-small text-light-100">Project Wallet</h1>
                        <div className="flex gap-2.5">
                            <ButtonPrimary
                                format="SOLID"
                                text="Withdraw"
                                sideItem={<FiArrowDownRight />}
                                attributes={{ onClick: toggleWithdrawAssetModal }}
                                extendedClassName="bg-primary-400"
                            />
                            <ButtonPrimary
                                format="SOLID"
                                text="Top Up"
                                sideItem={<HiPlus />}
                                attributes={{ onClick: toggleFundWalletModal }}
                            />
                        </div>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-5">
                        <div className="w-full p-5 border border-primary-200 flex items-start justify-between">
                            <div className="space-y-2.5">
                                <p className="text-body-small text-dark-100">XLM Balance</p>
                                <p className="text-primary-400">
                                    <span className="text-display-large">{moneyFormat(xlmBalance).split(".")[0]}</span>
                                    <span className="text-body-medium">.{xlmBalance.split(".")[1] || "00"} XLM</span>
                                </p>
                            </div>
                            <button
                                className="flex items-center gap-[5px] text-primary-100 text-button-large font-extrabold hover:text-light-100"
                                onClick={() => handleOpenSwapAssetModal("XLM")}
                            >
                                <span>Swap to USDC</span>
                                <LiaExchangeAltSolid className="text-[22px]" />
                            </button>
                        </div>
                        <div className="w-full p-5 border border-dark-200 flex items-start justify-between">
                            <div className="space-y-2.5">
                                <p className="text-body-small text-dark-100">USDC Balance</p>
                                <p className="text-light-100">
                                    <span className="text-display-large">{moneyFormat(usdcBalance).split(".")[0]}</span>
                                    <span className="text-body-medium">.{usdcBalance.split(".")[1] || "00"} USDC</span>
                                </p>
                            </div>
                            <button
                                className="flex items-center gap-[5px] text-primary-100 text-button-large font-extrabold hover:text-light-100"
                                onClick={() => handleOpenSwapAssetModal("USDC")}
                            >
                                <span>Swap to XLM</span>
                                <LiaExchangeAltSolid className="text-[22px]" />
                            </button>
                        </div>
                    </div>
                </section>
                <section>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2.5 mb-[30px]">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.enum}
                                    className={`p-2 px-2.5 text-body-small border ${activeTab.enum === tab.enum
                                        ? "border-transparent bg-light-100 text-dark-500 font-bold"
                                        : "border-dark-100 text-dark-100 hover:text-light-100"}`
                                    }
                                    onClick={() => {
                                        setIsInitialPageLoad(true);
                                        setActiveTab(tab);
                                    }}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </div>
                        {loadingTransactions && !isInitialPageLoad && (
                            <HiOutlineRefresh className="text-2xl text-light-200 animate-spin" />
                        )}
                    </div>
                </section>
                {(loadingTransactions && isInitialPageLoad) ? (
                    <div className="flex flex-col mt-[10%] items-center gap-[50px]">
                        <p className="text-body-medium text-light-100 font-mono">Loading transactions...</p>
                        <Image
                            src="/task-empty-state.svg"
                            alt=""
                            width={0}
                            height={170.5}
                            className="w-auto"
                            priority={true}
                        />
                    </div>
                ) : (installationTransactions?.list || []).length < 1 ? (
                    <div className="flex flex-col mt-[10%] items-center gap-[50px]">
                        <p className="text-body-medium text-light-100 font-mono">No transactions to show</p>
                        <Image
                            src="/task-empty-state.svg"
                            alt=""
                            width={0}
                            height={170.5}
                            className="w-auto"
                            priority={true}
                        />
                    </div>
                ) : (
                    <>
                        {activeTab.enum === "ALL" && (
                            <AllTable
                                data={installationTransactions?.list || []}
                                tableFooter={tableFooter}
                            />
                        )}
                        {activeTab.enum === "BOUNTY" && (
                            <BountyTable
                                data={installationTransactions?.list || []}
                                tableFooter={tableFooter}
                            />
                        )}
                        {activeTab.enum === "TOP_UP" && (
                            <TopUpTable
                                data={installationTransactions?.list || []}
                                tableFooter={tableFooter}
                            />
                        )}
                        {activeTab.enum === "SWAP" && (
                            <SwapTable
                                data={installationTransactions?.list || []}
                                tableFooter={tableFooter}
                            />
                        )}
                        {activeTab.enum === "WITHDRAWAL" && (
                            <WithdrawalTable
                                data={installationTransactions?.list || []}
                                tableFooter={tableFooter}
                            />
                        )}
                    </>
                )}
            </div>

            {openFundWalletModal && <FundWalletModal toggleModal={toggleFundWalletModal} />}
            {openWithdrawAssetModal && (
                <WithdrawAssetModal
                    xlmBalance={xlmBalance}
                    usdcBalance={usdcBalance}
                    toggleModal={toggleWithdrawAssetModal}
                    reloadTransactions={reloadTransactions}
                    manualBalanceCheck={manualBalanceCheck}
                />
            )}
            {openSwapAssetModal && (
                <SwapAssetModal
                    from={swapAssetFrom}
                    xlmBalance={xlmBalance}
                    usdcBalance={usdcBalance}
                    toggleModal={toggleSwapAssetModal}
                    reloadTransactions={handleSwapSuccess}
                />
            )}
        </>
    );
};

export default Wallet;

const tabs = [
    { title: "All", enum: "ALL" },
    { title: "Bounty", enum: "BOUNTY" },
    { title: "Top Up", enum: "TOP_UP" },
    { title: "Swap", enum: "SWAP" },
    { title: "Withdrawal", enum: "WITHDRAWAL" }
];
