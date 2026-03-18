import jwt from "jsonwebtoken";
import {
  createConversation,
  createMessage,
  findConversationByParticipants,
  findUserById,
  getConversationById,
  hydrateMessage,
  sanitizeUser
} from "../data/store.js";

const onlineUsers = new Map();

const emitOnlineUsers = (io) => {
  io.emit("online-users", Array.from(onlineUsers.keys()));
};

const buildConversation = (senderId, receiverId) => {
  let conversation = findConversationByParticipants(senderId, receiverId);

  if (!conversation) {
    conversation = createConversation(senderId, receiverId);
  }

  return conversation;
};

export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = findUserById(decoded.userId);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = sanitizeUser(user);
      next();
    } catch (error) {
      next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    emitOnlineUsers(io);

    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("send-message", async ({ receiverId, content }) => {
      if (!receiverId || !content?.trim()) {
        return;
      }

      const conversation = buildConversation(userId, receiverId);
      const message = createMessage({
        conversationId: conversation._id,
        senderId: userId,
        receiverId,
        content: content.trim()
      });
      const refreshedConversation = getConversationById(conversation._id);
      const populatedMessage = hydrateMessage(message);

      io.to(refreshedConversation._id.toString()).emit("new-message", {
        conversationId: refreshedConversation._id.toString(),
        message: populatedMessage
      });
    });

    socket.on("call-user", ({ targetUserId, offer }) => {
      io.to(targetUserId).emit("incoming-call", {
        fromUserId: userId,
        fromName: socket.user.name,
        offer
      });
    });

    socket.on("answer-call", ({ targetUserId, answer }) => {
      io.to(targetUserId).emit("call-answered", {
        fromUserId: userId,
        answer
      });
    });

    socket.on("ice-candidate", ({ targetUserId, candidate }) => {
      io.to(targetUserId).emit("ice-candidate", {
        fromUserId: userId,
        candidate
      });
    });

    socket.on("reject-call", ({ targetUserId }) => {
      io.to(targetUserId).emit("call-rejected", {
        fromUserId: userId
      });
    });

    socket.on("end-call", ({ targetUserId }) => {
      io.to(targetUserId).emit("call-ended", {
        fromUserId: userId
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      emitOnlineUsers(io);
    });
  });
};
