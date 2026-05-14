const Project = require('../models/Project');
const Task = require('../models/Task');
const { buildAiInsights, generateTaskBreakdown } = require('../services/aiService');
const { canAccessProject, getAccessibleProjectIds } = require('../utils/access');

const enrichProjectProgress = (projects, tasks) => {
  const grouped = tasks.reduce((acc, task) => {
    const projectId = task.project?._id?.toString() || task.project?.toString();
    if (!projectId) return acc;

    if (!acc[projectId]) acc[projectId] = { total: 0, done: 0 };
    acc[projectId].total += 1;
    if (task.status === 'done') acc[projectId].done += 1;
    return acc;
  }, {});

  return projects.map((project) => {
    const plainProject = project.toObject ? project.toObject() : project;
    const stats = grouped[plainProject._id.toString()] || { total: 0, done: 0 };
    const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : plainProject.progress || 0;

    return {
      ...plainProject,
      progress,
    };
  });
};

exports.getInsights = async (req, res, next) => {
  try {
    const projectIds = await getAccessibleProjectIds(req.user);
    const [projects, tasks] = await Promise.all([
      Project.find({ _id: { $in: projectIds } }),
      Task.find({ project: { $in: projectIds } })
        .populate('assignee', 'name email avatar')
        .populate('project', 'name color icon dueDate status progress'),
    ]);

    res.json({
      success: true,
      data: buildAiInsights({
        projects: enrichProjectProgress(projects, tasks),
        tasks,
      }),
    });
  } catch (error) {
    next(error);
  }
};

exports.suggestTasks = async (req, res, next) => {
  try {
    const { goal, projectId } = req.body;
    let project = null;

    if (projectId) {
      project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to use this project' });
      }
    }

    res.json({
      success: true,
      data: {
        goal,
        project: project ? { id: project._id, name: project.name } : null,
        mode: 'explainable-rules',
        tasks: generateTaskBreakdown({
          goal,
          projectName: project?.name,
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};
