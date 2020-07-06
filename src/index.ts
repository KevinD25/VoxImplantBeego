import * as VoxImplant from "voximplant-websdk";
import { Observable, interval, Subject, observable, from } from 'rxjs';



class BeegoVox {

  private currentCall: any;
  private currentACDstatus: any;
  private savedACDstatus: any;
  private voximplant: any;
  private username!: string;
  private password!: string;
  private domain!: string;
  private number!: string;
  private callingUser!: string;
  private value!: string;
  private P2P!: boolean;
  private incomingCall: any;
  public incCall: any;
  public outCall: any;
  public status: any;
  public connection: any;
  public queue: any;
  private outgoing: boolean = false;
  private readonly voxAccountID: string = '3463127';
  private readonly voxAPIKey: string = 'b6ec5e88-d5c9-4cda-aa38-72bcc3d381be';
  private readonly voxACDID: string = '992';
  private interval: any;
  private fromDate : string = '2020-04-20';
  private toDate : string = '2020-04-21';
  private callCount : string = '10';


  constructor() {
    this.incCall = new Subject();
    this.outCall = new Subject();
    this.status = new Subject();
    this.connection = new Subject();
    this.queue = new Subject();
  }

  createCall(number: string) {
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
    } else {
      console.log("Call is already set up...");
    }
  }

  createP2PCall(username: string) {
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

  sendDTMF(value: number) {
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

  disconnectCall(): boolean {
    if (this.currentCall != null) {
      this.currentCall.hangup();
      console.log("Hanging up");
      this.incomingCall = this.currentCall = null;
      return true;
    } else {
      return false;
    }
  }

  acceptCall(): boolean {
    console.log("ACCEPT CALL | Currentcall = " + this.currentCall.number());
    if (this.currentCall != null) {
      this.currentCall.answer();
      this.status.next('InService');
      this.startACDInfoInterval();
      return true;
    }
    return false;
  }

  rejectCall(): boolean {
    console.log("REJECT CALL | Currentcall = " + this.currentCall.number());
    if (this.currentCall != null) {
      this.currentCall.reject();
      this.incomingCall = this.currentCall;
      return true;
    }
    return false;
  }

  private onIncomingCall = (e: { call: any; }) => {
    this.outgoing = false;
    this.incomingCall = this.currentCall = e.call;
    console.log("Incoming call - " + this.currentCall.number());
    this.incCall.next(this.incomingCall);
    this.setACD(VoxImplant.OperatorACDStatuses.InService);
    this.currentCall.addEventListener(VoxImplant.CallEvents.Connected, this.onCallConnected);
    this.currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, this.onCallDisconnected);
    this.currentCall.addEventListener(VoxImplant.CallEvents.Failed, this.onCallFailed);
  }

  private onCallFailed = (e: { code: string; call: { number: () => any; }; }) => {
    console.log("Call Failed " + e.code);
    console.log(e.call.number());
    if (this.outgoing) {
      this.outCall.next(false);
    } else {
      this.incCall.next(false);
    }
    this.currentCall = null;
    this.stopACDInfoInterval();
  }

  private onCallDisconnected = (e: any) => {
    if (this.outgoing) {
      this.outCall.next(false);
    } else {
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
  }

  private onCallConnected = (e: any) => {
    console.log("Call Connected");
    this.outCall.next("Connected");
    //this.getACDInfo();
    if (!this.P2P) {
      this.setACD(VoxImplant.OperatorACDStatuses.InService);
    } else {
      this.setACD(VoxImplant.OperatorACDStatuses.InService);
      this.voximplant.sendVideo(false);
      this.currentCall.showRemoteVideo(false);
    }
  }

  setACDStatus(status: string) {
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

  private setACD(status: any): boolean {
    if (this.currentACDstatus != status) {
      this.voximplant.setOperatorACDStatus(status);
      this.currentACDstatus = status;
      console.log("ACD STATUS - " + status);
      return true;
    }
    return false;
  }

  getACDStatus = () => {
    let statusString: string = "";
    switch (this.currentACDstatus) {
      case VoxImplant.OperatorACDStatuses.Online:
        statusString = "Online"
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
  }

  /*
  GetACDState. All ACD info
  https://api.voximplant.com/platform_api/GetACDState/?account_id=3463127&api_key=b6ec5e88-d5c9-4cda-aa38-72bcc3d381be&acd_queue_id=992
  */

  startACDInfoInterval(): void {
      console.log('Interval started');
      setTimeout(()=>{
        this.getACDInfo();
      },2000);
      if (this.interval == null) this.interval = setInterval(() => this.getACDInfo(), 30000);
  }

  stopACDInfoInterval() {
    console.log('Interval stopped');
    clearInterval(this.interval);
    this.interval = null;
  }

  getACDInfo = async (): Promise<any> => {
    const response = await fetch(`https://api.voximplant.com/platform_api/GetACDState/?account_id=${this.voxAccountID}&api_key=${this.voxAPIKey}&acd_queue_id=${this.voxACDID}`);
    const data = await response.json();
    console.log('Incoming data ------');
    console.log(data.result.acd_queues[0].waiting_calls);
    this.queue.next(data.result.acd_queues[0].waiting_calls);
  }

  getCallHistory = async(callerID?: string): Promise<any> =>{ //unit test
    let suffix:string ="";
    if(callerID){
      console.log(callerID);
      suffix = '&remote_number=' + callerID
    }
    const response = await fetch(`https://api.voximplant.com/platform_api/GetCallHistory/?account_id=${this.voxAccountID}&api_key=${this.voxAPIKey}&from_date=${this.fromDate}%2000%3A00%3A00&to_date=${this.toDate}%2000%3A00%3A00&count=${this.callCount}&timezone=Etc/GMT+2&with_calls=true&with_records=true&desc_order=true${suffix}`);
    const data = await response.json();
    console.log(data);
    return data;
  }



  setCallHistoryDates(fromDate:string, toDate: string) {
    this.fromDate = fromDate;
    this.toDate = toDate;
  }

  setCallCount(callCount:number){
    this.callCount = callCount.toString();
  }

  login(username: string, password: string, domain: string) {
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
        this.voximplant.addEventListener(VoxImplant.Events.AuthResult, (event: { result: any; reason: any; }) => {
          if (event.result) {
            // Authorization success
            console.log("Authorization success");
            this.connection.next('Authorized');
            this.setACD(VoxImplant.OperatorACDStatuses.Ready);
            this.voximplant.addEventListener(VoxImplant.Events.IncomingCall, (event: any) => {
              if (event) {
                this.onIncomingCall(event);
              }
            });
          } else {
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
    } catch (e) {
      if (e.message == "NO_WEBRTC_SUPPORT") alert("WebRTC support isn't available");
    }
  }
}

export var beegoVox = new BeegoVox();

