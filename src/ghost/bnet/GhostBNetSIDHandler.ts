import {BNetSID} from "../../bnet/BNetSID";
import {IAuthInfo} from "../../bnet/IAuthInfo";
import {IAuthState} from "../../bnet/IAuthState";
import {IAccountLogon} from "../../bnet/IAccountLogon";
import {IAccountLogonProof} from "../../bnet/IAccountLogonProof";
import {IIncomingChatEvent} from "../../bnet/IIncomingChatEvent";
import {IIncomingFriend} from "../../bnet/IIncomingFriend";
import {IBNetSIDHandler} from "../../bnet/IBNetSIDHandler";
import {BNetConnection} from "../../bnet/BNetConnection";
import {IBNetProtocol} from "../../bnet/IBNetProtocol";
import {create} from "../../Logger";
import {BNCSUtil} from '../../BNCSUtil';

const {debug, info, error} = create('BNet_SID_Handler');

export class GhostBNetSIDHandler implements IBNetSIDHandler {
    [BNetSID.SID_PING](bnet: BNetConnection, protocol: IBNetProtocol, d) {
        debug('HANDLE_SID_PING', d);
        bnet.emit('SID_PING', bnet, d);
        bnet.sendPackets(protocol.SEND_SID_PING(d));
    }

    [BNetSID.SID_NULL]() {
        debug('HANDLE_SID_NULL');
        // warning: we do not respond to NULL packets with a NULL packet of our own
        // bnet is because PVPGN servers are programmed to respond to NULL packets so it will create a vicious cycle of useless traffic
        // official battle.net servers do not respond to NULL packets
        return;
    }

    [BNetSID.SID_AUTH_INFO](bnet: BNetConnection, protocol: IBNetProtocol, authInfo: IAuthInfo) {
        debug('HANDLE_SID_AUTH_INFO');

        const {
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo
        } = authInfo.handle(bnet);

        bnet.emit('SID_AUTH_INFO', bnet, authInfo);
        bnet.sendPackets(protocol.SEND_SID_AUTH_CHECK(
            bnet.TFT,
            bnet.clientToken,
            exeVersion,
            exeVersionHash,
            keyInfoROC,
            keyInfoTFT,
            exeInfo,
            bnet.username
        ));
    }

    [BNetSID.SID_AUTH_CHECK](bnet: BNetConnection, protocol: IBNetProtocol, auth: IAuthState) {
        debug('HANDLE_SID_AUTH_CHECK');

        if (auth.isValid()) {
            let clientPublicKey = auth.createClientPublicKey(bnet);

            info(`[${bnet.alias}] cd keys accepted`);

            bnet.emit('SID_AUTH_CHECK', bnet, auth);
            bnet.sendPackets(protocol.SEND_SID_AUTH_ACCOUNTLOGON(clientPublicKey, bnet.username));
        } else {
            bnet.disconnect();
        }
    }

    [BNetSID.SID_AUTH_ACCOUNTLOGON](bnet: BNetConnection, protocol: IBNetProtocol, logon: IAccountLogon) {
        debug('HANDLE_SID_AUTH_ACCOUNTLOGON');

        if (logon.status > 0) {
            switch (logon.status) {
                case 1:
                    error(`logon failed - account doesn't exist`);
                    return;
                case 5:
                    error(`logon failed - account requires upgrade`);
                    return;
                default:
                    error(`logon failed - proof rejected with status ${logon.status}`);
                    return;
            }
        }

        info(`[${bnet.alias}] username ${bnet.username} accepted`);

        let data;

        if (bnet.passwordHashType === 'pvpgn') {
            info(`[${bnet.alias}] using pvpgn logon type (for pvpgn servers only)`);

            data = protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
                BNCSUtil.hashPassword(bnet.password)
            );

        } else {
            info(`[${bnet.alias}] using battle.net logon type (for official battle.net servers only)`);

            data = protocol.SEND_SID_AUTH_ACCOUNTLOGONPROOF(
                BNCSUtil.nls_get_M1(bnet.nls, logon.serverPublicKey, logon.salt)
            );
        }

        bnet.emit('SID_AUTH_ACCOUNTLOGON', bnet, logon);
        bnet.sendPackets(data);
    }

    [BNetSID.SID_AUTH_ACCOUNTLOGONPROOF](bnet: BNetConnection, protocol: IBNetProtocol, logon: IAccountLogonProof) {
        debug('HANDLE_SID_AUTH_ACCOUNTLOGONPROOF');

        bnet.loggedIn = logon.isValid();

        info(`[${bnet.alias}] logon successful`);

        bnet.emit('SID_AUTH_ACCOUNTLOGONPROOF', bnet, logon);
        bnet.sendPackets([
            protocol.SEND_SID_NETGAMEPORT(bnet.hostPort),
            protocol.SEND_SID_ENTERCHAT(),
            protocol.SEND_SID_FRIENDSLIST(),
            protocol.SEND_SID_CLANMEMBERLIST(),
        ]);
    }

    [BNetSID.SID_ENTERCHAT](bnet: BNetConnection, protocol: IBNetProtocol, d) {
        debug('HANDLE_SID_ENTERCHAT');

        if ('#' === d.toString()[0]) {
            debug('warning: account already logged in.');
        }

        info(`[${bnet.alias}] joining channel [${bnet.firstChannel}]`);

        bnet.inChat = true;

        bnet.emit('SID_ENTERCHAT', bnet, d);
        bnet.sendPackets(protocol.SEND_SID_JOINCHANNEL(bnet.firstChannel));
    }

    [BNetSID.SID_CHATEVENT](bnet: BNetConnection, protocol: IBNetProtocol, e: IIncomingChatEvent) {
        debug('HANDLE_SID_CHATEVENT', e.idType(), e.user, e.message);

        bnet.emit('SID_CHATEVENT', bnet, e);
    }

    [BNetSID.SID_CLANINFO](bnet: BNetConnection, protocol: IBNetProtocol,) {
        debug('HANDLE_SID_CLANINFO');
    }

    [BNetSID.SID_CLANMEMBERLIST](bnet: BNetConnection, protocol: IBNetProtocol,) {
        debug('HANDLE_SID_CLANMEMBERLIST');
    }

    [BNetSID.SID_CLANMEMBERSTATUSCHANGE](bnet: BNetConnection, protocol: IBNetProtocol,) {
        debug('HANDLE_SID_CLANMEMBERSTATUSCHANGE');
    }

    [BNetSID.SID_FRIENDSLIST](bnet: BNetConnection, protocol: IBNetProtocol, friends: IIncomingFriend[]) {
        debug('HANDLE_SID_FRIENDSLIST');

        bnet.emit('SID_FRIENDSLIST', bnet, friends);
    }

    [BNetSID.SID_GETADVLISTEX](bnet: BNetConnection, protocol: IBNetProtocol, d) {

    }

    [BNetSID.SID_FRIENDSADD](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_FRIENDSADD');

        return;
    }

    [BNetSID.SID_FLOODDETECTED](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_FLOODDETECTED');

        return;
    }

    [BNetSID.SID_FRIENDSUPDATE](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_FRIENDSUPDATE');

        return;
    }

    [BNetSID.SID_MESSAGEBOX](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_MESSAGEBOX');

        return;
    }

    [BNetSID.SID_CLANINVITATION](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_CLANINVITATION');

        return;
    }

    [BNetSID.SID_CLANMEMBERREMOVED](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_CLANMEMBERREMOVED');

        return;
    }

    [BNetSID.SID_REQUIREDWORK](bnet: BNetConnection, protocol: IBNetProtocol) {
        debug('HANDLE_SID_REQUIREDWORK');

        return;
    }
}
