const fs = require('fs');

module.exports = (app, client_list) => {
    app.route('/listconnect')
        .get((req, resp) => {
            resp.writeHead(200, {"Content-Type":"text/html"});
            client_list.map(x => {
                resp.write(`ID: ${x.id} -- Username: ${x.username} <br/>`)
            })
            resp.end()
        })
}