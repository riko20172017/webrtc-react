const WebSocket = require('ws');

var clients = {};
var offers = [];


const ws = new WebSocket.Server({ host: "10.0.11.47", port: 8000 });

ws.on('connection', function (ws) {

    var id = Math.random();
    clients[id] = ws;

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
        }
    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);
        offers = offers.filter(function (value, index, arr) {
            return value.id !== id;
        });

    });

});