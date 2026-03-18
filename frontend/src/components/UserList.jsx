export const UserList = ({
  users,
  selectedUser,
  onSelectUser,
  onlineUserIds,
  activeCallUserId
}) => (
  <aside className="panel user-list">
    <div className="panel-header">
      <h2>Users</h2>
      <p>Select a user to chat or call</p>
    </div>
    <div className="user-items">
      {users.map((user) => {
        const isActive = selectedUser?._id === user._id;
        const isOnline = onlineUserIds.includes(user._id);
        const isInCall = activeCallUserId === user._id;

        return (
          <button
            key={user._id}
            className={`user-item ${isActive ? "active" : ""}`}
            onClick={() => onSelectUser(user)}
          >
            <div className="user-meta">
              <strong>{user.name}</strong>
              <span>User ID: {user._id}</span>
            </div>
            <span className={`status-pill ${isInCall ? "busy" : isOnline ? "online" : ""}`}>
              {isInCall ? "In call" : isOnline ? "Online" : "Offline"}
            </span>
          </button>
        );
      })}
    </div>
  </aside>
);
