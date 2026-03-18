import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const now = () => new Date().toISOString();

const buildUser = (id, name, email, password) => ({
  _id: id,
  name,
  email,
  password: bcrypt.hashSync(password, 10),
  createdAt: now(),
  updatedAt: now()
});

const users = [
  buildUser("user-1", "Aarav Sharma", "aarav@example.com", "password123"),
  buildUser("user-2", "Priya Singh", "priya@example.com", "password123"),
  buildUser("user-3", "Rahul Verma", "rahul@example.com", "password123")
];

const conversations = [
  {
    _id: "conversation-1",
    participants: ["user-1", "user-2"],
    lastMessage: "message-1",
    createdAt: now(),
    updatedAt: now()
  }
];

const messages = [
  {
    _id: "message-1",
    conversation: "conversation-1",
    sender: "user-1",
    receiver: "user-2",
    content: "Hi Priya, this is sample test data.",
    createdAt: now(),
    updatedAt: now()
  }
];

export const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
};

export const findUserByEmail = (email) =>
  users.find((user) => user.email.toLowerCase() === email.toLowerCase());

export const findUserById = (userId) => users.find((user) => user._id === userId);

export const getUsersExcept = (userId) =>
  users.filter((user) => user._id !== userId).map(sanitizeUser);

export const createUser = async ({ name, email, password }) => {
  const timestamp = now();
  const user = {
    _id: randomUUID(),
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  users.push(user);
  return sanitizeUser(user);
};

const sortIds = (firstId, secondId) => [firstId, secondId].sort();

export const findConversationByParticipants = (firstId, secondId) => {
  const participants = sortIds(firstId, secondId);

  return conversations.find(
    (conversation) =>
      conversation.participants.length === 2 &&
      conversation.participants.every((participant, index) => participant === participants[index])
  );
};

export const createConversation = (firstId, secondId) => {
  const timestamp = now();
  const conversation = {
    _id: randomUUID(),
    participants: sortIds(firstId, secondId),
    lastMessage: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  conversations.push(conversation);
  return conversation;
};

export const getConversationById = (conversationId) =>
  conversations.find((conversation) => conversation._id === conversationId);

export const getMessagesByConversation = (conversationId) =>
  messages
    .filter((message) => message.conversation === conversationId)
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));

export const createMessage = ({ conversationId, senderId, receiverId, content }) => {
  const timestamp = now();
  const message = {
    _id: randomUUID(),
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    content,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  messages.push(message);

  const conversation = getConversationById(conversationId);
  if (conversation) {
    conversation.lastMessage = message._id;
    conversation.updatedAt = timestamp;
  }

  return message;
};

export const hydrateMessage = (message) => ({
  ...message,
  sender: sanitizeUser(findUserById(message.sender)),
  receiver: sanitizeUser(findUserById(message.receiver))
});

export const hydrateConversation = (conversation) => ({
  ...conversation,
  participants: conversation.participants.map((participantId) =>
    sanitizeUser(findUserById(participantId))
  ),
  lastMessage: conversation.lastMessage
    ? hydrateMessage(messages.find((message) => message._id === conversation.lastMessage))
    : null
});

export const getConversationsForUser = (userId) =>
  conversations
    .filter((conversation) => conversation.participants.includes(userId))
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))
    .map(hydrateConversation);
