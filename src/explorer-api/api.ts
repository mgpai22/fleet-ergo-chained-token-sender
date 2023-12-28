import axios from "axios";
import {
    BlockHeadersResponse,
    NetworkStats,
    ResponseData,
} from "../types/explorer.types";

export class ExplorerAPI {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        axios.defaults.headers.common["Accept-Encoding"] = "gzip";
    }

    public async getUnspentBoxesByAddress(
        address: string,
        limit: number = 100,
        offset: number = 0
    ): Promise<ResponseData | undefined> {
        const url = `${this.baseUrl}/api/v1/boxes/unspent/byAddress/${address}?limit=${limit}&offset=${offset}`;
        try {
            return (await axios.get(url)).data;
        } catch (error) {
            // console.error(error);
            // throw error;
            console.log("error getting boxes");
            return undefined;
        }
    }

    public async submitTransaction(
        transaction: any
    ): Promise<{ id: string } | undefined> {
        const url = `${this.baseUrl}/api/v1/mempool/transactions/submit`;
        try {
            return (await axios.post(url, transaction)).data;
        } catch (error) {
            // console.log(error.response.data);
            // throw error;
            return undefined;
        }
    }

    public async getBlockHeaders(): Promise<BlockHeadersResponse | undefined> {
        const url = `${this.baseUrl}/api/v1/blocks/headers`;
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            // console.error(error);
            // throw error;
            console.log("error getting headers");
            return undefined;
        }
    }

    public async getNetworkState(): Promise<NetworkStats | undefined> {
        const url = `${this.baseUrl}/api/v1/networkState`;
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            // console.error(error);
            // throw error;
            console.log("error getting headers");
            return undefined;
        }
    }
}
