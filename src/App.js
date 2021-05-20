import { useRef, useState } from "react";

function App() {
  const [buttons, setButtons] = useState({ start: false, call: false, hangup: false });

  const video = useRef(null);

  async function start() {
    console.log('Requesting local stream');
    try {
      video.current.srcObject = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      setButtons({ ...buttons, start: true })
      console.log('Received local stream');
    } catch (e) {
      alert(`getUserMedia() error: ${e}`);
    }
  }

  async function call() {
    setButtons({ ...buttons, call: true, hangup: false })
    console.log('Starting call');

    const videoTracks =  video.current.getVideoTracks();
    const audioTracks =  video.current.getAudioTracks();


    // if (videoTracks.length > 0) {
    //   console.log(`Using video device: ${videoTracks[0].label}`);
    // }
    // if (audioTracks.length > 0) {
    //   console.log(`Using audio device: ${audioTracks[0].label}`);
    // }

    // const configuration = {};
    // pc1 = new RTCPeerConnection(configuration);
    // pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
    // pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));

    // localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
    // console.log('Added local stream to pc1');

    // try {
    //   console.log('pc1 createOffer start');
    //   const offer = await pc1.createOffer(offerOptions);
    //   await onCreateOfferSuccess(offer);
    // } catch (e) {
    //   onCreateSessionDescriptionError(e);
    // }
  }

  console.log(buttons);
  return (
    <div className="App">
      <header className="App-header">

      </header>
      <div>

        <video id="localVideo" playsInline autoPlay muted ref={video}></video>
        <div className="box">
          <button onClick={start} disabled={buttons.start}>Start</button>
          <button id="callButton" onClick={call}>Call</button>
          <button id="hangupButton">Hang Up</button>
        </div>
      </div>
    </div>
  );
}

export default App;
