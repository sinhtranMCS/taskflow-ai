const Project = require('../models/Project');

const isAdmin = (user) => user?.role === 'admin';

const canAccessProject = (project, user) => {
  if (!project || !user) return false;
  if (isAdmin(user)) return true;

  const userId = user.id || user._id?.toString();
  const ownerId = project.owner?._id?.toString() || project.owner?.toString();

  if (ownerId === userId) return true;

  return (project.members || []).some((member) => {
    const memberId = member.user?._id?.toString() || member.user?.toString();
    return memberId === userId;
  });
};

const canManageProject = (project, user) => {
  if (!project || !user) return false;
  if (isAdmin(user)) return true;

  const userId = user.id || user._id?.toString();
  const ownerId = project.owner?._id?.toString() || project.owner?.toString();

  return ownerId === userId;
};

const getAccessibleProjectIds = async (user) => {
  if (isAdmin(user)) {
    const projects = await Project.find().select('_id');
    return projects.map((project) => project._id);
  }

  const userId = user.id || user._id;
  const projects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
  }).select('_id');

  return projects.map((project) => project._id);
};

module.exports = {
  canAccessProject,
  canManageProject,
  getAccessibleProjectIds,
  isAdmin,
};
