import axios from "axios";

export class NodeAPI {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        axios.defaults.headers.common["Accept-Encoding"] = "gzip";
    }
    public async submitTransaction(
        transaction: any
    ): Promise<{ id: string } | undefined> {
        const url = `${this.baseUrl}/transactions`;
        try {
            return (await axios.post(url, transaction)).data;
        } catch (error) {
            // console.log(error.response.data);
            // throw error;
            return undefined;
        }
    }
}
