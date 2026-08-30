import express from "express";
const router = express.Router();

import * as apiController from "../controller/api.js";
import { requireAuth } from "../middleware/isAuth.js";
import { apiLimiter, forumLimiter, generalLimiter } from "../middleware/rateLimit.js";

router.get("/api/posts", generalLimiter, apiController.getPosts);
router.get("/api/arama", generalLimiter, apiController.searchPosts);
router.post("/api/ilan-kaydet/:jobId", requireAuth, apiLimiter, apiController.toggleSave);
router.post("/api/post-begen/:postId", requireAuth, apiLimiter, apiController.toggleLike);
router.post("/api/yanit-ekle/:postId", requireAuth, forumLimiter, apiController.addReply);
router.get("/api/yanitlar/:postId", generalLimiter, apiController.getReplies);

export default router;
