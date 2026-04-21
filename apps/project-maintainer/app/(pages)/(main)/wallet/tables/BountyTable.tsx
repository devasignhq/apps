"use client";
import Link from "next/link";
import { TransactionDto } from "@/app/models/wallet.model";
import { formatDateTime, moneyFormat } from "@/app/utils/helper";
import { ROUTES } from "@/app/utils/data";
import { HorizonHelper } from "@/app/services/horizon.service";

type BountyTableProps = {
    data: TransactionDto[];
    tableFooter?: React.ReactNode;
}

const BountyTable = ({
    data,
    tableFooter
}: BountyTableProps) => {
    return (
        <>
            <thead>
                <tr className="pb-[7px] border-b border-[#585858] text-table-header text-dark-100 flex gap-5">
                    <th className="w-[18%]">Task Reference</th>
                    <th className="w-[33%]">Transaction Hash</th>
                    <th className="w-[15%]">Contributor @</th>
                    <th className="w-[10%]">Bounty</th>
                    <th className="w-[18%]">Time</th>
                </tr>
            </thead>
            <tbody className="grow overflow-y-auto">
                {data.map((transaction) => (
                    <tr
                        key={transaction.id}
                        className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5"
                    >
                        <td className="w-[18%]">
                            {transaction.taskId ? (
                                <Link
                                    href={`${ROUTES.TASKS}?taskId=${transaction.taskId}`}
                                    className="py-[5px] px-[7px] bg-[linear-gradient(130.86deg,_rgba(254,137,31,0.175)_15.53%,_rgba(254,137,31,0.075)_79.38%)]"
                                >
                                    {transaction.taskId}
                                </Link>
                            ) : (
                                <span className="py-[5px] px-[7px] bg-[linear-gradient(130.86deg,_rgba(254,137,31,0.175)_15.53%,_rgba(254,137,31,0.075)_79.38%)]">
                                    Task Deleted
                                </span>
                            )}
                        </td>
                        <td className="w-[33%] text-light-200 underline">
                            <Link
                                href={`${HorizonHelper.isMainnet 
                                    ? "https://stellar.expert/explorer/public/tx/" 
                                    : "https://stellar.expert/explorer/testnet/tx/"}${transaction.txHash}`}
                                target="_blank"
                            >
                                {transaction.txHash}
                            </Link>
                        </td>
                        <td className="w-[15%]">{transaction.task?.contributor?.username || "--"}</td>
                        <td className="w-[10%] text-primary-100">
                            {moneyFormat(transaction.amount || "")} USDC
                        </td>
                        <td className="w-[18%]">{formatDateTime(transaction.doneAt)}</td>
                    </tr>
                ))}
                {tableFooter}
            </tbody>
        </>
    );
};

export default BountyTable;
