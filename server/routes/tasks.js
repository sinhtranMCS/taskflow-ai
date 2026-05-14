const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body, param, query } = require('express-validator');

router.use(protect);

const taskIdValidation = [param('id').isMongoId().withMessage('Invalid task id')];
const taskBodyValidation = [
  body('title').optional().trim().notEmpty().withMessage('Task title is required'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('status').optional().isIn(['backlog', 'todo', 'in-progress', 'review', 'done']).withMessage('Invalid task status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid task priority'),
  body('assignee').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Invalid assignee id'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('subtasks').optional().isArray().withMessage('Subtasks must be an array'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be zero or greater'),
  body('loggedHours').optional().isFloat({ min: 0 }).withMessage('Logged hours must be zero or greater'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be zero or greater'),
];
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').isMongoId().withMessage('Invalid project id'),
  ...taskBodyValidation,
];
const listTaskValidation = [
  query('project').optional().isMongoId().withMessage('Invalid project id'),
  query('status').optional().isIn(['backlog', 'todo', 'in-progress', 'review', 'done']).withMessage('Invalid task status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid task priority'),
  query('assignee').optional().isMongoId().withMessage('Invalid assignee id'),
  query('sort').optional().isIn(['order', 'newest', 'updated', 'dueDate', 'priority']).withMessage('Invalid sort value'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be greater than zero'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];
const statusValidation = [
  ...taskIdValidation,
  body('status').isIn(['backlog', 'todo', 'in-progress', 'review', 'done']).withMessage('Invalid task status'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be zero or greater'),
];
const commentValidation = [
  ...taskIdValidation,
  body('text').trim().notEmpty().withMessage('Comment text is required'),
];

router.route('/')
  .get(listTaskValidation, validate, getTasks)
  .post(createTaskValidation, validate, createTask);

router.route('/:id')
  .get(taskIdValidation, validate, getTask)
  .put([...taskIdValidation, ...taskBodyValidation], validate, updateTask)
  .delete(taskIdValidation, validate, deleteTask);

router.patch('/:id/status', statusValidation, validate, updateTaskStatus);
router.post('/:id/comments', commentValidation, validate, addComment);

module.exports = router;
