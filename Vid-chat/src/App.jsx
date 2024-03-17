import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
const socket = io.connect('http://localhost:5000');
function App() {
  const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()
	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
				userVideo.current.srcObject = stream
		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}


  return (
    <div className="flex gap-4 flex-col justify-center h-screen w-screen bg-scroll bg-[url('./assets/6773526.jpg')] items-center">
      <div className='flex justify-center w-[300px] p-2 bg-gray-300 text-center items-center text-xl rounded-lg sm:w-[400px]'>
          FABRTC
      </div>
      <div >
          {stream && <div className='flex-col gap-2 justify-center w-[300px] hidden p-2 bg-gray-300 text-center items-center text-xl rounded-lg sm:w-[400px] sm:flex'>
            <video ref={myVideo} width='300px' height='140px' autoPlay muted/>
            </div>}
          {callAccepted && !callEnded && <div className='flex-col gap-2 justify-center w-[300px] hidden p-2 bg-gray-300 text-center items-center text-xl rounded-lg sm:w-[400px] sm:flex'>
            <video ref={userVideo} width='300px' height='140px' autoPlay/>
            </div>}
      </div>
      <div className="flex flex-col justify-center w-[300px] p-3 bg-gray-300 text-center items-center text-xl rounded-lg sm:w-[300px] gap-2">
        <input type="text" placeholder='Your Name' className="rounded-lg p-1" value={name} onChange={(e)=>{setName(e.target.value)}}/>
        <CopyToClipboard text={me}>
					<button className="bg-gray-700 text-white rounded-lg p-1 mt-2">
						Copy ID
					</button>
				</CopyToClipboard>
      </div>
      <div className="call-button">
					{callAccepted && !callEnded ? (
						<button onClick={leaveCall} className='bg-gray-700 text-white rounded-lg p-1'>
							End Call
						</button>
					) : (
            <div className="flex flex-col justify-center w-[300px] p-3 bg-gray-300 text-center items-center text-xl rounded-lg sm:w-[300px] gap-3">
            <input type="text" placeholder='Id To Call' className="flex rounded-lg p-1" value={idToCall} onChange={(e)=>{setIdToCall(e.target.value)}}/>
            {idToCall}
            <button  className='bg-gray-700 text-white rounded-lg p-1' onClick={() => callUser(idToCall)}>
							Call Id
						</button>
            </div>
					)}
			</div>
				{receivingCall && !callAccepted ? (
						<div className="">
						<h1 >{name} is calling...</h1>
						<button className='bg-gray-700 text-white rounded-lg p-1' onClick={answerCall}>
							Answer
						</button>
					</div>
				) : null}
    </div>
  )
}

export default App
