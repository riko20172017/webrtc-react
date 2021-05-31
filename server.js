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

    existingUser(ip) {
        return this.users.find(
            user => user.ip === ip
        );
    }

    addUser(ip) {
        this.users.push({ ip })
    }

    removeIser(ip) {
        this.users = this.users.filter(
            user => user.ip !== ip
        );
    }

    sendToAll(message) {
        this.socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    sendTo(socket, message) {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }

    sendToIP(ip, message) {
        this.socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.ip == ip) {
                client.send(JSON.stringify(message));
            }
        });
    }

    handleSocketConnection() {
        this.socketServer.on('connection', (socket, eq) => {

            const ip = eq.connection.remoteAddress;
            console.log('connected new user:' + ' ' + ip);

            if (!this.existingUser(ip)) {
                socket.ip = ip;

                this.addUser(ip);

                this.sendTo(socket, {
                    type: "update-user-list", users: this.users.filter(
                        user => user.ip !== ip
                    )
                })

                this.sendToAll({
                    type: "update-user-list", users: [{ ip }]

                })

            }

            socket.on('message', (response) => {

                let message = JSON.parse(response);

                switch (message.type) {
                    case "call-user":
                        this.sendToIP(message.ip, { type: "call-made", data: message.data, ip: socket.ip })
                        break;

                    default:
                        break;
                }
            });

            socket.on('close', () => {

                this.removeIser(ip);
                this.sendToAll({ type: "remove-user", user: ip })

                console.log('соединение закрыто ' + ip);
            });
        });
    }


}

const server = new Server();

server.start(port => {
    console.log(`Server is listening on https://localhost:${port}`);
});