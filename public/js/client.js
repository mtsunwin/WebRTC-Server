const connection = new WebSocket('ws://localhost:9000');
const configuration = {
    "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
};

var yourConnect_WebRTC;
var yourConnect_WebRTC_v2;

connection.onopen = () => {
    console.log("Connected");
};
connection.onerror = err => {
    console.log("Got error", err);
};

connection.onmessage = function (msg) {
    msg = JSON.parse(msg.data)
    switch (msg.type) {
        case 'login':
            handleLogin(msg.status, msg.message);
            break;
        case 'offer':
            console.log("thangtm offer: ", msg)
            console.log("thangtm offer: ", msg.v.length)
            if (msg.v) {
                handleOffer_v2(msg.offer, msg.name);
            } else {
                handleOffer(msg.offer, msg.name);
            }
            break;
        case 'answer':
            if (msg.v) {
                handlAnswer_v2(msg.answer);
            } else {
                handlAnswer(msg.answer);
            }
            break;
        case "candidate":
            if (msg.v) {
                handleCandidate_v2(msg.candidate);
            } else {
                handleCandidate(msg.candidate);
            }
            break;
        case "leave":
            if (msg.v) {
                handleLeave();
            } else {
                handleLeave_v2();
            }
            break;
    }
}

/**
 * Function WSS
 */
function sendToServer(message) {
    // console.log('====================================');
    // console.log("Client send to server: ", message);
    // console.log('====================================');
    connection.send(JSON.stringify(message));
};
// END Function WSS

/**
 * Processing WSS
 * @param {*} message 
 */

// User Login
function handleLogin(status, message) {
    if (!status) {
        alert(message)
    } else {
        navigator.webkitGetUserMedia(
            { video: true, audio: false },
            myStream => {
                document.getElementById("yourVideosStream").src = window.URL.createObjectURL(myStream);
                yourConnect_WebRTC = new webkitRTCPeerConnection(configuration);

                yourConnect_WebRTC.addStream(myStream);
                yourConnect_WebRTC.onaddstream = function (e) {
                    document.getElementById('VdeosStream').src = window.URL.createObjectURL(e.stream);
                    console.log("webrtc: ", yourConnect_WebRTC.getRemoteStreams())
                };
                yourConnect_WebRTC.onicecandidate = function (event) {
                    if (event.candidate) {
                        sendToServer({
                            type: "candidate",
                            candidate: event.candidate,
                            name: document.getElementById("iptCallTo").value
                        });
                    }
                };
                // yourConnect_WebRTC.createDataChannel("chat", {});
                // yourConnect_WebRTC.ondatachannel = (ev) => {
                //     ev.channel.onopen = function () {
                //         console.log('Data channel is open and ready to be used.');
                //     };
                //     ev.channel.onmessage = function (event) {
                //         alert("Client: " + event.data);
                //     };
                // };
                yourConnect_WebRTC_v2 = new webkitRTCPeerConnection(configuration);
                yourConnect_WebRTC_v2.addStream(myStream);
                yourConnect_WebRTC_v2.onaddstream = function (e) {
                    document.getElementById('VdeosStream_v2').src = window.URL.createObjectURL(e.stream);
                };
                yourConnect_WebRTC_v2.onicecandidate = function (event) {
                    if (event.candidate) {
                        sendToServer({
                            type: "candidate",
                            candidate: event.candidate,
                            name: document.getElementById("iptCallTo_v2").value,
                            v: 2
                        });
                    }
                };
            },
            err => {
                console.log('webkitGetUserMedia', error);
            }
        )
    }
}

function handleOffer(offer, nameReceiver) {
    yourConnect_WebRTC.setRemoteDescription(new RTCSessionDescription(offer));
    yourConnect_WebRTC.createAnswer(function (answer) {
        yourConnect_WebRTC.setLocalDescription(answer);
        sendToServer({
            type: "answer",
            answer: answer,
            name: nameReceiver // nameReceiver
        });
    }, function (error) {
        alert("Error when creating an answer");
    });
}

function handlAnswer(answer) {
    yourConnect_WebRTC.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate(candidate) {
    yourConnect_WebRTC.addIceCandidate(new RTCIceCandidate(candidate));
}

function handleLeave() {
    document.getElementById("VdeosStream").src = null;
    yourConnect_WebRTC.close();
    yourConnect_WebRTC.onicecandidate = null;
    yourConnect_WebRTC.onaddstream = null;
};

// END Processing WSS

/**
 * HTML Event
 */
document.getElementById("btnLogin").addEventListener('click', event => {
    var data = {
        type: "login",
        name: document.getElementById("iptLogin").value
    }
    sendToServer(data);
})

document.getElementById("btnCall").addEventListener("click", event => {
    let callto = document.getElementById("iptCallTo").value;
    if (callto.length > 0) {
        yourConnect_WebRTC.createOffer(offer => {
            yourConnect_WebRTC.setLocalDescription(offer);
            let data = {
                type: "offer",
                offer: offer,
                name: callto
            }
            sendToServer(data);
        }, error => {
            alert("Error when creating an offer");
        });
    }
})

document.getElementById("btnHangup").addEventListener("click", event => {
    sendToServer({
        type: "leave",
        nameReceiver: document.getElementById("iptCallTo").value
    });
    handleLeave();
})

// v2
document.getElementById("btnCall_v2").addEventListener("click", event => {
    let callto = document.getElementById("iptCallTo_v2").value;
    if (callto.length > 0) {
        yourConnect_WebRTC_v2.createOffer(offer => {
            yourConnect_WebRTC_v2.setLocalDescription(offer);
            console.log("thangtm click btn 2")
            let data = {
                type: "offer",
                offer: offer,
                name: callto,
                v: 2
            }
            sendToServer(data);
        }, error => {
            alert("Error when creating an offer");
        });
    }
})

document.getElementById("btnHangup_v2").addEventListener("click", event => {
    sendToServer({
        type: "leave",
        nameReceiver: document.getElementById("iptCallTo_v2").value,
        v: 2
    });
    handleLeave();
})

function handleLeave_v2() {
    document.getElementById("VdeosStream_v2").src = null;
    yourConnect_WebRTC_v2.close();
    yourConnect_WebRTC_v2.onicecandidate = null;
    yourConnect_WebRTC_v2.onaddstream = null;
};

function handleOffer_v2(offer, nameReceiver) {
    console.log("handleOffer_v2");
    yourConnect_WebRTC_v2.setRemoteDescription(new RTCSessionDescription(offer));
    yourConnect_WebRTC_v2.createAnswer(function (answer) {
        yourConnect_WebRTC_v2.setLocalDescription(answer);
        sendToServer({
            type: "answer",
            answer: answer,
            name: nameReceiver, // nameReceiver
            v: 2
        });
    }, function (error) {
        alert("Error when creating an answer");
    });
}

function handlAnswer_v2(answer) {
    yourConnect_WebRTC_v2.setRemoteDescription(new RTCSessionDescription(answer));
}

function handleCandidate_v2(candidate) {
    yourConnect_WebRTC_v2.addIceCandidate(new RTCIceCandidate(candidate));
}