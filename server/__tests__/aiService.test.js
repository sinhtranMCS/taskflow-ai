const { buildAiInsights, generateTaskBreakdown } = require('../services/aiService');

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const buildTask = (overrides = {}) => ({
  _id: `task-${Math.random().toString(36).slice(2, 8)}`,
  title: 'Sample task',
  status: 'todo',
  priority: 'medium',
  assignee: { name: 'Alex' },
  project: { name: 'Demo project' },
  dueDate: daysFromNow(5),
  ...overrides,
});

const buildProject = (overrides = {}) => ({
  _id: `project-${Math.random().toString(36).slice(2, 8)}`,
  name: 'Demo project',
  status: 'active',
  progress: 50,
  dueDate: daysFromNow(30),
  ...overrides,
});

describe('aiService.buildAiInsights', () => {
  it('returns a structured insights payload with deterministic fields', () => {
    const insights = buildAiInsights({ projects: [], tasks: [] });

    expect(insights).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        healthScore: expect.any(Number),
        summary: expect.any(Object),
        statusDistribution: expect.any(Array),
        riskTasks: expect.any(Array),
        workload: expect.any(Array),
        recommendations: expect.any(Array),
      })
    );
    expect(insights.healthScore).toBeGreaterThanOrEqual(0);
    expect(insights.healthScore).toBeLessThanOrEqual(100);
  });

  it('flags overdue urgent tasks as the highest risk', () => {
    const tasks = [
      buildTask({ title: 'Safe task', priority: 'low', dueDate: daysFromNow(20) }),
      buildTask({
        title: 'Overdue urgent task',
        priority: 'urgent',
        dueDate: daysFromNow(-3),
      }),
    ];

    const { riskTasks } = buildAiInsights({ projects: [], tasks });

    expect(riskTasks.length).toBeGreaterThan(0);
    expect(riskTasks[0].title).toBe('Overdue urgent task');
    expect(riskTasks[0].severity).toBe('critical');
    expect(riskTasks[0].reason).toMatch(/overdue/);
  });

  it('reduces the health score when many tasks are overdue', () => {
    const baseTasks = Array.from({ length: 4 }, (_, i) =>
      buildTask({ title: `Task ${i}`, status: 'todo', dueDate: daysFromNow(10) })
    );
    const overdueTasks = Array.from({ length: 4 }, (_, i) =>
      buildTask({
        title: `Overdue ${i}`,
        status: 'todo',
        priority: 'high',
        dueDate: daysFromNow(-2),
      })
    );

    const healthy = buildAiInsights({ projects: [], tasks: baseTasks }).healthScore;
    const unhealthy = buildAiInsights({
      projects: [],
      tasks: [...baseTasks, ...overdueTasks],
    }).healthScore;

    expect(unhealthy).toBeLessThan(healthy);
  });

  it('recommends re-planning projects that are close to due date with low progress', () => {
    const projects = [
      buildProject({
        name: 'At-risk launch',
        dueDate: daysFromNow(7),
        progress: 20,
        status: 'active',
      }),
    ];
    const tasks = [buildTask({ status: 'in-progress' })];

    const { recommendations } = buildAiInsights({ projects, tasks });

    expect(recommendations.some((rec) => rec.title.includes('At-risk launch'))).toBe(true);
  });

  it('always returns at least one recommendation, even on a healthy board', () => {
    const { recommendations } = buildAiInsights({
      projects: [buildProject()],
      tasks: [buildTask({ status: 'done' })],
    });

    expect(recommendations.length).toBeGreaterThan(0);
  });
});

describe('aiService.generateTaskBreakdown', () => {
  it('produces auth-flavored tasks for an auth goal', () => {
    const tasks = generateTaskBreakdown({
      goal: 'Add secure login and account management',
      projectName: 'Acme',
    });

    expect(tasks).toHaveLength(7);
    expect(tasks[0].title.toLowerCase()).toMatch(/auth|secure|login/);
  });

  it('falls back to a generic breakdown for an unknown goal', () => {
    const tasks = generateTaskBreakdown({ goal: 'Improve onboarding tour', projectName: 'Acme' });

    expect(tasks).toHaveLength(7);
    expect(tasks[0].confidence).toBeGreaterThan(0);
    expect(tasks[0].confidence).toBeLessThanOrEqual(1);
  });

  it('assigns a sensible starting status and priority ladder', () => {
    const tasks = generateTaskBreakdown({ goal: 'Build analytics dashboard', projectName: 'Acme' });

    expect(tasks[0].status).toBe('todo');
    expect(tasks[1].status).toBe('backlog');
    expect(['high', 'medium', 'low']).toContain(tasks[0].priority);
  });
});
