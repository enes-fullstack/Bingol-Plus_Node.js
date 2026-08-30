import express from "express";
const router = express.Router();

import * as userController from "../controller/user.js";
import { requireAuth } from "../middleware/isAuth.js";
import { generalLimiter, profileUploadLimiter } from "../middleware/rateLimit.js";

router.get("/", generalLimiter, userController.home_get);
router.get("/ilanlar", generalLimiter, userController.jobs_get);
router.get("/ilanlar/ilan-ekle", generalLimiter, requireAuth, userController.ilan_ekle_get);
router.post("/ilanlar/ilan-ekle", requireAuth, generalLimiter, userController.ilan_ekle_post);
router.get("/ilanlar/duzenle/:id", generalLimiter, requireAuth, userController.editJob_get);
router.post("/ilanlar/duzenle/:id", requireAuth, generalLimiter, userController.editJob_post);
router.post("/ilanlar/sil/:id", requireAuth, generalLimiter, userController.jobDelete_post);
router.get("/ilanlar/:id{/:slug}", generalLimiter, userController.job_detail_get);
router.get("/iletisim", generalLimiter, userController.contact_get);
router.get("/hakkimizda", generalLimiter, userController.about_get);
router.get("/gizlilik-politikasi", generalLimiter, userController.privacy_get);
router.get("/kullanim-sartlari", generalLimiter, userController.terms_get);
router.get("/cerez-politikasi", generalLimiter, userController.cookies_get);
router.get("/profilim", generalLimiter, requireAuth, userController.profile_get);
router.post("/profilim/resim-yukle", requireAuth, profileUploadLimiter, userController.profileImageUpload_post);

export default router;