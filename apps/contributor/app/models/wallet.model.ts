import { TaskDto } from "./task.model";
import { UserDto } from "./user.model";

export type WithdrawAssetDto = {
    walletAddress: string;
    amount: string;
    memo?: string;
}

export type TransactionDto = {
    id: string;
    txHash: string;
    category: TransactionCategory;
    amount: number;
    doneAt: string;
    taskId: string | null;
    sourceAddress: string | null;
    destinationAddress: string | null;
    asset: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;

    task?: TaskDto | null;
    user?: UserDto;
}

export type AllTransationsDto = Pick<TransactionDto, "id" | "category" | "amount" | "doneAt">
export type BountyTransationsDto = Pick<TransactionDto, "id" | "category" | "amount" | "doneAt" | "task">
export type WithdrawalTransationsDto = Pick<TransactionDto, "id" | "category" | "amount" | "doneAt" | "destinationAddress" | "asset">

export const TRANSACTION_CATEGORY = {
    BOUNTY: "BOUNTY",
    WITHDRAWAL: "WITHDRAWAL"
};

export type TransactionCategory = keyof typeof TRANSACTION_CATEGORY;

export type QueryTransactionDto = {
    page?: number;
    limit?: number;
    sort?: "asc" | "desc";
}
