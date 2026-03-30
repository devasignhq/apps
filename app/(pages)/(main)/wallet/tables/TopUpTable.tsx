"use client";
import { TransactionDto } from "@/app/models/wallet.model";
import { HorizonHelper } from "@/app/services/horizon.service";
import { formatDateTime, moneyFormat } from "@/app/utils/helper";
import Link from "next/link";

type TopUpTableProps = {
    data: TransactionDto[];
    tableFooter?: React.ReactNode;
}

const TopUpTable = ({
    data,
    tableFooter
}: TopUpTableProps) => {
    return (
        <>
            <thead>
                <tr className="pb-[7px] border-b border-[#585858] text-table-header text-dark-100 flex gap-5">
                    <th className="w-[25%]">Source Address</th>
                    <th className="w-[10.5%]">Asset</th>
                    <th className="w-[12%]">Amount</th>
                    <th className="w-[25%]">Transaction Hash</th>
                    <th className="w-[22.5%]">Time</th>
                </tr>
            </thead>
            <tbody className="grow overflow-y-auto">
                {data.map((transaction) => (
                    <tr 
                        key={transaction.id} 
                        className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5"
                    >
                        <td className="w-[25%] text-light-200">{transaction.sourceAddress || "Unknown"}</td>
                        <td className="w-[10.5%]">{transaction.asset || "XLM"}</td>
                        <td className="w-[12%] text-indicator-100">{moneyFormat(transaction.amount)}</td>
                        <td className="w-[25%] text-light-200 underline">
                            <Link
                                href={`${HorizonHelper.isMainnet 
                                    ? "https://stellar.expert/explorer/public/tx/" 
                                    : "https://stellar.expert/explorer/testnet/tx/"}${transaction.txHash}`}
                                target="_blank"
                            >
                                {transaction.txHash}
                            </Link>
                        </td>
                        <td className="w-[22.5%]">{formatDateTime(transaction.doneAt)}</td>
                    </tr>
                ))}
                {tableFooter}
            </tbody>
        </>
    );
};
 
export default TopUpTable;
