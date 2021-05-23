import { useState, useEffect, useRef } from 'react';

function useSocket(dest) {
    const [message, setMessage] = useState(null);
    const [offers, setOffers] = useState(null);
    const [users, setUsers] = useState(null);

    const ws = useRef(null)

    useEffect(() => {
        if (ws.current === null) {
            ws.current = new WebSocket(dest)

        }
        ws.current.onopen = () => { console.log("[open] Соединение установлено"); }
        ws.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);

            switch (message.type) {
                case "video-offer":
                    setOffers(message.offers);
                    break;
                case "user-list":
                    setUsers(message.data)
                default:
                    break;
            }
        }
        ws.current.onclose = (event) => {
            if (event.wasClean) {
                console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
            } else {
                // например, сервер убил процесс или сеть недоступна
                // обычно в этом случае event.code 1006
                console.log('[close] Соединение прервано');
            }
        };
        ws.current.onerror = (error) => {
            console.log(`[error] ${error.message}`);
        };

        return () => ws.current.close()
    }, [dest]);

    useEffect(() => {
        if (message) {
            ws.current.send(JSON.stringify(message))
        };


    }, [message])


    return [setMessage, offers, users];
}

export default useSocket;
