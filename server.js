const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');

var clients = [];
var offers = [];

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class App {
    express;
    constructor() {
        this.startServer();
    }
    startServer() {
        this.express = express();
        const key = fs.readFileSync(__dirname + '/key1.pem');
        const cert = fs.readFileSync(__dirname + '/cert1.pem');
        //  Set up routes (and middlewares if we had any)
        const router = express.Router();
        router.all('/', (req, res) => res.send('Hi there!'));
        this.express.use('/', router);
        //  Server creation starts here
        const server = https.createServer({ key, cert}, this.express);
        const port = 8000;
        server.listen(port, err => {
            if (err) {
                console.log('Well, this didn\'t work...');
                process.exit();
            }
            console.log('Server is listening on port ' + port);
        });
        const ws = new WebSocket.Server({ server: server });
        ws.on('connection', function (ws, eq) {

            const ip = eq.connection.remoteAddress;
            clients.push({ ip, ws })

            console.log('соединение открыто ' + ip);
            console.log('соединение открыто ' + clients.length);

            ws.on('message', function (response) {

                let message = JSON.parse(response);

                switch (message.type) {
                    case "video-offer":
                        offers.push({ ip, ...message });
                        break;

                    case "delete-offer":
                        offers = offers.filter(value => {
                            return value.ip !== message.ip;
                        });
                    default:
                        break;
                }

                array.forEach(client => {
                    client.send(JSON.stringify({ type: "video-offer", offers }));
                });
            });

            ws.on('close', function () {
                console.log('соединение закрыто ' + ip);
                offers = offers.filter(function (offer) {
                    return offer.ip !== ip;
                });
                clients = clients.filter(function (client) {
                    return client.ip !== ip;
                });
            console.log('соединение открыто ' + clients.length);

            });

        });

    }
}
new App().express;