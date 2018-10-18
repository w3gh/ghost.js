import {BNetConnection} from "./BNetConnection";

export interface IAuthState {
    createClientPublicKey(bnet: BNetConnection): Buffer;

    isValid(): boolean;
}
