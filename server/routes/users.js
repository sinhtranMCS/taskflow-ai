const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

/**
 * @desc    Get all users (for assignment dropdowns)
 * @route   GET /api/users
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email avatar role title department initials')
      .sort('name');

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
