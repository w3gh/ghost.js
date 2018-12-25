export interface IBNet {

    sendJoinChannel(channel: string)

    sendGetFriendsList()

    sendGetClanList()

    queueEnterChat()

    queueChatCommand(command: string, silent?: boolean)

    queueWhisperCommand(username: string, command: string)

    queueJoinGame(gameName: string)

    queueGetGameList(gameName?:string, numGames?:number)
}