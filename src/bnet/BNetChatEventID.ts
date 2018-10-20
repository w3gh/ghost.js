
export enum BNetChatEventID {
    EID_SHOWUSER = 1,	// received when you join a channel (includes users in the channel and their information)
    EID_JOIN = 2,	// received when someone joins the channel you're currently in
    EID_LEAVE = 3,	// received when someone leaves the channel you're currently in
    EID_WHISPER = 4,	// received a whisper message
    EID_TALK = 5,	// received when someone talks in the channel you're currently in
    EID_BROADCAST = 6,	// server broadcast
    EID_CHANNEL = 7,	// received when you join a channel (includes the channel's name, flags)
    EID_USERFLAGS = 9,	// user flags updates
    EID_WHISPERSENT = 10,	// sent a whisper message
    EID_CHANNELFULL = 13,	// channel is full
    EID_CHANNELDOESNOTEXIST = 14,	// channel does not exist
    EID_CHANNELRESTRICTED = 15,	// channel is restricted
    EID_INFO = 18,	// broadcast/information message
    EID_ERROR = 19,	// error message
    EID_EMOTE = 23,	// emote
}
