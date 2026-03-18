export const VideoCallPanel = ({
  localVideoRef,
  remoteVideoRef,
  incomingCall,
  callStatus,
  onAccept,
  onReject,
  onEndCall
}) => (
  <section className="call-panel">
    <div className="panel-header">
      <h2>Video call</h2>
      <p>{callStatus}</p>
    </div>
    {incomingCall && (
      <div className="incoming-call">
        <p>{incomingCall.fromName} is calling you.</p>
        <div className="call-actions">
          <button onClick={onAccept}>Accept</button>
          <button className="secondary-button" onClick={onReject}>
            Reject
          </button>
        </div>
      </div>
    )}
    <div className="video-grid">
      <div className="video-card">
        <span>You</span>
        <video ref={localVideoRef} autoPlay muted playsInline />
      </div>
      <div className="video-card">
        <span>Remote</span>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
    </div>
    <button className="danger-button" onClick={onEndCall}>
      End call
    </button>
  </section>
);
