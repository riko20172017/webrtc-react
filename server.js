const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

var clients = {};
var offers = [];

class App {
    express;
    constructor() {
        this.startServer();
    }
    startServer() {
        this.express = express();
        const key = fs.readFileSync(__dirname + '/key.pem');
        const cert = fs.readFileSync(__dirname + '/cert.pem');
        //  Set up routes (and middlewares if we had any)
        const router = express.Router();
        router.all('/', (req, res) => res.send('Hi there!'));
        this.express.use('/', router);
        //  Server creation starts here
        const server = https.createServer({ key, cert }, this.express);
        const port = 8000;
        server.listen(port, err => {
            if (err) {
                console.log('Well, this didn\'t work...');
                process.exit();
            }
            console.log('Server is listening on port ' + port);
        });
        const ws = new WebSocket.Server({ server: server });
        ws.on('connection', function (ws) {

            var id = Math.random();
            clients[id] = ws;
            console.log("+");

            for (var key in clients) {
                console.log(key);
            }
            ws.on('message', function (response) {

                let message = JSON.parse(response);

                switch (message.type) {
                    case "video-offer":
                        offers.push({ id, ...message });
                        break;

                    case "delete-offer":
                        offers = offers.filter(value => {
                            return value.id !== message.id;
                        });
                    default:
                        break;
                }

                for (var key in clients) {
                    clients[key].send(JSON.stringify({ type: "video-offer", offers }));
                    console.log();
                }
            });

            ws.on('close', function () {
                console.log('соединение закрыто ' + id);
                offers = offers.filter(function (value, index, arr) {
                    return value.id !== id;
                });

            });

        });

    }
}
new App().express;