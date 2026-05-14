const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const statusLabels = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'In Progress',
  review: 'Review',
  done: 'Done',
};

const priorityWeight = {
  low: 1,
  medium: 2,
  high: 4,
  urgent: 6,
};

const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
};

const getAssigneeName = (task) => task.assignee?.name || task.assignee?.email || 'Unassigned';

const analyzeTaskRisk = (task) => {
  if (task.status === 'done') return null;

  const dueIn = daysUntil(task.dueDate);
  let score = priorityWeight[task.priority] || 2;
  const reasons = [];

  if (dueIn !== null && dueIn < 0) {
    score += 8;
    reasons.push(`${Math.abs(dueIn)} day(s) overdue`);
  } else if (dueIn !== null && dueIn <= 2) {
    score += 5;
    reasons.push('due within 48 hours');
  } else if (dueIn !== null && dueIn <= 7) {
    score += 2;
    reasons.push('due this week');
  }

  if (task.priority === 'urgent' || task.priority === 'high') {
    reasons.push(`${task.priority} priority`);
  }

  if (!task.assignee) {
    score += 3;
    reasons.push('no assignee');
  }

  if (task.status === 'review') {
    score += 1;
    reasons.push('waiting in review');
  }

  return {
    id: task._id,
    title: task.title,
    project: task.project?.name || 'Unknown project',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    score,
    severity: score >= 11 ? 'critical' : score >= 8 ? 'high' : score >= 5 ? 'medium' : 'low',
    reason: reasons.join(', ') || 'normal priority',
  };
};

const buildWorkload = (tasks) => {
  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const byAssignee = new Map();

  activeTasks.forEach((task) => {
    const name = getAssigneeName(task);
    const current = byAssignee.get(name) || {
      name,
      active: 0,
      urgent: 0,
      overdue: 0,
      review: 0,
    };

    current.active += 1;
    if (task.priority === 'urgent') current.urgent += 1;
    if (daysUntil(task.dueDate) !== null && daysUntil(task.dueDate) < 0) current.overdue += 1;
    if (task.status === 'review') current.review += 1;

    byAssignee.set(name, current);
  });

  return [...byAssignee.values()].sort((a, b) => b.active - a.active).slice(0, 6);
};

const buildRecommendations = ({ projects, tasks, riskTasks, workload }) => {
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const recommendations = [];
  const overdueCount = openTasks.filter((task) => daysUntil(task.dueDate) !== null && daysUntil(task.dueDate) < 0).length;
  const urgentUnassigned = openTasks.filter((task) => task.priority === 'urgent' && !task.assignee).length;
  const reviewCount = openTasks.filter((task) => task.status === 'review').length;
  const blockedProjects = projects.filter((project) => {
    const dueIn = daysUntil(project.dueDate);
    return dueIn !== null && dueIn <= 14 && (project.progress || 0) < 60 && project.status === 'active';
  });
  const overloaded = workload.find((member) => member.active >= 5 || member.urgent >= 2);

  if (riskTasks[0]) {
    recommendations.push({
      title: `Handle "${riskTasks[0].title}" first`,
      reason: riskTasks[0].reason,
      impact: 'Reduces delivery risk immediately.',
      confidence: 0.92,
    });
  }

  if (overdueCount > 0) {
    recommendations.push({
      title: `Run an overdue triage for ${overdueCount} task(s)`,
      reason: 'Overdue work is the strongest predictor of sprint slippage.',
      impact: 'Clarifies scope, ownership, and revised dates.',
      confidence: 0.88,
    });
  }

  if (urgentUnassigned > 0) {
    recommendations.push({
      title: `Assign owners to ${urgentUnassigned} urgent task(s)`,
      reason: 'Urgent work without ownership tends to stall.',
      impact: 'Improves accountability and follow-through.',
      confidence: 0.84,
    });
  }

  if (reviewCount >= 2) {
    recommendations.push({
      title: 'Clear the review queue',
      reason: `${reviewCount} task(s) are waiting for review.`,
      impact: 'Moves completed work across the finish line.',
      confidence: 0.78,
    });
  }

  if (blockedProjects[0]) {
    recommendations.push({
      title: `Re-plan "${blockedProjects[0].name}"`,
      reason: 'The project is close to its due date but progress is still low.',
      impact: 'Protects the deadline by reducing scope or adding capacity.',
      confidence: 0.81,
    });
  }

  if (overloaded) {
    recommendations.push({
      title: `Balance workload for ${overloaded.name}`,
      reason: `${overloaded.name} has ${overloaded.active} active task(s).`,
      impact: 'Reduces bottlenecks and context switching.',
      confidence: 0.74,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Plan the next milestone',
      reason: 'No major delivery risk detected in the current board.',
      impact: 'Keeps momentum visible for the team.',
      confidence: 0.7,
    });
  }

  return recommendations.slice(0, 5);
};

const buildAiInsights = ({ projects, tasks }) => {
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const overdueTasks = openTasks.filter((task) => daysUntil(task.dueDate) !== null && daysUntil(task.dueDate) < 0).length;
  const dueSoonTasks = openTasks.filter((task) => {
    const dueIn = daysUntil(task.dueDate);
    return dueIn !== null && dueIn >= 0 && dueIn <= 7;
  }).length;
  const urgentOpenTasks = openTasks.filter((task) => task.priority === 'urgent').length;
  const unassignedTasks = openTasks.filter((task) => !task.assignee).length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const riskTasks = tasks
    .map(analyzeTaskRisk)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const workload = buildWorkload(tasks);
  const healthScore = clamp(
    72 + completionRate * 0.22 - overdueTasks * 8 - dueSoonTasks * 3 - urgentOpenTasks * 4 - unassignedTasks * 2,
    0,
    100
  );

  const statusDistribution = openTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    healthScore: Math.round(healthScore),
    summary: {
      projects: projects.length,
      totalTasks: tasks.length,
      openTasks: openTasks.length,
      completedTasks,
      completionRate,
      overdueTasks,
      dueSoonTasks,
      urgentOpenTasks,
      unassignedTasks,
    },
    statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      label: statusLabels[status] || status,
      count,
    })),
    riskTasks,
    workload,
    recommendations: buildRecommendations({ projects, tasks, riskTasks, workload }),
  };
};

const keywordProfiles = [
  {
    test: /(auth|login|user|account|security)/i,
    tasks: [
      'Define auth requirements',
      'Design secure login flow',
      'Build API endpoints',
      'Add validation and rate limits',
      'Connect audit logging',
      'Review access-control edge cases',
      'Write auth test cases',
    ],
  },
  {
    test: /(payment|checkout|stripe|billing|invoice)/i,
    tasks: [
      'Map checkout states',
      'Create payment intent API',
      'Build checkout UI',
      'Handle webhooks and failures',
      'Add reconciliation view',
      'Document payment runbook',
      'Test payment edge cases',
    ],
  },
  {
    test: /(analytics|dashboard|report|chart|metric)/i,
    tasks: [
      'Define KPI model',
      'Create aggregation endpoint',
      'Build chart components',
      'Add filters and date ranges',
      'Add drill-down states',
      'Write analytics QA checklist',
      'Validate dashboard data',
    ],
  },
  {
    test: /(ai|assistant|recommend|predict|automation)/i,
    tasks: [
      'Define AI use case and guardrails',
      'Prepare feature signals',
      'Build recommendation service',
      'Design assistant UI',
      'Add feedback loop',
      'Create monitoring dashboard',
      'Evaluate output quality',
    ],
  },
  {
    test: /(mobile|responsive|app|android|ios)/i,
    tasks: [
      'Audit mobile layouts',
      'Design touch interactions',
      'Optimize responsive components',
      'Test common devices',
      'Tune performance on low-end devices',
      'Prepare app-store release checklist',
      'Polish accessibility states',
    ],
  },
];

const defaultTasks = [
  'Clarify scope and acceptance criteria',
  'Design user flow',
  'Implement backend contract',
  'Build frontend experience',
  'Define rollout plan',
  'Create demo and documentation',
  'Test and document the feature',
];

const generateTaskBreakdown = ({ goal, projectName }) => {
  const profile = keywordProfiles.find((item) => item.test.test(goal));
  const taskTitles = profile?.tasks || defaultTasks;
  const priorities = ['high', 'high', 'medium', 'medium', 'medium', 'low', 'low'];

  return taskTitles.map((title, index) => ({
    title,
    description: `${title} for ${projectName || 'the selected project'}: ${goal}`,
    status: index === 0 ? 'todo' : 'backlog',
    priority: priorities[index] || 'medium',
    estimatedHours: index < 2 ? 4 : 6,
    confidence: Number((0.86 - index * 0.04).toFixed(2)),
  }));
};

module.exports = {
  buildAiInsights,
  generateTaskBreakdown,
};
