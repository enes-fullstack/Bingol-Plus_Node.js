import express from "express";
const router = express.Router();

import * as userController from "../controller/user.js";
import * as jobApplicationController from "../controller/jobApplication.js";
import { requireAuth } from "../middleware/isAuth.js";
import { generalLimiter, profileUploadLimiter, ilanEkleLimiter, basvuruLimiter } from "../middleware/rateLimit.js";

router.get("/", generalLimiter, userController.home_get);
router.get("/ilanlar", generalLimiter, userController.jobs_get);
router.get("/ilanlar/ilan-ekle", generalLimiter, requireAuth, userController.ilan_ekle_get);
router.post("/ilanlar/ilan-ekle", requireAuth, ilanEkleLimiter, userController.ilan_ekle_post);
router.post("/ilanlar/sil/:id", requireAuth, generalLimiter, userController.jobDelete_post);
router.get("/ilanlar/duzenle/:id", (_req, res) => res.status(404).render("user/error"));
router.post("/ilanlar/duzenle/:id", (_req, res) => res.status(404).render("user/error"));
router.get("/ilanlar/:id{/:slug}", generalLimiter, userController.job_detail_get);
router.get("/iletisim", generalLimiter, userController.contact_get);
router.get("/hakkimizda", generalLimiter, userController.about_get);
router.get("/gizlilik-politikasi", generalLimiter, userController.privacy_get);
router.get("/kullanim-sartlari", generalLimiter, userController.terms_get);
router.get("/cerez-politikasi", generalLimiter, userController.cookies_get);
router.get("/profilim", generalLimiter, requireAuth, userController.profile_get);
router.get("/profilim/postlarim", generalLimiter, requireAuth, userController.profilePosts_get);
router.get("/profilim/ilanlarim", generalLimiter, requireAuth, userController.profileJobs_get);
router.get("/profilim/kaydedilenler", generalLimiter, requireAuth, userController.profileSaved_get);
router.get("/profilim/kaydedilen-postlar", generalLimiter, requireAuth, userController.profileSavedPosts_get);
router.get("/profilim/basvurularim", generalLimiter, requireAuth, jobApplicationController.myApplications_get);
router.get("/profilim/ilanlarim/:jobId/basvurular", generalLimiter, requireAuth, jobApplicationController.jobApplications_get);
router.post("/ilanlar/:id/basvur", requireAuth, basvuruLimiter, jobApplicationController.applyPost);
router.post("/basvuru/:id/durum", requireAuth, generalLimiter, jobApplicationController.updateStatusPost);
router.post("/profilim/resim-yukle", requireAuth, profileUploadLimiter, userController.profileImageUpload_post);
router.post("/profilim/post-sil/:id", requireAuth, generalLimiter, userController.postDelete_post);

export default router;