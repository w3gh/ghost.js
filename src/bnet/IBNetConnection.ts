
export interface IBNetConnection {

    sendPackets(buffer: Buffer);

    on(event: string | symbol, listener: Function): this;
    emit(event: string | symbol, ...args: any[]): boolean;
}