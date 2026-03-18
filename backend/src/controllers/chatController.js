import {
  createConversation,
  findConversationByParticipants,
  getConversationsForUser,
  getMessagesByConversation,
  hydrateConversation,
  hydrateMessage
} from "../data/store.js";

export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    let conversation = findConversationByParticipants(req.user._id, userId);

    if (!conversation) {
      conversation = createConversation(req.user._id, userId);
    }

    return res.json(hydrateConversation(conversation));
  } catch (error) {
    return res.status(500).json({ message: "Unable to create conversation" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = getMessagesByConversation(conversationId).map(hydrateMessage);

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch messages" });
  }
};

export const getConversations = async (req, res) => {
  try {
    return res.json(getConversationsForUser(req.user._id));
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch conversations" });
  }
};
