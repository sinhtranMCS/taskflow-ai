const express = require('express');
const { body } = require('express-validator');
const { getInsights, suggestTasks } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/insights', getInsights);
router.post(
  '/suggest-tasks',
  [
    body('goal').trim().isLength({ min: 8, max: 500 }).withMessage('Goal must be between 8 and 500 characters'),
    body('projectId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid project id'),
  ],
  validate,
  suggestTasks
);

module.exports = router;
