export interface IAccountLogon {
    status: number;
    salt: Buffer;
    serverPublicKey: Buffer;
}
