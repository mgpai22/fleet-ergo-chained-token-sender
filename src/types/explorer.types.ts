export interface Box {
    boxId: string;
    transactionId: string;
    blockId: string;
    value: bigint;
    index: number;
    globalIndex: number;
    creationHeight: number;
    settlementHeight: number;
    ergoTree: string;
    ergoTreeConstants: string;
    ergoTreeScript: string;
    address: string;
    assets: Asset[]; // Change this to the proper type if you know what it should be
    additionalRegisters: Registers; // Change this to the proper type if you know what it should be
    spentTransactionId: string | null;
    mainChain: boolean;
}

export interface Asset {
    tokenId: string;
    amount: bigint;
}

export type Registers = Partial<Record<RegisterType, string>>;
export type RegisterType = "R4" | "R5" | "R6" | "R7" | "R8" | "R9";

export interface ResponseData {
    items: Box[];
}

interface PowSolutions {
    pk: string;
    w: string;
    n: string;
    d: string;
}

export interface BlockHeader {
    id: string;
    parentId: string;
    version: number;
    timestamp: number;
    height: number;
    nBits: number;
    votes: string;
    stateRoot: string;
    adProofsRoot: string;
    transactionsRoot: string;
    extensionHash: string;
    powSolutions: PowSolutions;
}

export interface BlockHeadersResponse {
    items: BlockHeader[];
}

export interface Params {
    height: number;
    storageFeeFactor: number;
    minValuePerByte: number;
    maxBlockSize: number;
    maxBlockCost: number;
    blockVersion: number;
    tokenAccessCost: number;
    inputCost: number;
    dataInputCost: number;
    outputCost: number;
}

export interface NetworkStats {
    lastBlockId: string;
    height: number;
    maxBoxGix: number;
    maxTxGix: number;
    params: Params;
}