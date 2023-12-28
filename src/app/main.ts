import dotenv from "dotenv";
import { BackendWallet } from "../rust/BackendWallet";
import { Network, TransactionBuilder } from "@fleet-sdk/core";
import { ExplorerAPI } from "../explorer-api/api";
import { getInputBoxes } from "../utils/input-selecter";
import { getSimpleOutbox } from "../utils/outbox-helper";
import { NodeAPI } from "../node-api/api";
import path from 'path';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const result = dotenv.config({path: path.resolve(import.meta.dir, '../..', '.env')});

    if (result.error) {
        console.log('could not find .env...exiting');
        return;
    }
    const envVariables = [
        "EXPLORER_API",
        "NODE",
        "NETWORK",
        "MNEMONIC",
        "MNEMONIC_PW",
        "ADDRESS_INDEX",
        "RECIPIENT",
        "TOKEN_ID",
        "NANOERG_PER_TX",
        "TOKEN_PER_TX",
        "AMOUNT_TX",
        "NANOERG_GENESIS_FEE",
        "NANOERG_FEE_PER_TX",
        "SLEEP_TIME_MS"
    ];

    for (const env of envVariables) {
        if (process.env[env] === undefined || (process.env[env] === "" && env !== 'MNEMONIC_PW')) {
            console.log(`Environment variable ${env} is not defined...exiting`);
            return;
        }
    }

    const addressIndex = Number(process.env.ADDRESS_INDEX!);
    const mnemonic = process.env.MNEMONIC!;
    const mnemonicPw = process.env.MNEMONIC_PW!; // generally empty for most people
    const explorerUrl = process.env.EXPLORER_API!;
    const nodeUrl = process.env.NODE!;
    const network =
        process.env.NETWORK!.toUpperCase() === "MAINNET"
            ? Network.Mainnet
            : Network.Testnet;

    const explorer = new ExplorerAPI(explorerUrl);
    const node = new NodeAPI(nodeUrl);
    const wallet = new BackendWallet(mnemonic, mnemonicPw, network);
    const address = wallet.getAddress(addressIndex);

    const recipient = process.env.RECIPIENT!;

    const nanoErgPerTx = BigInt(process.env.NANOERG_PER_TX!);
    const nanoErgFeePerTx = BigInt(process.env.NANOERG_FEE_PER_TX!);
    const amountTx = Number(process.env.AMOUNT_TX!);
    const tokenPerTx = {
        tokenId: process.env.TOKEN_ID!,
        amount: BigInt(process.env.TOKEN_PER_TX!),
    };
    const genesisFee = BigInt(process.env.NANOERG_GENESIS_FEE!);

    const totalNanoErgs = (nanoErgPerTx + nanoErgFeePerTx) * BigInt(amountTx);
    const totalTokenPerTx = {
        tokenId: tokenPerTx.tokenId,
        amount: tokenPerTx.amount * BigInt(amountTx),
    };

    const blockHeight = (await explorer.getNetworkState())?.height;

    if (!blockHeight) {
        console.log(`issue geting block height...exiting`);
        return;
    }

    const inputs = await getInputBoxes(explorer, address, totalNanoErgs, [
        totalTokenPerTx,
    ]);

    const genesisTx = new TransactionBuilder(blockHeight)
        .from(inputs)
        .to(getSimpleOutbox(totalNanoErgs, address, [totalTokenPerTx]))
        .sendChangeTo(address)
        .payFee(genesisFee)
        .build()
        .toEIP12Object();

    const blockHeaders = (await explorer.getBlockHeaders())?.items;

    if (!blockHeaders) {
        console.log(`issue getting block headers...exiting`);
        return;
    }

    const genesisTxSigned = await wallet.signTransaction(
        genesisTx,
        blockHeaders,
        addressIndex
    );

    const genesisTxId = await node.submitTransaction(genesisTxSigned);

    if (!genesisTxId) {
        console.log(`error submitting genesis tx...exiting`);
        return;
    }

    console.log(`Genesis Tx submitted: ${genesisTxId}`);

    await sleep(Number(process.env.SLEEP_TIME_MS!));

    let isGenesisOutput = true;
    let newInput;

    for (let i = 0; i < amountTx; i++) {
        let tx;
        if (isGenesisOutput) {
            tx = new TransactionBuilder(blockHeight)
                .from(genesisTxSigned.outputs[0])
                .to(getSimpleOutbox(nanoErgPerTx, recipient, [tokenPerTx]))
                .sendChangeTo(address)
                .payFee(genesisFee)
                .build()
                .toEIP12Object();
            isGenesisOutput = false;
        } else {
            tx = new TransactionBuilder(blockHeight)
                .from(newInput!)
                .to(getSimpleOutbox(nanoErgPerTx, recipient, [tokenPerTx]))
                .sendChangeTo(address)
                .payFee(nanoErgFeePerTx)
                .build()
                .toEIP12Object();
        }

        const signedTx = await wallet.signTransaction(
            tx,
            blockHeaders,
            addressIndex
        );
        const txId = await node.submitTransaction(signedTx);

        await sleep(Number(process.env.SLEEP_TIME_MS!));

        if (!txId) {
            console.log(`error submitting tx...exiting`);
            return;
        }

        console.log(`Chained Tx ${i + 1} submitted: ${txId}`);

        newInput = signedTx.outputs[2];

        if (!newInput && i < amountTx - 1) {
            console.log(`error getting input...exiting`);
            return;
        }
    }
}

main();