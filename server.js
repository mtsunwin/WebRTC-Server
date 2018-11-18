var WebSocket = require('ws'),
  uuid = require('node-uuid'),
  express = require('express');


var WebSocketServer = WebSocket.Server,
  wss = new WebSocketServer({ port: 8181 }),
  app = express();

app.get("/", (req, resp) => {
  resp.end("200")
})
app.set('port', process.env.PORT || 3001)
app.listen(app.get('port'), () => {
  console.log("Server run with Port ", app.get('port'))
})


var clients = [];
var users = {}; // for calling
var clientIndex = 1;

wss.on('connection', function (ws) {
  var client_uuid = uuid.v4();
  var nickname = "AnonymousUser-" + clientIndex;
  clientIndex += 1;
  clients.push({ "id": client_uuid, "ws": ws, "nickname": nickname });
  console.log('client [%s] connected', client_uuid);

  ws.on('message', function (message) {

    //accepting only JSON messages 
    try {
      console.log("Invalid JSON 2");
      data = JSON.parse(message);
    } catch (e) {
      console.log("Invalid JSON");
      data = message;
    }

    if (typeof data != "object") {
      if (message.indexOf('/nick') == 0) { // thay đổi nick name
        var nickname_array = message.split(' ')
        if (nickname_array.length >= 2) {
          var old_nickname = nickname;
          nickname = nickname_array[1];

          for (var i = 0; i < clients.length; i++) {
            var clientSocket = clients[i].ws;
            var nickname_message = "Client " + old_nickname + " changed to " + nickname;

            clientSocket.send(JSON.stringify({
              "id": client_uuid,
              "nickname": nickname,
              "message": nickname_message
            }));

          }
        }
      } else {
        for (var i = 0; i < clients.length; i++) {
          var clientSocket = clients[i].ws;
          if (clientSocket.readyState === WebSocket.OPEN) {
            console.log('client [%s]: %s', clients[i].id, message);
            clientSocket.send(JSON.stringify({
              "id": client_uuid,
              "nickname": nickname,
              "message": message
            }));
          }
        }
      }
    } else {
      //switching type of the user message 
      switch (data.type) {
        //when a user tries to login
        case "login":
          console.log("User logged", data.name);
          //if anyone is logged in with this username then refuse 
          if (users[data.name]) {
            sendTo(ws, {
              type: "login",
              success: false
            });
          } else {
            //save user connection on the server 
            users[data.name] = ws;
            ws.name = data.name;
            sendTo(ws, {
              type: "login",
              success: true
            });
          }
          break;
        case "offer":
          //for ex. UserA wants to call UserB 
          console.log("Sending offer to: ", data.name);
          //if UserB exists then send him offer details 
          var conn = users[data.name];
          if (conn != null) {
            //setting that UserA connected with UserB 
            ws.otherName = data.name;
            sendTo(conn, {
              type: "offer",
              offer: data.offer,
              name: ws.name
            });
          }
          break;
        case "answer":
          console.log("Sending answer to: ", data.name);
          //for ex. UserB answers UserA 
          var conn = users[data.name];
          if (conn != null) {
            ws.otherName = data.name;
            sendTo(conn, {
              type: "answer",
              answer: data.answer
            });
          }
          break;
        case "candidate":
          console.log("Sending candidate to:", data.name);
          var conn = users[data.name];

          if (conn != null) {
            sendTo(conn, {
              type: "candidate",
              candidate: data.candidate
            });
          }
          break;
        case "leave": // When User Disconnect
          console.log("Disconnecting from", data.name);
          var conn = users[data.name];
          conn.otherName = null;
          //notify the other user so he can disconnect his peer connection 
          if (conn != null) {
            sendTo(conn, {
              type: "leave"
            });
          }
          break;
        default:
          sendTo(ws, {
            type: "error",
            message: "Command not found: " + data.type
          });

          break;
      }
    }
  });

  ws.on('close', function () {
    if (ws.name) {
      delete users[ws.name];
      if (ws.otherName) {
        console.log("Disconnecting from ", ws.otherName);
        var conn = users[ws.otherName];
        conn.otherName = null;

        if (conn != null) {
          sendTo(conn, {
            type: "leave"
          });
        }
      }
    }

    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id == client_uuid) {
        console.log('client [%s] disconnected', client_uuid);
        clients.splice(i, 1);
      }
    }

  });
});

function sendTo(connection, message) {
  connection.send(JSON.stringify(message));
}

