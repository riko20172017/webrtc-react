import { useRef, useState, useEffect } from "react";
import useSocket from "./hooks/useSocket";

let connection;

function App() {
  const [buttons, setButtons] = useState({ start: false, call: false, hangup: false });
  const [stream, setStream] = useState(null);

  const video = useRef(null);
  const remoteVideo = useRef(null);
  const configuration = {};

  const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };

  const [send, offers, users] = useSocket("wss://10.0.11.47:8000", answer, setAnswer);



  useEffect(() => {
    async function start() {
      connection = new RTCPeerConnection(configuration);

      console.log('Requesting local stream');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setStream(stream)

        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
          localVideo.srcObject = stream;
        }

        // video.current.srcObject = stream;
        stream.getTracks().forEach(track => connection.addTrack(track, stream));

        setButtons({ ...buttons, start: true })
        console.log('Received local stream');
      } catch (e) {
        alert(`getUserMedia() error: ${e}`);
      }

      connection.ontrack = function ({ streams: [stream] }) {
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo) {
          remoteVideo.srcObject = stream;
        }
      };
    }
    start()
  }, [])

  async function call(ip) {
    console.log('Starting call');


    connection.addEventListener('icecandidate', e => onIceCandidate(connection, e));
    connection.addEventListener('iceconnectionstatechange', e => onIceStateChange(connection, e));

    // stream.getTracks().forEach(track => connection.addTrack(track, stream));

    console.log('Added local stream to pc1');

    try {
      const offer = await connection.createOffer(offerOptions);
      await connection.setLocalDescription(new RTCSessionDescription(offer));
      console.log(`setLocalDescription complete`);

      send({ type: "call-user", data: offer, ip })
      console.log(`%c Sended offer to ${ip}`, 'background: #222; color: #bada55');
    } catch (e) {
      console.log(`Failed to create or set local session description: ${e}`);
    }
  }

  async function answer(offer, ip) {
    console.log(`%c Got offer from ${ip}`, 'background: #222; color: #bada55')
    connection.addEventListener('icecandidate', e => onIceCandidate(connection, e));
    connection.addEventListener('iceconnectionstatechange', e => onIceStateChange(connection, e));
    connection.addEventListener('track', gotRemoteStream);
    try {
      await connection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log(`%c Set remote description ${ip}`, 'color: #0073ce')
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(new RTCSessionDescription(answer));
      send({ type: "make-answer", data: answer, ip })
      console.log(`%c Sended answer to ${ip}`, 'color: #0073ce')
    } catch (e) {
      console.log(`Failed to create or set remote session description: ${e}`);
    }
  }

  async function setAnswer(answer, ip) {
    console.log(`%c Got answer from ${ip}`, 'background: #222; color: #bada55')
    try {
      await connection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log(`%c Set remote description from ${ip}`, 'color: #0073ce')

    } catch (error) {
      console.log(`Failed to create set remote answer: ${error}`);
    }

  }

  return (
    <div className="App">
      <header className="App-header">

      </header>
      <div>
        <video id="localVideo" playsInline autoPlay muted ref={video} width="200" height="200"></video>
        <video id="remoteVideo" playsInline autoPlay muted ref={remoteVideo} width="200" height="200"></video>
        <div className="box">
          <button onClick={call} disabled={buttons.call}>Call</button>

          <button id="hangupButton" onClick={() => send({})}>Hang Up</button>
        </div>
        <ul>
          {users && users.map(user => <li key={user.ip} onClick={() => call(user.ip)}>{user.ip}</li>)}
        </ul>
        <ul>
          {offers && offers.map(offer => <li>{offer.id}</li>)}
        </ul>
      </div>
    </div>
  );
}

function gotRemoteStream(e) {
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}

async function onIceCandidate(connection, event) {
  console.log("onicecandidate");
  try {
    await (connection.addIceCandidate(event.candidate));
    console.log(`addIceCandidate success`);
  } catch (e) {
    console.log(`Failed to add ICE Candidate: ${e.toString()}`);
  }
  console.log(`ICE candidate is: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onIceStateChange(connection, event) {
  console.log("onIceStateChange");
  if (connection) {
    console.log(`ICE state: ${connection.iceConnectionState}`);
  }
}

export default App;
