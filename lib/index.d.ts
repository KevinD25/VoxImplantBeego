declare class BeegoVox {
    private currentCall;
    private currentACDstatus;
    private savedACDstatus;
    private voximplant;
    private username;
    private password;
    private domain;
    private number;
    private callingUser;
    private value;
    private P2P;
    private incomingCall;
    incCall: any;
    outCall: any;
    status: any;
    connection: any;
    queue: any;
    private outgoing;
    private readonly voxAccountID;
    private readonly voxAPIKey;
    private readonly voxACDID;
    private interval;
    private fromDate;
    private toDate;
    private callCount;
    constructor();
    createCall(number: string): void;
    createP2PCall(username: string): void;
    sendDTMF(value: number): void;
    muteMic(): void;
    unmuteMic(): void;
    disconnectCall(): boolean;
    acceptCall(): boolean;
    rejectCall(): boolean;
    private onIncomingCall;
    private onCallFailed;
    private onCallDisconnected;
    private onCallConnected;
    setACDStatus(status: string): true | "Invalid operator status. Use Online, Ready, InService, AfterService, DND, Timeout or Offline.";
    private setACD;
    getACDStatus: () => string;
    startACDInfoInterval(): void;
    stopACDInfoInterval(): void;
    getACDInfo: () => Promise<any>;
    getCallHistory: (callerID?: string | undefined) => Promise<any>;
    setCallHistoryDates(fromDate: string, toDate: string): void;
    setCallCount(callCount: number): void;
    login(username: string, password: string, domain: string): void;
}
export declare var beegoVox: BeegoVox;
export {};
