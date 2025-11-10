import type { PublicClient, WalletClient } from 'viem';
import { ViemChainBackend, RouterClient, fetchRecommendedFees } from 'onlyswaps-js';
import type { Environment } from '../core/types.js';
import type { OnlySwapsTokenSymbol } from './constants.js';
import { resolveTokenMapping } from './discovery.js';

export interface OnlySwapsServiceConfig {
    publicClient: PublicClient;
    walletClient: WalletClient;
    routerAddress: `0x${string}`;
}

export interface FetchFeesParams {
    srcChainId: number;
    dstChainId: number;
    srcToken: `0x${string}`;
    dstToken: `0x${string}`;
    amount: bigint;
}

export interface FetchFeesResult {
    solverFee: bigint;
    networkFee: bigint;
    totalFee: bigint;
    transferAmount: bigint;
    approvalAmount: bigint;
}

export interface SwapParams {
    srcChainId: number;
    dstChainId: number;
    srcToken: `0x${string}`;
    dstToken: `0x${string}`;
    amount: bigint;
    recipient: `0x${string}`;
    solverFee: bigint;
}

export interface SwapResult {
    requestId: `0x${string}`;
}

export interface RequestParams {
    sender: `0x${string}`;
    recipient: `0x${string}`;
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    amountIn: bigint;
    amountOut: bigint;
    srcChainId: number;
    dstChainId: number;
    verificationFee: bigint;
    solverFee: bigint;
    executed: boolean;
    requestedAt: Date;
}

export interface FulfillmentReceipt {
    requestId: `0x${string}`;
    fulfilled: boolean;
    solver?: `0x${string}`;
    recipient?: `0x${string}`;
    amountOut?: bigint;
    fulfilledAt?: Date;
}

/**
 * OnlySwaps service that wraps onlyswaps-js internally.
 * Users interact with our SDK, which uses onlyswaps-js under the hood.
 */
export class OnlySwapsService {
    private router: RouterClient;

    constructor(config: OnlySwapsServiceConfig) {
        const accountAddress = config.walletClient.account?.address;
        if (!accountAddress) {
            throw new Error('WalletClient must have an account with an address');
        }

        if (!config.publicClient.chain) {
            throw new Error('PublicClient must have a chain configured');
        }

        if (!config.walletClient.chain) {
            throw new Error('WalletClient must have a chain configured');
        }

        // ViemChainBackend expects clients with non-nullable chains
        // We've validated above that both clients have chains
        // The onlyswaps-js library types are stricter than viem's public types
        // Since we've validated the chains exist, we can safely pass the clients
        const backend = new ViemChainBackend(
            accountAddress,
            config.publicClient as any,
            config.walletClient as any
        );
        this.router = new RouterClient({ routerAddress: config.routerAddress }, backend);
    }

    /**
     * Fetch recommended fees for a swap
     */
    async fetchRecommendedFees(params: FetchFeesParams): Promise<FetchFeesResult> {
        const feeResponse = await fetchRecommendedFees({
            sourceToken: params.srcToken,
            destinationToken: params.dstToken,
            sourceChainId: BigInt(params.srcChainId),
            destinationChainId: BigInt(params.dstChainId),
            amount: params.amount,
        });

        return {
            solverFee: BigInt(feeResponse.fees.solver),
            networkFee: BigInt(feeResponse.fees.network),
            totalFee: BigInt(feeResponse.fees.total),
            transferAmount: BigInt(feeResponse.transferAmount),
            approvalAmount: BigInt(feeResponse.approvalAmount),
        };
    }

    /**
     * Fetch recommended fees for a swap by token symbol.
     * Resolves token addresses from constants based on environment and chain IDs.
     */
    async fetchRecommendedFeesBySymbol(params: {
        env: Environment;
        srcChainId: number;
        dstChainId: number;
        tokenSymbol: OnlySwapsTokenSymbol;
        amount: bigint;
    }): Promise<FetchFeesResult> {
        const mapping = resolveTokenMapping({
            env: params.env,
            srcChainId: params.srcChainId,
            dstChainId: params.dstChainId,
            tokenSymbol: params.tokenSymbol,
        });
        return this.fetchRecommendedFees({
            srcChainId: params.srcChainId,
            dstChainId: params.dstChainId,
            srcToken: mapping.srcTokenAddress,
            dstToken: mapping.dstTokenAddress,
            amount: params.amount,
        });
    }

    /**
     * Execute a cross-chain swap
     */
    async swap(params: SwapParams): Promise<SwapResult> {
        const result = await this.router.swap({
            srcToken: params.srcToken,
            destToken: params.dstToken,
            amount: params.amount,
            fee: params.solverFee,
            destChainId: BigInt(params.dstChainId),
            recipient: params.recipient,
        });

        return {
            requestId: result.requestId as `0x${string}`,
        };
    }

    /**
     * Execute a cross-chain swap by token symbol.
     * Resolves token addresses from constants based on environment and chain IDs.
     */
    async swapBySymbol(params: {
        env: Environment;
        srcChainId: number;
        dstChainId: number;
        tokenSymbol: OnlySwapsTokenSymbol;
        amount: bigint;
        recipient: `0x${string}`;
        solverFee: bigint;
    }): Promise<SwapResult> {
        const mapping = resolveTokenMapping({
            env: params.env,
            srcChainId: params.srcChainId,
            dstChainId: params.dstChainId,
            tokenSymbol: params.tokenSymbol,
        });
        return this.swap({
            srcChainId: params.srcChainId,
            dstChainId: params.dstChainId,
            srcToken: mapping.srcTokenAddress,
            dstToken: mapping.dstTokenAddress,
            amount: params.amount,
            recipient: params.recipient,
            solverFee: params.solverFee,
        });
    }

    /**
     * Fetch request parameters and status
     */
    async fetchRequestParams(requestId: `0x${string}`): Promise<RequestParams> {
        const params = await this.router.fetchRequestParams(requestId);

        // Convert timestamp to Date if needed
        const requestedAtValue = params.requestedAt;
        const requestedAt =
            typeof requestedAtValue === 'number' || typeof requestedAtValue === 'bigint'
                ? new Date(Number(requestedAtValue) * 1000)
                : requestedAtValue && typeof requestedAtValue === 'object' && 'getTime' in requestedAtValue
                    ? (requestedAtValue as Date)
                    : new Date();

        return {
            sender: params.sender as `0x${string}`,
            recipient: params.recipient as `0x${string}`,
            tokenIn: params.tokenIn as `0x${string}`,
            tokenOut: params.tokenOut as `0x${string}`,
            amountIn: BigInt(params.amountIn),
            amountOut: BigInt(params.amountOut),
            srcChainId: Number(params.srcChainId),
            dstChainId: Number(params.dstChainId),
            verificationFee: BigInt(params.verificationFee),
            solverFee: BigInt(params.solverFee),
            executed: params.executed,
            requestedAt,
        };
    }

    /**
     * Fetch fulfillment receipt
     */
    async fetchFulfillmentReceipt(requestId: `0x${string}`): Promise<FulfillmentReceipt> {
        const receipt = await this.router.fetchFulfilmentReceipt(requestId);

        // Convert timestamp to Date if needed
        const fulfilledAtValue = receipt.fulfilledAt;
        const fulfilledAt = fulfilledAtValue
            ? typeof fulfilledAtValue === 'number' || typeof fulfilledAtValue === 'bigint'
                ? new Date(Number(fulfilledAtValue) * 1000)
                : fulfilledAtValue && typeof fulfilledAtValue === 'object' && 'getTime' in fulfilledAtValue
                    ? (fulfilledAtValue as Date)
                    : undefined
            : undefined;

        return {
            requestId: receipt.requestId as `0x${string}`,
            fulfilled: receipt.fulfilled,
            solver: receipt.solver as `0x${string}` | undefined,
            recipient: receipt.recipient as `0x${string}` | undefined,
            amountOut: receipt.amountOut ? BigInt(receipt.amountOut) : undefined,
            fulfilledAt,
        };
    }

    /**
     * Wait for a swap to be executed (verified by dcipher committee)
     * Once executed, the solver can claim their reimbursement on the source chain
     * @param requestId The swap request ID
     * @param options Polling options
     * @returns The request parameters and fulfillment receipt once executed
     */
    async waitForExecution(
        requestId: `0x${string}`,
        options: {
            timeoutMs?: number;
            intervalMs?: number;
            onProgress?: (status: { elapsed: number; fulfilled: boolean; executed: boolean }) => void;
        } = {}
    ): Promise<{ params: RequestParams; fulfillment: FulfillmentReceipt }> {
        const { timeoutMs = 300000, intervalMs = 5000, onProgress } = options; // 5min timeout, 5s interval
        const startTime = Date.now();

        while (true) {
            const elapsed = Date.now() - startTime;

            if (elapsed > timeoutMs) {
                throw new Error(`Swap execution timeout after ${timeoutMs}ms`);
            }

            // Check both fulfillment and execution status
            const [fulfillment, params] = await Promise.all([
                this.fetchFulfillmentReceipt(requestId),
                this.fetchRequestParams(requestId),
            ]);

            if (onProgress) {
                onProgress({
                    elapsed,
                    fulfilled: fulfillment.fulfilled,
                    executed: params.executed,
                });
            }

            // Return once executed (verified by dcipher committee)
            if (params.executed) {
                return { params, fulfillment };
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
    }
}
