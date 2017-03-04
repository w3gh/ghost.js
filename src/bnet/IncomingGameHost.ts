export class IncomingGameHost {
	constructor(public GameType,
	            public Parameter,
	            public LanguageID,
	            public Port,
	            public IP,
	            public Status,
	            public ElapsedTime,
	            public GameName,
	            public SlotsTotal,
	            public HostCounter,
	            public StatString) {
		//console.log('IncomingGameHost', arguments);
	}
}