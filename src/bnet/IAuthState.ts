import { IBNetConnection } from "./IBNetConnection";

export interface IAuthState {
    createClientPublicKey(bnet: IBNetConnection): Buffer;

    isValid(): boolean;
}
