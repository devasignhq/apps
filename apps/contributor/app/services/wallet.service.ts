import { HttpClient } from "@devasign/shared/lib/axiosInstance";
import { ENDPOINTS } from "./_endpoints";
import { AccountRecord } from "@devasign/shared/models/horizon.model";
import {
    QueryTransactionDto,
    TransactionDto,
    WithdrawAssetDto
} from "../models/wallet.model";
import { ApiResponse, PaginatedApiResponse } from "@devasign/shared/models/_global";

export class WalletAPI {
    static async getWalletInfo() {
        return HttpClient.get<ApiResponse<AccountRecord>>(
            ENDPOINTS.WALLET.GET_WALLET
        );
    }

    static async withdrawAsset(data: WithdrawAssetDto) {
        return HttpClient.post<ApiResponse<TransactionDto>>(
            ENDPOINTS.WALLET.WITHDRAW,
            { ...data, assetType: "USDC" }
        );
    }

    static async getTransactions(query?: QueryTransactionDto) {
        return HttpClient.get<PaginatedApiResponse<TransactionDto>>(
            ENDPOINTS.WALLET.TRANSACTIONS,
            { params: query }
        );
    }
}
