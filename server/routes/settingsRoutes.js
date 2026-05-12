// server/routes/settingsRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authGuard.js';
import * as settingsController from '../controllers/settingsController.js';
import { uploadLogoMw } from '../middleware/upload.js';

const router = express.Router();

// All routes are protected and restricted to Admin
router.use(protect);
router.use(admin);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);
router.post('/logo', uploadLogoMw.single('logo'), settingsController.uploadLogo);
router.post('/backup', settingsController.triggerBackup);
router.post('/clear', settingsController.clearDatabase);
router.get('/export/:resource', settingsController.exportData);

export default router;
