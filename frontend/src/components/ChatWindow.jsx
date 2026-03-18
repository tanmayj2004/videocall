import { useState } from "react";

export const ChatWindow = ({
  currentUser,
  selectedUser,
  messages,
  onSendMessage,
  onStartCall,
  canStartCall,
  isVideoVisible,
  videoCallPanel
}) => {
  const [draft, setDraft] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    onSendMessage(draft);
    setDraft("");
  };

  if (!selectedUser) {
    return (
      <section className="panel empty-state">
        <h2>Choose a user</h2>
        <p>Pick someone from the left to start chatting or calling.</p>
      </section>
    );
  }

  return (
    <section className="panel chat-window">
      <div className="panel-header chat-header">
        <div>
          <h2>{selectedUser.name}</h2>
          <p>User ID: {selectedUser._id}</p>
        </div>
      </div>
      <div className="chat-actions">
        <button className="secondary-button" onClick={onStartCall} disabled={!canStartCall}>
          {canStartCall ? "Start call" : "User is offline"}
        </button>
      </div>
      {isVideoVisible && videoCallPanel}
      {!isVideoVisible && (
        <div className="video-placeholder">
          <strong>Video call</strong>
          <p>Video box opens here after you start a call with an online user.</p>
        </div>
      )}
      <div className="messages-header">
        <strong>Chat</strong>
      </div>
      <div className="messages">
        {messages.map((message) => {
          const mine = message.sender?._id === currentUser._id;

          return (
            <div key={message._id} className={`message-row ${mine ? "mine" : ""}`}>
              <div className={`message-bubble ${mine ? "mine" : ""}`}>
                <strong>{mine ? "You" : message.sender?.name}</strong>
                <p>{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form className="message-form" onSubmit={handleSubmit}>
        <input
          placeholder={`Message ${selectedUser.name}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
};
