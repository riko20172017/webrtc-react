import { useRef, useState } from "react";


function App() {
  const [buttons, setButtons] = useState({ start: false, call: false, hangup: false });
  const [stream, setStream] = useState(null);
  const [offers, setOffers] = useState([]);

  const video = useRef(null);
  let connection;
  const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };

  let offerId;

  const socket = new WebSocket("wss://192.168.0.18:8000");

  socket.onopen = function (e) {
    console.log("[open] Соединение установлено");
    //   socket.send("Меня зовут Джон");
  };

  socket.onmessage = function (event) {
    const message = JSON.parse(event.data);
    console.log(message);

    switch (message.type) {
      case "video-offer":
        setOffers(message.offers);
        break;
      default:
        break;
    }
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
    } else {
      // например, сервер убил процесс или сеть недоступна
      // обычно в этом случае event.code 1006
      console.log('[close] Соединение прервано');
    }
  };

  socket.onerror = function (error) {
    console.log(`[error] ${error.message}`);
  };

  async function start() {
    console.log('Requesting local stream');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setStream(stream)
      video.current.srcObject = stream;

      setButtons({ ...buttons, start: true })
      console.log('Received local stream');
    } catch (e) {
      alert(`getUserMedia() error: ${e}`);
    }
  }

  async function call() {
    setButtons({ ...buttons, call: true, hangup: false })
    console.log('Starting call');

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    const configuration = {};
    connection = new RTCPeerConnection(configuration);
    connection.addEventListener('icecandidate', e => onIceCandidate(connection, e));
    connection.addEventListener('iceconnectionstatechange', e => onIceStateChange(connection, e));
    stream.getTracks().forEach(track => connection.addTrack(track, stream));
    console.log('Added local stream to pc1');

    try {
      console.log('pc1 createOffer start');
      const offer = await connection.createOffer(offerOptions);
      await onCreateOfferSuccess(offer, connection, socket);
    } catch (e) {
      onCreateSessionDescriptionError(e);
    }
  }

  return (
    <div className="App">
      <header className="App-header">

      </header>
      <div>
        <video id="localVideo" playsInline autoPlay muted ref={video} width="200" height="200"></video>
        <div className="box">
          <button onClick={start} disabled={buttons.start}>Start</button>
          <button onClick={call} disabled={buttons.call}>Call</button>
          <button id="hangupButton">Hang Up</button>
        </div>
        <ul>
          {offers.map(offer => <li>{offer.id}</li>)}
        </ul>
      </div>
    </div>
  );
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

async function onCreateOfferSuccess(offer, connection, socket) {
  // console.log(`Offer from pc1\n${offer.sdp}`);
  // console.log('pc1 setLocalDescription start');
  try {
    await connection.setLocalDescription(offer);
    onSetLocalSuccess(connection);
    socket.send(JSON.stringify({ type: "video-offer", sdp: offer.sdp }))

  } catch (e) {
    onSetSessionDescriptionError();
  }

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
  console.log(`Failed to set session description: ${error.toString()}`);
}

// function gotRemoteStream(e) { 
//   if (remoteVideo.srcObject !== e.streams[0]) {
//     remoteVideo.srcObject = e.streams[0];
//     console.log('pc2 received remote stream');
//   }
// }

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
