import { useState, useEffect, useRef, useCallback } from "react";
import { BalanceLineNative, BalanceLineAsset, AccountRecord, AssetType } from "../models/horizon.model";
import { WalletAPI } from "./wallet.service";

type WalletBalance = BalanceLineNative | BalanceLineAsset;
type USDCBalance = BalanceLineAsset<AssetType.credit4>;

interface StreamState {
    xlmBalance: string;
    usdcBalance: string;
    isConnected: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

interface SwapTracker {
    timestamp: number;
    fromAsset: "XLM" | "USDC";
    toAsset: "XLM" | "USDC";
}

interface PriceData {
    xlmToUsdc: number;
    lastUpdated: Date;
}
// Global swap tracker to prevent recordWalletTopups calls after swaps
let recentSwaps: SwapTracker[] = [];

export class HorizonHelper {
    static isMainnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public";

    static getBaseUrl() {
        return process.env.NEXT_PUBLIC_STELLAR_URL!;
    }

    // Method to track swaps to prevent false topup detection
    static trackSwap(fromAsset: "XLM" | "USDC", toAsset: "XLM" | "USDC") {
        const swapRecord: SwapTracker = {
            timestamp: Date.now(),
            fromAsset,
            toAsset
        };

        recentSwaps.push(swapRecord);

        // Clean up old swap records (older than 30 seconds)
        setTimeout(() => {
            recentSwaps = recentSwaps.filter(swap =>
                Date.now() - swap.timestamp < 30000
            );
        }, 30000);
    }

    // Check if a balance change might be from a recent swap
    static isRecentSwap(asset: "XLM" | "USDC", isIncrease: boolean): boolean {
        const now = Date.now();
        return recentSwaps.some(swap => {
            const isRecent = now - swap.timestamp < 30000; // 30 seconds
            const isTargetAsset = swap.toAsset === asset && isIncrease;
            return isRecent && isTargetAsset;
        });
    }
}

export function useStreamAccountBalance(
    walletAddress: string | undefined,
    installationId?: string
) {
    const [state, setState] = useState<StreamState>({
        xlmBalance: "0.00",
        usdcBalance: "0.00",
        isConnected: false,
        error: null,
        lastUpdated: null
    });

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const previousBalances = useRef<{ xlm: number; usdc: number } | null>(null);

    const updateBalances = useCallback(async (balances: WalletBalance[]) => {
        const newXlmBalance = parseFloat(
            balances.find(balance => balance.asset_type === "native")?.balance || "0"
        );

        const newUsdcBalance = parseFloat(
            balances.find(
                (balance) => (balance as USDCBalance).asset_code === "USDC"
            )?.balance || "0"
        );

        // Check for balance increases that might indicate topups
        if (previousBalances.current && installationId) {
            const xlmIncrease = newXlmBalance > previousBalances.current.xlm;
            const usdcIncrease = newUsdcBalance > previousBalances.current.usdc;

            // Only call recordWalletTopups if there's an increase and it's not from a recent swap
            if (xlmIncrease && !HorizonHelper.isRecentSwap("XLM", true)) {
                try {
                    await WalletAPI.recordWalletTopups(installationId);
                } catch {}
            } else if (usdcIncrease && !HorizonHelper.isRecentSwap("USDC", true)) {
                try {
                    await WalletAPI.recordWalletTopups(installationId);
                } catch {}
            }
        }

        // Update previous balances for next comparison
        previousBalances.current = { xlm: newXlmBalance, usdc: newUsdcBalance };

        setState(prev => ({
            ...prev,
            xlmBalance: (newXlmBalance - 1).toFixed(2),
            usdcBalance: newUsdcBalance.toFixed(2),
            lastUpdated: new Date(),
            error: null
        }));
    }, [installationId]);

    useEffect(() => {
        if (!walletAddress) {
            setState({
                xlmBalance: "0.00",
                usdcBalance: "0.00",
                isConnected: false,
                error: null,
                lastUpdated: null
            });
            return;
        }

        const maxReconnectAttempts = 5;
        const reconnectDelay = 3000;

        function cleanup() {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        }

        function connect() {
            cleanup();

            try {
                const baseUrl = HorizonHelper.getBaseUrl();
                const eventSource = new EventSource(`${baseUrl}/accounts/${walletAddress}`);
                eventSourceRef.current = eventSource;

                eventSource.onopen = () => {
                    setState(prev => ({ ...prev, isConnected: true, error: null }));
                    reconnectAttempts.current = 0;
                };

                eventSource.onmessage = (message) => {
                    const data = message.data ? JSON.parse(message.data) : message;
                    const result = data as AccountRecord;

                    if (result.balances) {
                        updateBalances(result.balances as WalletBalance[]);
                    }
                };

                eventSource.onerror = () => {
                    setState(prev => ({
                        ...prev,
                        isConnected: false,
                        error: "Connection lost"
                    }));

                    // Reconnection logic
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
                        reconnectAttempts.current++;

                        reconnectTimeoutRef.current = setTimeout(connect, delay);
                    } else {
                        setState(prev => ({
                            ...prev,
                            error: "Max reconnection attempts reached"
                        }));
                    }
                };

            } catch {
                setState(prev => ({
                    ...prev,
                    error: "Failed to establish connection",
                    isConnected: false
                }));
            }
        }

        connect();
        return cleanup;
    }, [walletAddress, installationId, updateBalances]);

    const manualBalanceCheck = useCallback(async () => {
        if (!walletAddress) return;
        try {
            const baseUrl = HorizonHelper.getBaseUrl();
            const response = await fetch(`${baseUrl}/accounts/${walletAddress}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.balances) {
                await updateBalances(data.balances as WalletBalance[]);
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Failed to fetch balance"
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walletAddress]);

    const reconnect = () => {
        reconnectAttempts.current = 0;
        setState(prev => ({ ...prev, error: null }));
    };

    const stopStream = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        reconnectAttempts.current = 0;
        setState(prev => ({ ...prev, isConnected: false }));
    }, []);

    return {
        ...state,
        manualBalanceCheck,
        reconnect,
        stopStream
    };
}

export function useAccountBalancePolling(
    walletAddress: string | undefined,
    intervalMs: number = 10000
) {
    const [state, setState] = useState<Omit<StreamState, "isConnected">>({
        xlmBalance: "0.00",
        usdcBalance: "0.00",
        error: null,
        lastUpdated: null
    });

    const [isLoading, setIsLoading] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchBalance = useCallback(async () => {
        if (!walletAddress) return;
        setIsLoading(true);

        try {
            const baseUrl = HorizonHelper.getBaseUrl();
            const response = await fetch(`${baseUrl}/accounts/${walletAddress}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const xlmBalance = parseFloat(
                data.balances.find((balance: WalletBalance) =>
                    balance.asset_type === "native"
                )?.balance || "0"
            ).toFixed(2);

            const usdcBalance = parseFloat(
                data.balances.find(
                    (balance: WalletBalance) => (balance as USDCBalance).asset_code === "USDC"
                )?.balance || "0"
            ).toFixed(2);

            setState({
                xlmBalance: (parseFloat(xlmBalance) - 1).toFixed(2),
                usdcBalance,
                error: null,
                lastUpdated: new Date()
            });
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Failed to fetch balance"
            }));
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        if (walletAddress) {
            fetchBalance();
            intervalRef.current = setInterval(fetchBalance, intervalMs);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [walletAddress, intervalMs, fetchBalance]);

    return {
        ...state,
        isLoading,
        refresh: fetchBalance
    };
}

export function useXLMUSDCFromStellarDEX(intervalMs: number = 10000, pause: boolean = false) {
    const [priceData, setPriceData] = useState<PriceData>({
        xlmToUsdc: 0,
        lastUpdated: new Date()
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchStellarDEXPrice = async () => {
        try {
            // Query Stellar DEX for XLM/USDC orderbook
            const response = await fetch(
                "https://horizon.stellar.org/order_book?" +
                "selling_asset_type=native&" +
                "buying_asset_type=credit_alphanum4&" +
                "buying_asset_code=USDC&" +
                `buying_asset_issuer=${process.env.NEXT_PUBLIC_STELLAR_USDC_ASSET_ID}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Get the best bid (highest price someone will pay for XLM in USDC)
            const bestBid = data.bids[0];
            if (bestBid) {
                const price = parseFloat(bestBid.price);
                setPriceData({
                    xlmToUsdc: price,
                    lastUpdated: new Date()
                });
            }

            setError(null);
            setIsLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch Stellar DEX price");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (pause) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            return;
        }

        fetchStellarDEXPrice();
        intervalRef.current = setInterval(fetchStellarDEXPrice, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [intervalMs, pause]);

    return {
        xlmPriceInUsdc: priceData.xlmToUsdc.toFixed(7),
        lastUpdated: priceData.lastUpdated,
        isLoading,
        error,
        refresh: fetchStellarDEXPrice
    };
}
