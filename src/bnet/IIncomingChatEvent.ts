export interface IIncomingChatEvent {
    message: string;
    user: string;

    idType(): string;
}
