import { Asset } from "../types/explorer.types";
import { OutputBuilder } from "@fleet-sdk/core";

export function getSimpleOutbox(
    nanoErgs: bigint,
    recipient: string,
    tokens?: Asset[]
) {
    const output = new OutputBuilder(nanoErgs, recipient);

    if (tokens) {
        output.addTokens(tokens);
    }

    return output;
}
