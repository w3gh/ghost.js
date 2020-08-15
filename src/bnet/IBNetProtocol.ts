
export interface IBNetProtocol {

    SEND_PROTOCOL_INITIALIZE_SELECTOR()

    SEND_SID_NULL()

    SEND_SID_STOPADV()

    SEND_SID_GETADVLISTEX(gameName: string, numGames: number)

    SEND_SID_ENTERCHAT()

    SEND_SID_JOINCHANNEL(channel: string)

    SEND_SID_CHATCOMMAND(command: string)

    SEND_SID_CHECKAD()

    SEND_SID_PING(payload)

    SEND_SID_AUTH_INFO(version, TFT, localeID, countryAbbrev, country, lang)

    SEND_SID_AUTH_CHECK(tft, clientToken, exeVersion, exeVersionHash, keyInfoRoc, keyInfoTft, exeInfo, keyOwnerName)

    SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey: Buffer, accountName: string)

    SEND_SID_AUTH_ACCOUNTLOGONPROOF(M1)

    SEND_SID_NETGAMEPORT(serverPort)

    SEND_SID_FRIENDSLIST()

    SEND_SID_CLANMEMBERLIST()

    SEND_SID_NOTIFYJOIN(gameName: string)
}