import { useRef, useState } from "react";
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

  async function call(ip) {
    setButtons({ ...buttons, call: true, hangup: false })
    console.log('Starting call');


    connection.addEventListener('icecandidate', e => onIceCandidate(connection, e));
    connection.addEventListener('iceconnectionstatechange', e => onIceStateChange(connection, e));

    // stream.getTracks().forEach(track => connection.addTrack(track, stream));

    console.log('Added local stream to pc1');

    try {
      const offer = await connection.createOffer(offerOptions);
      await connection.setLocalDescription(new RTCSessionDescription(offer));
      onSetLocalSuccess(connection);

      send({ type: "call-user", data: offer, ip })
    } catch (e) {
      console.log(`Failed to create or set local session description: ${e}`);
    }
  }

  async function answer(offer, ip) {
    connection.addEventListener('icecandidate', e => onIceCandidate(connection, e));
    connection.addEventListener('iceconnectionstatechange', e => onIceStateChange(connection, e));
    connection.addEventListener('track', gotRemoteStream);
    try {
      await connection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(new RTCSessionDescription(answer));
      send({ type: "make-answer", data: answer, ip })
    } catch (e) {
      console.log(`Failed to create or set remote session description: ${e}`);
    }
  }

  async function setAnswer(answer, ip) {
    console.log(answer);
    try {
      await connection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
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
          <button onClick={start} disabled={buttons.start}>Start</button>
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

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

async function onCreateOfferSuccess(offer, connection, send) {


  // console.log('pc2 createAnswer start');
  // // Since the 'remote' side has no media stream we need
  // // to pass in the right constraints in order for it to
  // // accept the incoming offer of audio and video.
  // try {
  //   const answer = await pc2.createAnswer();
  //   await onCreateAnswerSuccess(answer);
  // } catch (e) {
  //   onCreateSessionDescriptionError(e);
  // }
}

function onSetLocalSuccess(connection) {
  console.log(`${connection} setLocalDescription complete`);
}

// function onSetRemoteSuccess(connection) {
//   console.log(`${connection} setRemoteDescription complete`);
// }

function onSetSessionDescriptionError(error) {
  console.log(`Failed to set session description: ${error}`);
}

function gotRemoteStream(e) { 
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}

// async function onCreateAnswerSuccess(desc) {
//   console.log(`Answer from pc2:\n${desc.sdp}`);
//   console.log('pc2 setLocalDescription start');
//   try {
//     await pc2.setLocalDescription(desc);
//     onSetLocalSuccess(pc2);
//   } catch (e) {
//     onSetSessionDescriptionError(e);
//   }
//   console.log('pc1 setRemoteDescription start');
//   try {
//     await pc1.setRemoteDescription(desc);
//     onSetRemoteSuccess(pc1);
//   } catch (e) {
//     onSetSessionDescriptionError(e);
//   }
// }

async function onIceCandidate(connection, event) {
  console.log(connection);
  console.log(event);
  try {
    await (connection.addIceCandidate(event.candidate));
    onAddIceCandidateSuccess(connection);
  } catch (e) {
    onAddIceCandidateError(connection, e);
  }
  console.log(`${connection} ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess(connection) {
  console.log(`${connection} addIceCandidate success`);
}

function onAddIceCandidateError(connection, error) {
  console.log(`${connection} failed to add ICE Candidate: ${error.toString()}`);
}

function onIceStateChange(connection, event) {
  if (connection) {
    console.log(`${connection} ICE state: ${connection.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}

export default App;
