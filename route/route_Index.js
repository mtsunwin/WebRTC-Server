const fs = require('fs');

module.exports = app => {
    app.route('/')
        .get((req, resp) => {
            fs.readFile('./public/index.html', function (err, html) {
                if (err) throw err;
                resp.writeHeader(200, { "Content-Type": "text/html" });
                resp.write(html);
                resp.end();
            })
        })
}