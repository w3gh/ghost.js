/**
 * Represents friend from Battle.net friends list
 */
export class IncomingFriend {
    LOCATION_OFFLINE = 0;
    LOCATION_NO_CHANNEL = 1;
    LOCATION_IN_CHANNEL = 2;
    LOCATION_PUBLIC_GAME = 3;
    LOCATION_PRIVATE_GAME = 4;
    LOCATION_PRIVATE_GAME_NOT_FRIEND = 5;


    //account, location, status, productID, locationName
    constructor(public account: string,
                public location: number,
                public status: number,
                public productID: string,
                public locationName: string) {
    }

    extractStatus(): string {
        let result = '';

        // 0x01: Mutual
        // 0x02: DND
        // 0x04: Away

        if (this.status & 1)
            result += "<Mutual>";

        if (this.status & 2)
            result += "<DND>";

        if (this.status & 4)
            result += "<Away>";

        if (result.length === 0)
            result = "<None>";

        return result;
    }

    extractArea(): string {
        switch (this.location) {
            case this.LOCATION_OFFLINE:
                return "<Offline>";
            case this.LOCATION_NO_CHANNEL:
                return "<No Channel>";
            case this.LOCATION_IN_CHANNEL:
                return "<In Channel>";
            case this.LOCATION_PUBLIC_GAME:
                return "<Public Game>";
            case this.LOCATION_PRIVATE_GAME:
                return "<Private Game>";
            case this.LOCATION_PRIVATE_GAME_NOT_FRIEND:
                return "<Private Game>";
        }

        return "<Unknown>";
    }

    extractLocationName(): string {
        let result = '';

        if (this.locationName.substr(0, 4) == "PX3W")
            result = this.locationName.substr(4);

        if (result.length === 0)
            result = ".";

        return result;
    }
}