import {BNetConnection} from "./BNetConnection";

export interface IAuthInfo {
    handle(bnet: BNetConnection): any;
}
