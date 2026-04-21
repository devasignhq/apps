"use client";
import { TransactionDto } from "@/app/models/wallet.model";
import { HorizonHelper } from "@/app/services/horizon.service";
import { formatDateTime, moneyFormat } from "@/app/utils/helper";
import Link from "next/link";

type SwapTableProps = {
    data: TransactionDto[];
    tableFooter?: React.ReactNode;
}

const SwapTable = ({
    data,
    tableFooter
}: SwapTableProps) => {
    return (
        <>
            <thead>
                <tr className="pb-[7px] border-b border-[#585858] text-table-header text-dark-100 flex gap-5">
                    <th className="w-[36%]">Transaction Hash</th>
                    <th className="w-[17%]">Asset (From)</th>
                    <th className="w-[17%]">Asset (To)</th>
                    <th className="w-[30%]">Time</th>
                </tr>
            </thead>
            <tbody className="grow overflow-y-auto">
                {data.map((transaction) => (
                    <tr 
                        key={transaction.id} 
                        className="py-3.5 border-b border-dark-300 text-table-content text-light-100 flex items-center gap-5"
                    >
                        <td className="w-[36%] text-light-200 underline">
                            <Link
                                href={`${HorizonHelper.isMainnet 
                                    ? "https://stellar.expert/explorer/public/tx/" 
                                    : "https://stellar.expert/explorer/testnet/tx/"}${transaction.txHash}`}
                                target="_blank"
                            >
                                {transaction.txHash}
                            </Link>
                        </td>
                        <td className="w-[17%] text-indicator-400">
                            {moneyFormat(transaction.fromAmount || "")} {transaction.assetFrom}
                        </td>
                        <td className="w-[17%] text-primary-100">
                            {moneyFormat(transaction.toAmount || "")} {transaction.assetTo}
                        </td>
                        <td className="w-[30%]">{formatDateTime(transaction.doneAt)}</td>
                    </tr>
                ))}
                {tableFooter}
            </tbody>
        </>
    );
};
 
export default SwapTable;
