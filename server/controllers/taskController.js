const Task = require('../models/Task');
const Project = require('../models/Project');
const { canAccessProject, getAccessibleProjectIds } = require('../utils/access');

const SORT_MAP = {
  order: 'order',
  newest: '-createdAt',
  updated: '-updatedAt',
  dueDate: 'dueDate',
  priority: '-priority',
};

const allowedTaskFields = (body) => {
  const allowed = [
    'title',
    'description',
    'status',
    'priority',
    'assignee',
    'dueDate',
    'tags',
    'subtasks',
    'estimatedHours',
    'loggedHours',
    'order',
  ];

  return allowed.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
};

const withCompletionTimestamp = (fields) => {
  if (fields.status === 'done') {
    return { ...fields, completedAt: new Date() };
  }

  if (fields.status && fields.status !== 'done') {
    return { ...fields, completedAt: null };
  }

  return fields;
};

const populateTask = (query) =>
  query
    .populate('assignee', 'name email avatar')
    .populate('creator', 'name email avatar')
    .populate('project', 'name color icon')
    .populate('comments.user', 'name avatar');

const loadTaskAndProject = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) return { task: null, project: null };

  const project = await Project.findById(task.project);
  return { task, project };
};

exports.getTasks = async (req, res, next) => {
  try {
    const {
      project,
      status,
      priority,
      assignee,
      search,
      sort = 'order',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (project) {
      const selectedProject = await Project.findById(project);
      if (!selectedProject) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (!canAccessProject(selectedProject, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view tasks for this project' });
      }

      query.project = project;
    } else {
      query.project = { $in: await getAccessibleProjectIds(req.user) };
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const currentPage = Math.max(parseInt(page, 10), 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10), 1), 100);
    const skip = (currentPage - 1) * pageSize;

    const [tasks, total] = await Promise.all([
      populateTask(Task.find(query))
        .sort(SORT_MAP[sort] || SORT_MAP.order)
        .skip(skip)
        .limit(pageSize),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: tasks.length,
      total,
      pagination: {
        page: currentPage,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskAndProject(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this task' });
    }

    const populatedTask = await populateTask(Task.findById(task._id));

    res.json({ success: true, data: populatedTask });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const project = await Project.findById(req.body.project);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to create tasks in this project' });
    }

    const maxOrder = await Task.findOne({
      project: req.body.project,
      status: req.body.status || 'todo',
    })
      .sort('-order')
      .select('order');

    const task = await Task.create(
      withCompletionTimestamp({
        ...allowedTaskFields(req.body),
        project: req.body.project,
        creator: req.user.id,
        order: req.body.order ?? (maxOrder ? maxOrder.order + 1 : 0),
      })
    );

    const populatedTask = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    if (io) io.to(`project:${task.project}`).emit('task-created', populatedTask);

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskAndProject(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
    }

    const update = withCompletionTimestamp(allowedTaskFields(req.body));
    const updatedTask = await populateTask(
      Task.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      })
    );

    const io = req.app.get('io');
    if (io) io.to(`project:${task.project}`).emit('task-updated', updatedTask);

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskAndProject(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this task' });
    }

    const projectId = task.project;
    await task.deleteOne();

    const io = req.app.get('io');
    if (io) io.to(`project:${projectId}`).emit('task-deleted', { id: req.params.id });

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskAndProject(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
    }

    const update = withCompletionTimestamp({
      status: req.body.status,
      ...(req.body.order !== undefined && { order: req.body.order }),
    });

    const updatedTask = await populateTask(
      Task.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      })
    );

    const io = req.app.get('io');
    if (io) io.to(`project:${task.project}`).emit('task-status-changed', updatedTask);

    res.json({ success: true, data: updatedTask });
  } catch (error) {
    next(error);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { task, project } = await loadTaskAndProject(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to comment on this task' });
    }

    task.comments.push({
      user: req.user.id,
      text: req.body.text,
    });

    await task.save();

    const updatedTask = await Task.findById(task._id).populate('comments.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(`project:${task.project}`).emit('task-commented', updatedTask);

    res.json({ success: true, data: updatedTask.comments });
  } catch (error) {
    next(error);
  }
};
