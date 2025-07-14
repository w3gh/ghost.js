
export interface IBNetConnection {
    TFT: number;
    username: string;
    clientToken: Buffer;
    alias: string;
    passwordHashType: string;
    password: string;
    nls: Buffer;
    firstChannel?: string;
    inChat: boolean;
    loggedIn: boolean;
    hostPort: number;

    connect();

    disconnect();

    sendPackets(buffer: Buffer | Buffer[]);

    on(event: string | symbol, listener: Function): this;
    emit(event: string | symbol, ...args: any[]): boolean;
}
