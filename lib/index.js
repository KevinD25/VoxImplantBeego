"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const VoxImplant = __importStar(require("voximplant-websdk"));
const rxjs_1 = require("rxjs");
class BeegoVox {
    constructor() {
        this.outgoing = false;
        this.voxAccountID = '3463127';
        this.voxAPIKey = 'b6ec5e88-d5c9-4cda-aa38-72bcc3d381be';
        this.voxACDID = '992';
        this.fromDate = '2020-04-20';
        this.toDate = '2020-04-21';
        this.callCount = '10';
        this.onIncomingCall = (e) => {
            this.outgoing = false;
            this.incomingCall = this.currentCall = e.call;
            console.log("Incoming call - " + this.currentCall.number());
            this.incCall.next(this.incomingCall);
            this.setACD(VoxImplant.OperatorACDStatuses.InService);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailed);
        };
        this.onCallFailed = (e) => {
            console.log("Call Failed " + e.code);
            console.log(e.call.number());
            if (this.outgoing) {
                this.outCall.next(false);
            }
            else {
                this.incCall.next(false);
            }
            this.currentCall = null;
            this.stopACDInfoInterval();
        };
        this.onCallDisconnected = (e) => {
            if (this.outgoing) {
                this.outCall.next(false);
            }
            else {
                this.incCall.next(false);
            }
            console.log("Call Disconnected");
            this.currentCall = null;
            this.stopACDInfoInterval();
            if (!this.outgoing) {
                this.setACD(VoxImplant.OperatorACDStatuses.Online);
                setTimeout(() => {
                    this.setACD(VoxImplant.OperatorACDStatuses.Ready);
                }, 1000);
            }
            this.status.next('Ready');
            console.log(this.currentACDstatus + " AFTER DISCONNECT");
        };
        this.onCallConnected = (e) => {
            console.log("Call Connected");
            this.outCall.next("Connected");
            //this.getACDInfo();
            if (!this.P2P) {
                this.setACD(VoxImplant.OperatorACDStatuses.InService);
            }
            else {
                this.setACD(VoxImplant.OperatorACDStatuses.InService);
                this.voximplant.sendVideo(false);
                this.currentCall.showRemoteVideo(false);
            }
        };
        this.getACDStatus = () => {
            let statusString = "";
            switch (this.currentACDstatus) {
                case VoxImplant.OperatorACDStatuses.Online:
                    statusString = "Online";
                    break;
                case VoxImplant.OperatorACDStatuses.Ready:
                    statusString = "Ready";
                    break;
                case VoxImplant.OperatorACDStatuses.InService:
                    statusString = "InService";
                    break;
                case VoxImplant.OperatorACDStatuses.AfterService:
                    statusString = "AfterService";
                    break;
                case VoxImplant.OperatorACDStatuses.DND:
                    statusString = "DND";
                    break;
                case VoxImplant.OperatorACDStatuses.Timeout:
                    statusString = "Timeout";
                    break;
                case VoxImplant.OperatorACDStatuses.Offline:
                    statusString = "Offline";
                    break;
            }
            return statusString;
        };
        this.getACDInfo = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`https://api.voximplant.com/platform_api/GetACDState/?account_id=${this.voxAccountID}&api_key=${this.voxAPIKey}&acd_queue_id=${this.voxACDID}`);
            const data = yield response.json();
            console.log('Incoming data ------');
            console.log(data.result.acd_queues[0].waiting_calls);
            this.queue.next(data.result.acd_queues[0].waiting_calls);
        });
        this.getCallHistory = (callerID) => __awaiter(this, void 0, void 0, function* () {
            let suffix = "";
            if (callerID) {
                console.log(callerID);
                suffix = '&remote_number=' + callerID;
            }
            const response = yield fetch(`https://api.voximplant.com/platform_api/GetCallHistory/?account_id=${this.voxAccountID}&api_key=${this.voxAPIKey}&from_date=${this.fromDate}%2000%3A00%3A00&to_date=${this.toDate}%2000%3A00%3A00&count=${this.callCount}&timezone=Etc/GMT+2&with_calls=true&with_records=true&desc_order=true${suffix}`);
            const data = yield response.json();
            console.log(data);
            return data;
        });
        this.incCall = new rxjs_1.Subject();
        this.outCall = new rxjs_1.Subject();
        this.status = new rxjs_1.Subject();
        this.connection = new rxjs_1.Subject();
        this.queue = new rxjs_1.Subject();
    }
    createCall(number) {
        if (this.currentCall == null) {
            this.savedACDstatus = this.currentACDstatus;
            this.outgoing = true;
            this.number = number;
            this.currentCall = this.voximplant.call(number);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailed);
            this.outCall.next(this.currentCall);
            this.startACDInfoInterval();
        }
        else {
            console.log("Call is already set up...");
        }
    }
    createP2PCall(username) {
        if (this.currentCall == null) {
            this.savedACDstatus = this.currentACDstatus;
            this.outgoing = true;
            this.callingUser = username;
            this.currentCall = this.voximplant.call(username, { receiveVideo: true, sendVideo: true });
            this.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
            this.currentCall.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailed);
            this.outCall.next(this.currentCall);
            this.startACDInfoInterval();
        }
        else {
            console.log("Call is already set up...");
        }
    }
    sendDTMF(value) {
        if (this.currentCall != null) {
            this.value = value.toString();
            this.currentCall.sendTone(value);
        }
    }
    muteMic() {
        if (this.currentCall != null) {
            this.currentCall.muteMicrophone();
            console.log("Mute mic");
        }
    }
    unmuteMic() {
        if (this.currentCall != null) {
            this.currentCall.unmuteMicrophone();
            console.log("Unmute mic");
        }
    }
    disconnectCall() {
        if (this.currentCall != null) {
            this.currentCall.hangup();
            console.log("Hanging up");
            this.incomingCall = this.currentCall = null;
            return true;
        }
        else {
            return false;
        }
    }
    acceptCall() {
        console.log("ACCEPT CALL | Currentcall = " + this.currentCall.number());
        if (this.currentCall != null) {
            this.currentCall.answer();
            this.status.next('InService');
            this.startACDInfoInterval();
            return true;
        }
        return false;
    }
    rejectCall() {
        console.log("REJECT CALL | Currentcall = " + this.currentCall.number());
        if (this.currentCall != null) {
            this.currentCall.reject();
            this.incomingCall = this.currentCall;
            return true;
        }
        return false;
    }
    setACDStatus(status) {
        switch (status) {
            case "Online": {
                this.setACD(VoxImplant.OperatorACDStatuses.Online);
                break;
            }
            case "Ready": {
                this.setACD(VoxImplant.OperatorACDStatuses.Ready);
                break;
            }
            case "InService": {
                this.setACD(VoxImplant.OperatorACDStatuses.InService);
                break;
            }
            case "AfterService": {
                this.setACD(VoxImplant.OperatorACDStatuses.AfterService);
                break;
            }
            case "DND": {
                this.setACD(VoxImplant.OperatorACDStatuses.DND);
                break;
            }
            case "Timeout": {
                this.setACD(VoxImplant.OperatorACDStatuses.Timeout);
                break;
            }
            case "Offline": {
                this.setACD(VoxImplant.OperatorACDStatuses.Offline);
            }
            case "": {
                return "Invalid operator status. Use Online, Ready, InService, AfterService, DND, Timeout or Offline.";
            }
        }
        return true;
    }
    setACD(status) {
        if (this.currentACDstatus != status) {
            this.voximplant.setOperatorACDStatus(status);
            this.currentACDstatus = status;
            console.log("ACD STATUS - " + status);
            return true;
        }
        return false;
    }
    /*
    GetACDState. All ACD info
    https://api.voximplant.com/platform_api/GetACDState/?account_id=3463127&api_key=b6ec5e88-d5c9-4cda-aa38-72bcc3d381be&acd_queue_id=992
    */
    startACDInfoInterval() {
        console.log('Interval started');
        setTimeout(() => {
            this.getACDInfo();
        }, 2000);
        if (this.interval == null)
            this.interval = setInterval(() => this.getACDInfo(), 30000);
    }
    stopACDInfoInterval() {
        console.log('Interval stopped');
        clearInterval(this.interval);
        this.interval = null;
    }
    setCallHistoryDates(fromDate, toDate) {
        this.fromDate = fromDate;
        this.toDate = toDate;
    }
    setCallCount(callCount) {
        this.callCount = callCount.toString();
    }
    login(username, password, domain) {
        this.username = username;
        this.password = password;
        this.domain = domain;
        this.voximplant = VoxImplant.getInstance(),
            this.currentCall = null,
            this.currentACDstatus = null;
        this.voximplant.addEventListener(VoxImplant.Events.SDKReady, () => {
            // SDK initialized
            console.log("SDK initialized");
            this.connection.next('Not connected');
            this.voximplant.addEventListener(VoxImplant.Events.ConnectionEstablished, () => {
                // Connection was established successfully
                console.log("Connection was established successfully");
                this.connection.next('Connected');
                this.voximplant.addEventListener(VoxImplant.Events.AuthResult, (event) => {
                    if (event.result) {
                        // Authorization success
                        console.log("Authorization success");
                        this.connection.next('Authorized');
                        this.setACD(VoxImplant.OperatorACDStatuses.Ready);
                        this.voximplant.addEventListener(VoxImplant.Events.IncomingCall, (event) => {
                            if (event) {
                                this.onIncomingCall(event);
                            }
                        });
                    }
                    else {
                        // Authorization failure
                        console.log("Authorization failure");
                        this.connection.next('Not connected');
                        console.log(event.reason);
                    }
                });
                // Change "appname" and "accname" to names of your application and account,
                // "username" and "password" to name and password of user created via
                // the control panel.
                console.log("Attempting to log in...");
                //this.voximplant.login("Beegotesting@testing2.beego.n4.voximplant.com", "Beego123");
                this.voximplant.login(this.username + "@" + this.domain, this.password);
                console.log(this.username + " + " + this.domain + " + " + this.password);
            });
            this.voximplant.addEventListener(VoxImplant.Events.ConnectionFailed, () => {
                // Connection failed
                console.log("Connection failed");
                this.connection.next('Not connected');
            });
            this.voximplant.addEventListener(VoxImplant.Events.ConnectionClosed, () => {
                // Connection was closed
                console.log("Connection was closed");
                this.connection.next('Not connected');
                /*var repConnection = setInterval(() => {
         
                  //Keep attempting to reconnect
         
                  //this.voximplant.connect();
         
                }, 30000)*/
            });
            this.voximplant.connect();
        });
        // Add event handler BEFORE calling method for Babel compatibility.
        try {
            this.voximplant.init({
                useRTCOnly: true,
                micRequired: true,
                progressTone: true,
            });
        }
        catch (e) {
            if (e.message == "NO_WEBRTC_SUPPORT")
                alert("WebRTC support isn't available");
        }
    }
}
exports.beegoVox = new BeegoVox();
//# sourceMappingURL=index.js.map