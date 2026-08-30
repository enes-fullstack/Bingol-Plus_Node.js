import express from "express";
const router = express.Router();

import * as authController from "../controller/auth.js";
import { redirectIfAuth } from "../middleware/isAuth.js";
import { authLimiter, generalLimiter, forgotPasswordLimiter } from "../middleware/rateLimit.js";

router.get("/kayit-ol", generalLimiter, redirectIfAuth, authController.signup_get);
router.post("/kayit-ol", redirectIfAuth, authLimiter, authController.signup_post);
router.get("/giris-yap", generalLimiter, redirectIfAuth, authController.login_get);
router.post("/giris-yap", redirectIfAuth, authLimiter, authController.login_post);
router.get("/cikis-yap", generalLimiter, authController.logout_get);
router.get("/sifremi-unuttum", generalLimiter, redirectIfAuth, authController.forgot_password_get);
router.post("/sifremi-unuttum", redirectIfAuth, forgotPasswordLimiter, authController.forgot_password_post);
router.get("/sifre-sifirla/:token", generalLimiter, authController.reset_password_get);
router.post("/sifre-sifirla/:token", authLimiter, authController.reset_password_post);

export default router;
