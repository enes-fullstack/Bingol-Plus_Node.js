import express from "express";
const router = express.Router();

import * as forumController from "../controller/forum.js";
import { requireAuth } from "../middleware/isAuth.js";
import { forumLimiter, generalLimiter } from "../middleware/rateLimit.js";

router.get("/forum", generalLimiter, forumController.listGet);
router.get("/forum/konu-ac", generalLimiter, requireAuth, forumController.createGet);
router.post("/forum/konu-ac", requireAuth, forumLimiter, forumController.createPost);
router.get("/forum/konu/:id{/:slug}", generalLimiter, forumController.detailGet);
router.get("/forum/akis", generalLimiter, forumController.feedGet);
router.get("/forum/akis/:kategori", generalLimiter, forumController.feedCategoryGet);

export default router;
