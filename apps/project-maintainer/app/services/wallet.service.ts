import { HttpClient } from "@devasign/shared/lib/axiosInstance";
import { ENDPOINTS } from "./_endpoints";
import { AccountRecord } from "../models/horizon.model";
import {
    SwapAssetDto,
    QueryTransactionDto,
    TransactionDto,
    WithdrawAssetDto,
    RecordWalletTopupsResponse
} from "../models/wallet.model";
import { ApiResponse, PaginatedApiResponse } from "@devasign/shared/models/_global";

export class WalletAPI {
    static async getWalletInfo(installationId: string) {
        return HttpClient.get<ApiResponse<AccountRecord>>(
            ENDPOINTS.WALLET.GET_WALLET,
            { params: { installationId } }
        );
    }

    static async withdrawAsset(data: WithdrawAssetDto) {
        return HttpClient.post<ApiResponse<TransactionDto>>(
            ENDPOINTS.WALLET.WITHDRAW,
            data
        );
    }

    static async swapAsset(installationId: string, data: SwapAssetDto) {
        return HttpClient.post<ApiResponse<TransactionDto>>(
            ENDPOINTS.WALLET.SWAP.replace("{installationId}", installationId),
            data
        );
    }

    static async getTransactions(installationId: string, query?: QueryTransactionDto) {
        return HttpClient.get<PaginatedApiResponse<TransactionDto>>(
            ENDPOINTS.WALLET.TRANSACTIONS.replace("{installationId}", installationId),
            { params: query }
        );
    }

    static async recordWalletTopups(installationId: string) {
        return HttpClient.post<ApiResponse<RecordWalletTopupsResponse>>(
            ENDPOINTS.WALLET.RECORD_WALLET_TOPUPS,
            undefined,
            { params: { installationId } }
        );
    }
}
