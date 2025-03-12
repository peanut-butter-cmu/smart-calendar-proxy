import axios from "axios";
import { wrapper } from "axios-cookiejar-support";

export function createMangoAxios() {
    return wrapper(axios.create({
        timeout: 10000
    }));
}
