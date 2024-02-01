import { ExplorerAPI } from "../explorer-api/api";
import { Asset, Box } from "../types/explorer.types";

export async function getInputBoxes(
    explorerApi: ExplorerAPI,
    inputAddress: string,
    targetNanoErgs: bigint,
    tokens?: Asset[]
) {
    const limit = 100;
    const inputs: Box[] = [];
    const addedBoxIds: Set<string> = new Set();

    if (tokens) {
        const tokenInputs: { [tokenId: string]: bigint } = {};
        const finalTokenInputs = [];
        tokens.forEach((token) => (tokenInputs[token.tokenId] = BigInt(0)));

        let offset = 0;

        while (true) {
            const boxes = await explorerApi.getUnspentBoxesByAddress(
                inputAddress,
                limit,
                offset
            );

            if (!boxes) {
                throw new Error("issue getting boxes");
            }

            for (const input of boxes!.items) {
                for (const asset of input.assets) {
                    if (
                        asset.tokenId in tokenInputs &&
                        tokenInputs[asset.tokenId] <
                        tokens.find((token) => token.tokenId === asset.tokenId)!.amount
                    ) {
                        tokenInputs[asset.tokenId] += BigInt(asset!.amount);
                        if (!addedBoxIds.has(input.boxId)) {
                            finalTokenInputs.push(input);
                            addedBoxIds.add(input.boxId);
                        }
                    }
                }
            }

            offset += limit;

            // Check if all token amounts meet requirement
            if (
                Object.values(tokenInputs).every(
                    (amount, index) => amount >= tokens![index].amount
                )
            ) {
                inputs.push(...finalTokenInputs);
                break;
            }

            if (boxes.items.length < limit) {
                throw new Error("insufficient inputs");
            }
        }
    }

    let cumInputValue: bigint = inputs.reduce(
        (acc, curr) => acc + BigInt(curr.value),
        BigInt(0)
    );

    if (cumInputValue >== targetNanoErgs) {
        return inputs;
    }

    let offset = 0;
    while (true) {
        const boxes = await explorerApi.getUnspentBoxesByAddress(
            inputAddress,
            limit,
            offset
        );
        if (!boxes) {
            throw new Error("issue getting boxes");
        }
        for (const box of boxes.items) {
            if (!addedBoxIds.has(box.boxId)) {
                inputs.push(box);
                addedBoxIds.add(box.boxId);
                cumInputValue = cumInputValue + BigInt(box.value);

                if (cumInputValue >= targetNanoErgs) {
                    return inputs;
                }
            }
        }
        offset += limit;
        if (boxes.items.length < limit) {
            break;
        }
    }

    throw new Error("insufficient inputs");
}
