# Beego Voximplant implementation

## Overview events and methods

### Iniatilize and login to the voximplant platform using a voximplant user

`login(username, password, domain)`

    username:string

    password:string

    domain:string

### Reconnect to the platform

`reconnect()`

### Creating a call to a specified number

`createCall(number)`

    number:string

### Creating a call to another voximplant user

`createP2PCall(username)`

    username:string

### Sending DTMF (dual-tone multi-frequency) over open call

`SendDTMF(value)`

    value:string

### Mute the microphone

`muteMic()`

### Unmute the microphone

`unmuteMic()`

### Hangup the current call

`hangup()`

### Accept incoming call

`acceptCall()`

### Reject incoming call

`rejectCall()`

### Set the status of the ACD operator

`setACDStatus(status)`

    status : string

    Online - Operator is online but can not take call yet
    Ready - Operator is online and ready to take call
    InService - Operator is in call
    AfterService - Operator just finished call
    DND - Do Not Disturb
    Timeout - Operator failed to answer incoming call ~ set status to 'Online' and then to 'Ready' to undo

### Triggered on incoming call

`onIncomingCall(e)`
