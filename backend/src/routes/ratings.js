import express from 'express';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { validateRatingCreate, validateId, validatePagination } from '../middleware/validator.js';
import { RatingController } from '../controllers/ratingController.js';

const router = express.Router();

router.get('/', verifyToken, validatePagination, RatingController.getRatings);
router.get('/:id', verifyToken, validateId, RatingController.getRatingById);
router.post('/', verifyToken, validateRatingCreate, RatingController.createRating);
router.get('/workers/:id/average', verifyToken, validateId, RatingController.getWorkerAverageRating);
router.put('/:id', verifyToken, validateId, RatingController.updateRating);
router.delete('/:id', verifyToken, requireAdmin, validateId, RatingController.deleteRating);

export default router;

