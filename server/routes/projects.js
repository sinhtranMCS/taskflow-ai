const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { body, param, query } = require('express-validator');

router.use(protect);

const projectIdValidation = [param('id').isMongoId().withMessage('Invalid project id')];
const projectBodyValidation = [
  body('name').optional().trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('color').optional().matches(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).withMessage('Color must be a valid hex value'),
  body('status').optional().isIn(['active', 'on-hold', 'completed', 'archived']).withMessage('Invalid project status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid project priority'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];
const createProjectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  ...projectBodyValidation,
];
const listProjectValidation = [
  query('status').optional().isIn(['active', 'on-hold', 'completed', 'archived']).withMessage('Invalid project status'),
  query('sort').optional().isIn(['newest', 'oldest', 'name', 'dueDate', 'priority']).withMessage('Invalid sort value'),
];
const addMemberValidation = [
  ...projectIdValidation,
  body('userId').isMongoId().withMessage('Invalid user id'),
  body('role').optional().isIn(['viewer', 'editor', 'admin']).withMessage('Invalid member role'),
];

router.route('/')
  .get(listProjectValidation, validate, getProjects)
  .post(createProjectValidation, validate, createProject);

router.route('/:id')
  .get(projectIdValidation, validate, getProject)
  .put([...projectIdValidation, ...projectBodyValidation], validate, updateProject)
  .delete(projectIdValidation, validate, deleteProject);

router.post('/:id/members', addMemberValidation, validate, addMember);

module.exports = router;
