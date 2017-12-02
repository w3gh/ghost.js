export class ClanMemberList {
    constructor(buff: Buffer) {
        // DEBUG_Print( "RECEIVED SID_CLANMEMBERLIST" );
        // DEBUG_Print( data );

        // 2 bytes					-> Header
        // 2 bytes					-> Length
        // 4 bytes					-> ???
        // 1 byte					-> Total
        // for( 1 .. Total )
        //		null term string	-> Name
        //		1 byte				-> Rank
        //		1 byte				-> Status
        //		null term string	-> Location

        //vector<CIncomingClanList *> ClanList;

        // if( ValidateLength( data ) && data.size( ) >= 9 )
        // {
        //     unsigned int i = 9;
        //     unsigned char Total = data[8];
        //
        //     while( Total > 0 )
        //     {
        //         Total--;
        //
        //         if( data.size( ) < i + 1 )
        //             break;
        //
        //         BYTEARRAY Name = UTIL_ExtractCString( data, i );
        //         i += Name.size( ) + 1;
        //
        //         if( data.size( ) < i + 3 )
        //             break;
        //
        //         unsigned char Rank = data[i];
        //         unsigned char Status = data[i + 1];
        //         i += 2;
        //
        //         // in the original VB source the location string is read but discarded, so that's what I do here
        //
        //         BYTEARRAY Location = UTIL_ExtractCString( data, i );
        //         i += Location.size( ) + 1;
        //         ClanList.push_back( new CIncomingClanList(	string( Name.begin( ), Name.end( ) ),
        //                                                     Rank,
        //                                                     Status ) );
        //     }
        // }
        //
        // return ClanList;

        const clanMembers = [];

        return clanMembers;

    }
}
