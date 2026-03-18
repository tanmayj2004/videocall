import express from "express";
import {
  getConversations,
  getMessages,
  getOrCreateConversation
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/conversations", getConversations);
router.post("/conversation/:userId", getOrCreateConversation);
router.get("/messages/:conversationId", getMessages);

export default router;
