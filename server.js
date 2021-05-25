const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

var offers = [];

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

class Server {

    DEFAULT_PORT = 8000;
    users = [];

    constructor() {
        this.initialize();
        this.handleRoutes();

        this.configureApp();
        this.handleSocketConnection();

        // this.startServer();
    }

    initialize() {
        this.appServer = express();
        this.httpServer = https.createServer(this.getSSLcerts(), this.appServer);
        this.socketServer = new WebSocket.Server({ server: this.httpServer });
    }

    configureApp() {
        this.appServer.use(express.static(path.join(__dirname, "../public")));
    }

    getSSLcerts() {
        return {
            key: fs.readFileSync(__dirname + '/key1.pem'),
            cert: fs.readFileSync(__dirname + '/cert1.pem')
        }
    }

    handleRoutes() {
        this.appServer.get("/", (req, res) => {
            res.send(`<h1>Hello World</h1>`);
        });
    }

    start(callback) {
        this.httpServer.listen(this.DEFAULT_PORT, () =>
            callback(this.DEFAULT_PORT)
        );
    }

    handleSocketConnection() {
        this.socketServer.on('connection', (socket, eq) => {

            const ip = eq.connection.remoteAddress;

            const existingUser = this.users.find(
                user => user.ip === ip
            );

            if (!existingUser) {
                // this.users.push({ ip, socket })
                this.users.push({ ip })
                console.log('connected new user:' + ' ' + ip);
            }

            this.socketServer.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(this.users));
                }
            });

            socket.on('message', (message) => {
                this.socketServer.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            });


            // socket.on('message', (response) => {

            //     let message = JSON.parse(response);

            //     switch (message.type) {
            //         case "video-offer":
            //             offers.push({ ip, ...message });
            //             break;

            //         case "delete-offer":
            //             offers = offers.filter(value => {
            //                 return value.ip !== message.ip;
            //             });
            //         default:
            //             break;
            //     }

            //     array.forEach(client => {
            //         client.send(JSON.stringify({ type: "video-offer", offers }));
            //     });
            // });

            // socket.on('close', () => {
            //     console.log('соединение закрыто ' + ip);
            //     offers = offers.filter(function (offer) {
            //         return offer.ip !== ip;
            //     });
            //     this.users = this.users.filter(function (client) {
            //         return client.ip !== ip;
            //     });
            //     console.log('соединение открыто ' + this.users.length);

            //     this.users.forEach((user) => user.ws.send(JSON.stringify({ type: "user-list", data: this.users.map(user => user.ip) })))

            // });

        });
    }


}

const server = new Server();

server.start(port => {
    console.log(`Server is listening on https://localhost:${port}`);
});