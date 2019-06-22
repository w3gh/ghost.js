import {IBNetConnection} from "./IBNetConnection";

export interface IAuthInfo {
    handle(bnet: IBNetConnection): any;
}
