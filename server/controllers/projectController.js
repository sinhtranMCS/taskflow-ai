const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { canAccessProject, canManageProject, isAdmin } = require('../utils/access');

const SORT_MAP = {
  newest: '-createdAt',
  oldest: 'createdAt',
  name: 'name',
  dueDate: 'dueDate',
  priority: '-priority',
};

const projectFields = (body) => {
  const allowed = ['name', 'description', 'color', 'icon', 'status', 'priority', 'dueDate', 'tags'];
  return allowed.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});
};

const buildProjectStats = async (project) => {
  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const stats = {
    total: 0,
    backlog: 0,
    todo: 0,
    'in-progress': 0,
    review: 0,
    done: 0,
  };

  taskStats.forEach((item) => {
    stats[item._id] = item.count;
    stats.total += item.count;
  });

  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return {
    ...project.toJSON(),
    taskStats: stats,
    progress,
  };
};

exports.getProjects = async (req, res, next) => {
  try {
    const { status, search, sort = 'newest' } = req.query;
    const query = isAdmin(req.user)
      ? {}
      : {
          $or: [{ owner: req.user.id }, { 'members.user': req.user.id }],
        };

    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort(SORT_MAP[sort] || SORT_MAP.newest);

    const projectsWithStats = await Promise.all(projects.map(buildProjectStats));

    res.json({
      success: true,
      count: projectsWithStats.length,
      data: projectsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project' });
    }

    res.json({
      success: true,
      data: await buildProjectStats(project),
    });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create({
      ...projectFields(req.body),
      owner: req.user.id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.emit('project-created', populatedProject);

    res.status(201).json({
      success: true,
      data: await buildProjectStats(populatedProject),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, projectFields(req.body), {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(`project:${updatedProject._id}`).emit('project-updated', updatedProject);

    res.json({
      success: true,
      data: await buildProjectStats(updatedProject),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    const io = req.app.get('io');
    if (io) io.emit('project-deleted', { id: req.params.id });

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canManageProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage project members' });
    }

    const { userId, role = 'editor' } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, error: 'Project owner is already a member' });
    }

    const isMember = project.members.some((member) => member.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({ success: false, error: 'User is already a member of this project' });
    }

    project.members.push({ user: userId, role });
    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    const io = req.app.get('io');
    if (io) io.to(`project:${project._id}`).emit('project-updated', updatedProject);

    res.json({
      success: true,
      data: await buildProjectStats(updatedProject),
    });
  } catch (error) {
    next(error);
  }
};
