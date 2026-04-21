"use client";
import ButtonPrimary from "@devasign/shared/components/ButtonPrimary";
import { FiArrowDownRight, FiHelpCircle, FiArrowUpRight } from "react-icons/fi";
import { useInfiniteScroll, useToggle, useUpdateEffect } from "ahooks";
import WithdrawAssetModal from "./modals/WithdrawAssetModal";
import { useStreamAccountBalance } from "@/app/services/horizon.service";
import { formatDateTime, moneyFormat } from "@/app/utils/helper";
import { WalletAPI } from "@/app/services/wallet.service";
import { UserAPI } from "@/app/services/user.service";
import { Data } from "ahooks/lib/useInfiniteScroll/types";
import useUserStore from "@/app/state-management/useUserStore";
import { useUnauthenticatedUserCheck } from "@/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { useFeatureGate } from "@statsig/react-bindings";
import { ROUTES, FEATURE_GATES, isMainnet } from "@/app/utils/data";
import { TransactionCategory } from "@/app/models/wallet.model";
import Tooltip from "@devasign/shared/components/Tooltip";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useEffectOnce } from "@devasign/shared/hooks";
import { useState } from "react";
import { HiOutlineRefresh } from "react-icons/hi";

const Wallet = () => {
    useUnauthenticatedUserCheck();
    const { currentUser, setCurrentUser } = useUserStore();
    const { usdcBalance, manualBalanceCheck } = useStreamAccountBalance(currentUser?.wallet?.address);
    const [openWithdrawAssetModal, { toggle: toggleWithdrawAssetModal }] = useToggle(false);
    const [isInitialPageLoad, setIsInitialPageLoad] = useState(true);
    const { value: isKycCheckEnabled } = useFeatureGate(FEATURE_GATES.REQUIRE_KYC);

    const fetchUser = async () => {
        const response = await UserAPI.getUser();
        if (!response?.data) return;

        const userData = "walletStatus" in response.data
            ? response.data.user
            : response.data;

        setCurrentUser({
            ...userData,
            username: currentUser!.username,
            email: currentUser!.email
        });
    };

    // Fetch user data once on mount
    useEffectOnce(() => { fetchUser(); });

    const {
        data: transactions,
        loading: loadingTransactions,
        loadingMore: loadingMoreTransactions,
        noMore: noMoreTransactions,
        loadMore: loadMoreTransactions,
        reload: reloadTransactions
    } = useInfiniteScroll<Data>(
        async (currentData) => {
            const pageToLoad = currentData ? currentData.pageToLoad + 1 : 1;

            const response = await WalletAPI.getTransactions({
                page: pageToLoad,
                limit: 20,
                sort: "desc"
            });

            if (isInitialPageLoad) setIsInitialPageLoad(false);

            return {
                list: response.data,
                hasMore: response.pagination.hasMore,
                pageToLoad
            };
        },
        { isNoMore: (response) => !response?.hasMore }
    );

    // Reload transactions and fetch user data when USDC balance changes
    // This is needed when user is on wallet page and an active bounty was completed
    useUpdateEffect(() => {
        reloadTransactions();
        fetchUser();
    }, [usdcBalance]);

    return (
        <>
            <div className="w-full max-h-[calc(100dvh-123px)] mx-auto flex pb-5">
                <section className="w-[450px] h-[calc(100dvh-123px)] pt-[30px] border-r border-dark-200 space-y-[30px] overflow-y-auto">
                    <h3 className="text-headline-small text-light-100">My Wallet</h3>

                    <div className="flex items-end justify-between pr-[30px]">
                        <div className="space-y-[5px]">
                            <p className="text-body-tiny text-dark-100">Balance</p>
                            <p className="text-display-large text-primary-400 flex items-center">
                                <Image
                                    src="/formkit_usdc.svg"
                                    alt="$"
                                    width={24}
                                    height={0}
                                    className="h-auto mr-[5px]"
                                />
                                <span>{moneyFormat(usdcBalance).split(".")[0]}</span>
                                <span>.{usdcBalance.split(".")[1] || "00"}</span>
                            </p>
                        </div>
                        <ButtonPrimary
                            format="SOLID"
                            text="Withdraw"
                            sideItem={<FiArrowDownRight />}
                            attributes={{ onClick: toggleWithdrawAssetModal }}
                        />
                    </div>

                    {isKycCheckEnabled ? (
                        <div className="py-[30px] pr-[30px] flex items-center justify-between border-y border-dark-200">
                            <div className="flex items-center gap-2">
                                <p className="text-headline-small text-light-100 font-bold">KYC Status</p>
                                <span className={`px-2 py-1 rounded text-body-small font-medium ${currentUser?.verified
                                    ? "bg-indicator-100/20 text-indicator-100"
                                    : "bg-indicator-500/20 text-indicator-500"
                                }`}>
                                    {currentUser?.verified ? "Verified" : "Not Verified"}
                                </span>
                            </div>
                            {!currentUser?.verified && (
                                <Link
                                    className="flex items-center gap-[5px] text-primary-100 text-button-large font-extrabold hover:text-primary-400"
                                    href={`${ROUTES.COMPLETE_KYC}?prevPage=WALLET`}
                                >
                                    <span>Start KYC</span>
                                    <FiArrowUpRight className="text-[22px]" />
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="h-px w-full bg-dark-200" />
                    )}

                    <h3 className="text-headline-small text-light-100">Rewards</h3>

                    <div className="space-y-5">
                        {/* <div>
                            <div className="h-[8px] w-full bg-dark-200">
                                <div className="h-full bg-indicator-100" style={{ width: `${currentUser?.developerScore ?? 88}%` }}></div>
                            </div>
                            <p className="text-body-medium text-light-100 mt-[7px]">
                                Your developer score:{" "}
                                <span className="text-indicator-100 font-bold">{currentUser?.developerScore ?? 88}/100</span>
                            </p>
                        </div> */}

                        <div className="grid grid-cols-2 gap-y-5 pr-[30px] pb-[30px] border-b border-dark-200">
                            <div>
                                <p className="text-body-tiny text-dark-100 mb-[5px]">Active Tasks</p>
                                <p className="text-display-large text-light-200">{currentUser?.contributionSummary?.activeTasks ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-body-tiny text-dark-100 mb-[5px]">Completed Tasks</p>
                                <p className="text-display-large text-light-200">{currentUser?.contributionSummary?.tasksCompleted ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-body-tiny text-dark-100 mb-[5px]">Total Earnings ($)</p>
                                <p className="text-display-large text-light-200">
                                    {moneyFormat(currentUser?.contributionSummary?.totalEarnings || 0)}
                                </p>
                            </div>
                            {/* <div>
                                <div className="flex items-center gap-[5px] mb-[5px]">
                                    <p className="text-body-tiny text-dark-100">DevAsign Points</p>
                                    <FiHelpCircle className="text-dark-100 text-xs" />
                                </div>
                                <p className="text-display-large text-light-200">{currentUser?.points ?? 2970}</p>
                            </div> */}
                            <div>
                                <div className="flex items-center gap-[5px] mb-[5px]">
                                    <p className="text-body-tiny text-dark-100">Referrals</p>
                                    <Tooltip message="Coming Soon">
                                        <FiHelpCircle className="text-dark-100 text-xs" />
                                    </Tooltip>
                                </div>
                                <p className="text-display-large text-light-200">{currentUser?.referrals ?? 0}</p>
                            </div>
                        </div>

                        {/* <div className="space-y-[15px]">
                            <div className="bg-primary-300 py-[15px] px-2.5 flex items-center justify-between">
                                <p className="text-body-tiny text-primary-400 truncate">
                                    <span className="font-bold text-primary-100">Invite Friends</span> -
                                    contributor.devasign.com/authenticate?refer={currentUser?.username}
                                </p>
                                <button className="text-primary-100 hover:text-primary-400 ml-[7px] shrink-0">
                                    <FiCopy className="text-xl" />
                                </button>
                            </div>

                            <p className="text-body-tiny text-primary-400">
                                For every task you complete, you earn DevAsign points. You can also refer other developers and get <span className="font-bold text-primary-100">50 POINTS</span> per signup.
                            </p>
                        </div> */}
                    </div>
                </section>
                <section className="grow pt-[30px] pl-[30px] flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                        <h1 className="text-headline-large text-light-100 ">Transaction History</h1>
                        {loadingTransactions && !isInitialPageLoad && (
                            <HiOutlineRefresh className="text-2xl text-light-200 animate-spin" />
                        )}
                    </div>
                    {(loadingTransactions && isInitialPageLoad) ? (
                        <div className="flex flex-col my-auto items-center gap-[50px]">
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
                    ) : (transactions?.list || []).length < 1 ? (
                        <div className="flex flex-col my-auto items-center gap-[50px]">
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
                            <thead className="mt-10">
                                <tr className="pb-[7px] border-b border-[#585858] text-table-header text-dark-100 flex gap-5">
                                    <th className="w-[40%]">Transaction Hash</th>
                                    <th className="w-[17.5%]">Amount (USDC)</th>
                                    <th className="w-[17.5%]">Category</th>
                                    <th className="w-[25%]">Time</th>
                                </tr>
                            </thead>
                            <tbody className="grow overflow-y-auto">
                                {transactions?.list?.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5"
                                    >
                                        <td className="w-[40%] text-indicator-200 underline truncate">
                                            <Link
                                                href={`${isMainnet
                                                    ? "https://stellar.expert/explorer/public/tx/"
                                                    : "https://stellar.expert/explorer/testnet/tx/"}${transaction.txHash}`}
                                                target="_blank"
                                            >
                                                {transaction.txHash}
                                            </Link>
                                        </td>
                                        <td className="w-[17.5%]">{moneyFormat(transaction.amount || "")}</td>
                                        <td className="w-[17.5%] text-primary-100">{formatCategory(transaction.category)}</td>
                                        <td className="w-[25%]">{formatDateTime(transaction.doneAt)}</td>
                                    </tr>
                                ))}
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
                            </tbody>
                        </>
                    )}
                </section>
            </div>

            {openWithdrawAssetModal && (
                <WithdrawAssetModal
                    usdcBalance={usdcBalance}
                    toggleModal={toggleWithdrawAssetModal}
                    reloadTransactions={reloadTransactions}
                    manualBalanceCheck={manualBalanceCheck}
                />
            )}
        </>
    );
};

export default Wallet;

const formatCategory = (category: TransactionCategory) => {
    switch (category) {
        case "BOUNTY":
            return "Bounty";
        case "WITHDRAWAL":
            return "Withdrawal";
        default:
            return "Unknown";
    }
};
