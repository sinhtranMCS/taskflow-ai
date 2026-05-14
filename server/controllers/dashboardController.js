const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard
 * @access  Private
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's projects
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });

    const projectIds = projects.map((p) => p._id);

    // Task statistics
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      recentTasks,
      weeklyStats,
      projectProgressStats,
    ] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.find({ project: { $in: projectIds } })
        .populate('assignee', 'name avatar')
        .populate('project', 'name color icon')
        .sort('-updatedAt')
        .limit(10),
      // Weekly completion stats (last 7 days)
      Task.aggregate([
        {
          $match: {
            project: { $in: projectIds },
            completedAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        {
          $group: {
            _id: { project: '$project', status: '$status' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format status distribution
    const statusMap = { backlog: 0, todo: 0, 'in-progress': 0, review: 0, done: 0 };
    tasksByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    // Format priority distribution
    const priorityMap = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasksByPriority.forEach((p) => {
      priorityMap[p._id] = p.count;
    });

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Fill in missing days for weekly stats
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const found = weeklyStats.find((w) => w._id === dateStr);
      weeklyData.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: found ? found.count : 0,
      });
    }

    const progressMap = projectProgressStats.reduce((acc, item) => {
      const projectId = item._id.project.toString();
      if (!acc[projectId]) acc[projectId] = { total: 0, done: 0 };
      acc[projectId].total += item.count;
      if (item._id.status === 'done') acc[projectId].done += item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        overview: {
          totalProjects: projects.length,
          totalTasks,
          completedTasks,
          inProgressTasks,
          overdueTasks,
          completionRate,
        },
        tasksByStatus: statusMap,
        tasksByPriority: priorityMap,
        recentTasks,
        weeklyData,
        activeProjects: projects
          .filter((p) => p.status === 'active')
          .slice(0, 5)
          .map((p) => {
            const stats = progressMap[p._id.toString()] || { total: 0, done: 0 };
            const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : p.progress;

            return {
              id: p._id,
              name: p.name,
              color: p.color,
              icon: p.icon,
              progress,
            };
          }),
      },
    });
  } catch (error) {
    next(error);
  }
};
