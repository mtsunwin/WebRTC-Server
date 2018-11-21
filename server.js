const http = require('http'),
    webSocket = require('ws'),
    express = require('express'),
    uuid = require('uuid');

const app = express();
const server = http.createServer(app);
const wssServer = webSocket.Server;

app.use(express.static(__dirname + "/public"))
app.set('PORT', process.env.PORT || 9000);
server.listen(app.get('PORT'), () => {
    console.log("Server listening PORT: ", app.get("PORT"));
});

const wss = new wssServer({ server: server });
var client_list = [], user_list = {}, clientIndex = 1;


wss.on('connection', ws => {

    var client_uuid = uuid.v4();

    var client_infor = {
        ws: ws,
        id: client_uuid,
        username: client_uuid
    }

    client_list.push(client_infor)
    console.log("Client Connected: ", client_uuid);

    ws.on("message", message => {
        var message = JSON.parse(message);
        switch (message.type) {
            case 'login':
                let dataToClient = {
                    type: "login",
                    status: false,
                    message: ""
                }
                if (user_list[message.name]) {
                    dataToClient.message = `username existed`;
                    SendToClient(ws, dataToClient);
                } else {
                    user_list[message.name] = ws;
                    dataToClient.status = true;
                    dataToClient.message = "completed";
                    client_list.map((x, i) => {
                        if (x.ws === ws) {
                            client_list[i].username = message.name
                        }
                    })
                    SendToClient(ws, dataToClient);
                }
                break;
            case 'offer':
                var ws_reciever = user_list[message.name];
                var name_sender = "";
                client_list.map(x => {
                    if (x.ws === ws) {
                        name_sender = x.username;
                    }
                })
                if (ws_reciever) {
                    let data = {
                        type: "offer",
                        offer: message.offer,
                        name: name_sender,
                        v: typeof message.v == 'undefined' ? '' : message.v
                    };
                    console.log("offer: ", data)
                    SendToClient(ws_reciever, data)
                }
                break;
            case 'answer':
                var ws_reciever = user_list[message.name];
                if (ws_reciever) {
                    SendToClient(ws_reciever, {
                        type: "answer",
                        answer: message.answer,
                        name: message.name,
                        v: typeof message.v == 'undefined' ? '' : message.v
                    })
                }
                break;
            case 'candidate':
                var conn = user_list[message.name];
                if (conn != null) {
                    SendToClient(conn, {
                        type: "candidate",
                        candidate: message.candidate,
                        v: typeof message.v == 'undefined' ? '' : message.v
                    });
                }
                break;
            case 'leave':
                var conn = user_list[message.nameReceiver];
                if (conn != null) {
                    SendToClient(conn, {
                        type: "leave",
                        v: typeof message.v == 'undefined' ? '' : message.v
                    });
                }
                break;
        }
    })

});

// Function
function SendToClient(connection, message) {
    connection.send(JSON.stringify(message));
}


// ROUTE
const routeIndex = require('./route/route_Index');
const routeListConnect = require('./route/route_listconnect');
routeIndex(app);
routeListConnect(app, client_list);