import { useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { apiRequest } from "../api/client";
import { ChatWindow } from "../components/ChatWindow";
import { UserList } from "../components/UserList";
import { VideoCallPanel } from "../components/VideoCallPanel";
import { AuthContext } from "../context/AuthContext";

const SOCKET_URL = "https://videocall-iv2h.onrender.com";
const rtcConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("Ready for a call");
  const [activeCallUserId, setActiveCallUserId] = useState("");
  const conversationIdRef = useRef("");
  const usersRef = useRef([]);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const selectedUserOnline = selectedUser ? onlineUserIds.includes(selectedUser._id) : false;
  const isSelectedUserInCall = selectedUser && activeCallUserId === selectedUser._id;
  const shouldShowVideoPanel =
    Boolean(incomingCall && selectedUser?._id === incomingCall.fromUserId) ||
    Boolean(selectedUserOnline && isSelectedUserInCall);

  useEffect(() => {
    apiRequest("/auth/users").then(setUsers).catch(console.error);
  }, []);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("online-users", setOnlineUserIds);

    socket.on("new-message", ({ conversationId: nextConversationId, message }) => {
      if (nextConversationId === conversationIdRef.current) {
        setMessages((current) => [...current, message]);
      }
    });

    socket.on("incoming-call", ({ fromUserId, fromName, offer }) => {
      const caller = usersRef.current.find((item) => item._id === fromUserId);
      if (caller) {
        setSelectedUser(caller);
      }
      setIncomingCall({ fromUserId, fromName, offer });
      setActiveCallUserId(fromUserId);
      setCallStatus(`Incoming call from ${fromName}`);
    });

    socket.on("call-answered", async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answer);
        setCallStatus("Call connected");
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    });

    socket.on("call-rejected", () => {
      setCallStatus("Call rejected");
      cleanupCall();
    });

    socket.on("call-ended", () => {
      setCallStatus("Call ended");
      cleanupCall();
    });

    return () => {
      socket.disconnect();
      cleanupCall();
    };
  }, []);

  const createPeerConnection = async (targetUserId) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = peerConnection;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    remoteStreamRef.current = new MediaStream();
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          targetUserId,
          candidate: event.candidate
        });
      }
    };

    return peerConnection;
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIncomingCall(null);
    setActiveCallUserId("");
  };

  const loadConversation = async (nextUser) => {
    setSelectedUser(nextUser);
    const conversation = await apiRequest(`/chat/conversation/${nextUser._id}`, {
      method: "POST"
    });
    setConversationId(conversation._id);
    socketRef.current?.emit("join-conversation", conversation._id);

    const conversationMessages = await apiRequest(`/chat/messages/${conversation._id}`);
    setMessages(conversationMessages);
  };

  const handleSendMessage = (content) => {
    socketRef.current.emit("send-message", {
      receiverId: selectedUser._id,
      content
    });
  };

  const handleStartCall = async () => {
    if (!selectedUser || !selectedUserOnline) {
      return;
    }

    setActiveCallUserId(selectedUser._id);
    setCallStatus(`Calling ${selectedUser.name}...`);
    const peerConnection = await createPeerConnection(selectedUser._id);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socketRef.current.emit("call-user", {
      targetUserId: selectedUser._id,
      offer
    });
  };

  const handleAcceptCall = async () => {
    const peerConnection = await createPeerConnection(incomingCall.fromUserId);
    await peerConnection.setRemoteDescription(incomingCall.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socketRef.current.emit("answer-call", {
      targetUserId: incomingCall.fromUserId,
      answer
    });

    setCallStatus(`Call connected with ${incomingCall.fromName}`);
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) {
      return;
    }

    socketRef.current.emit("reject-call", {
      targetUserId: incomingCall.fromUserId
    });
    setIncomingCall(null);
    setActiveCallUserId("");
    setCallStatus("Call rejected");
  };

  const handleEndCall = () => {
    if (activeCallUserId) {
      socketRef.current.emit("end-call", {
        targetUserId: activeCallUserId
      });
    }

    cleanupCall();
    setCallStatus("Ready for a call");
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Zenwora workspace</p>
          <h1>{user.name}</h1>
        </div>
        <button className="secondary-button" onClick={logout}>
          Logout
        </button>
      </header>
      <main className="dashboard-grid">
        <UserList
          users={users}
          selectedUser={selectedUser}
          onSelectUser={loadConversation}
          onlineUserIds={onlineUserIds}
          activeCallUserId={activeCallUserId}
        />
        <ChatWindow
          currentUser={user}
          selectedUser={selectedUser}
          messages={messages}
          onSendMessage={handleSendMessage}
          onStartCall={handleStartCall}
          canStartCall={selectedUserOnline}
          isVideoVisible={shouldShowVideoPanel}
          videoCallPanel={
            <VideoCallPanel
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              incomingCall={incomingCall}
              callStatus={callStatus}
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
              onEndCall={handleEndCall}
            />
          }
        />
      </main>
    </div>
  );
};
