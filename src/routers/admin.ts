import express from "express";
const router = express.Router();

import * as adminController from "../controller/admin.js";
import { requireAdmin } from "../middleware/isAdmin.js";
import { adminLimiter, generalLimiter } from "../middleware/rateLimit.js";

router.get("/admin", generalLimiter, requireAdmin, adminController.dashboardGet);
router.get("/admin/ilan-ekle", generalLimiter, requireAdmin, adminController.createJobGet);
router.post("/admin/ilan-ekle", requireAdmin, adminLimiter, adminController.createJobPost);
router.get("/admin/ilan-duzenle/:id", generalLimiter, requireAdmin, adminController.editJobGet);
router.post("/admin/ilan-duzenle/:id", requireAdmin, adminLimiter, adminController.editJobPost);
router.post("/admin/ilan-sil/:id", requireAdmin, adminLimiter, adminController.jobDeletePost);
router.get("/admin/talepler", generalLimiter, requireAdmin, adminController.requestsGet);
router.get("/admin/talep/:id", generalLimiter, requireAdmin, adminController.requestDetailGet);
router.post("/admin/talep-onayla/:id", requireAdmin, adminLimiter, adminController.requestApprovePost);
router.post("/admin/talep-reddet/:id", requireAdmin, adminLimiter, adminController.requestRejectPost);
router.get("/admin/loglar", generalLimiter, requireAdmin, adminController.logsGet);
router.get("/admin/kullanicilar", generalLimiter, requireAdmin, adminController.usersGet);
router.post("/admin/kullanici-sil/:id", requireAdmin, adminLimiter, adminController.userDeletePost);
router.post("/admin/kullanici-ban/:id", requireAdmin, adminLimiter, adminController.userBanPost);
router.post("/admin/konu-sil/:postId", requireAdmin, adminLimiter, adminController.topicDeletePost);
router.get("/admin/kategoriler", generalLimiter, requireAdmin, adminController.categoriesGet);
router.post("/admin/kategori-ekle", requireAdmin, adminLimiter, adminController.categoryCreatePost);
router.post("/admin/kategori-sil/:id", requireAdmin, adminLimiter, adminController.categoryDeletePost);

export default router;
