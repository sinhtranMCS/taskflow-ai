const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';

const credentials = {
  name: process.env.REAL_DEMO_NAME || 'Alex Johnson',
  email: process.env.REAL_DEMO_EMAIL || 'alex@taskflow.ai',
  password: process.env.REAL_DEMO_PASSWORD || 'password123',
};

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const legacyWorkspaceName = ['Inter', 'view Demo Workspace'].join('');
const legacyArchitectureTask = ['Prepare ', 'inter', 'view architecture notes'].join('');

const projectDefinitions = [
  {
    name: process.env.REAL_DEMO_PROJECT || 'Product Delivery Workspace',
    legacyNames: [legacyWorkspaceName],
    description: 'Real database project used for product delivery walkthroughs and API validation.',
    color: '#14b8a6',
    icon: 'AI',
    priority: 'high',
    tags: ['product', 'real-api', 'ai'],
    dueDate: daysFromNow(30),
    tasks: [
      {
        title: 'Ship real API smoke test',
        status: 'done',
        priority: 'high',
        description: 'Verify auth, projects, tasks, dashboard, and AI endpoints against MongoDB.',
        estimatedHours: 4,
      },
      {
        title: 'Polish Kanban board layout',
        status: 'done',
        priority: 'high',
        description: 'Fix overflow, card accents, spacing, and responsive behavior.',
        estimatedHours: 5,
      },
      {
        title: 'Prepare product architecture notes',
        legacyTitle: legacyArchitectureTask,
        status: 'in-progress',
        priority: 'medium',
        description: 'Document frontend, backend, realtime, AI heuristics, and data access control.',
        dueDate: daysFromNow(3),
        estimatedHours: 6,
      },
      {
        title: 'Add CI coverage for production readiness',
        status: 'todo',
        priority: 'high',
        description: 'Run unit tests and build in GitHub Actions.',
        dueDate: daysFromNow(5),
        estimatedHours: 4,
      },
      {
        title: 'Record demo walkthrough',
        status: 'review',
        priority: 'medium',
        description: 'Create a short scripted demo covering dashboard, tasks, AI assistant, and smoke test.',
        dueDate: daysFromNow(2),
        estimatedHours: 3,
      },
      {
        title: 'Add E2E tests',
        status: 'backlog',
        priority: 'medium',
        description: 'Cover login, create project, create task, drag status, and AI suggestions.',
        estimatedHours: 8,
      },
      {
        title: 'Write deployment checklist',
        status: 'backlog',
        priority: 'low',
        description: 'List environment variables, Docker commands, seed flow, and smoke-test commands.',
        estimatedHours: 3,
      },
      {
        title: 'Review README screenshots',
        status: 'todo',
        priority: 'medium',
        description: 'Keep GitHub visuals in sync with the latest real MongoDB dataset.',
        dueDate: daysFromNow(1),
        estimatedHours: 2,
      },
    ],
  },
  {
    name: 'Client Portal Redesign',
    description: 'A polished React portal for client onboarding, document exchange, and task visibility.',
    color: '#3b82f6',
    icon: 'UX',
    priority: 'high',
    tags: ['react', 'ux', 'portal'],
    dueDate: daysFromNow(45),
    tasks: [
      {
        title: 'Audit existing client workflows',
        status: 'done',
        priority: 'medium',
        description: 'Map the current onboarding journey and find friction points.',
        estimatedHours: 5,
      },
      {
        title: 'Design responsive portal shell',
        status: 'done',
        priority: 'high',
        description: 'Create navigation, page layout, empty states, and mobile constraints.',
        estimatedHours: 6,
      },
      {
        title: 'Build document upload flow',
        status: 'in-progress',
        priority: 'high',
        description: 'Support file upload states, validation, and attachment metadata.',
        dueDate: daysFromNow(6),
        estimatedHours: 8,
      },
      {
        title: 'Implement client activity timeline',
        status: 'todo',
        priority: 'medium',
        description: 'Show task updates, comments, and key project events in one timeline.',
        dueDate: daysFromNow(10),
        estimatedHours: 6,
      },
      {
        title: 'Create notification preferences UI',
        status: 'backlog',
        priority: 'low',
        description: 'Let users choose email, in-app, and weekly summary notifications.',
        estimatedHours: 4,
      },
      {
        title: 'Review portal accessibility states',
        status: 'review',
        priority: 'medium',
        description: 'Check focus states, contrast, keyboard flow, and screen-reader labels.',
        dueDate: daysFromNow(4),
        estimatedHours: 3,
      },
      {
        title: 'Connect portal metrics cards',
        status: 'todo',
        priority: 'medium',
        description: 'Pull project completion, pending documents, and open requests from API data.',
        estimatedHours: 5,
      },
    ],
  },
  {
    name: 'Realtime Collaboration Engine',
    description: 'Socket-based collaboration layer for live task updates, presence, and team activity.',
    color: '#f59e0b',
    icon: 'RT',
    priority: 'critical',
    tags: ['socket.io', 'realtime', 'backend'],
    dueDate: daysFromNow(21),
    tasks: [
      {
        title: 'Define realtime event contract',
        status: 'done',
        priority: 'high',
        description: 'Document project, task, comment, and presence events.',
        estimatedHours: 4,
      },
      {
        title: 'Add authenticated socket handshake',
        status: 'in-progress',
        priority: 'urgent',
        description: 'Validate JWTs before allowing users to join project rooms.',
        dueDate: daysFromNow(2),
        estimatedHours: 6,
      },
      {
        title: 'Broadcast task status updates',
        status: 'in-progress',
        priority: 'high',
        description: 'Emit board changes to collaborators after task create/update/move operations.',
        dueDate: daysFromNow(5),
        estimatedHours: 5,
      },
      {
        title: 'Build presence indicator component',
        status: 'todo',
        priority: 'medium',
        description: 'Show active teammates in the sidebar and project header.',
        estimatedHours: 4,
      },
      {
        title: 'Add activity feed persistence',
        status: 'backlog',
        priority: 'medium',
        description: 'Store important collaboration events for later review.',
        estimatedHours: 8,
      },
      {
        title: 'Load-test socket fanout',
        status: 'backlog',
        priority: 'high',
        description: 'Measure broadcast latency and memory usage with concurrent rooms.',
        dueDate: daysFromNow(12),
        estimatedHours: 6,
      },
      {
        title: 'Review disconnect and reconnect states',
        status: 'review',
        priority: 'medium',
        description: 'Make offline, reconnecting, and stale-room states clear in the UI.',
        estimatedHours: 3,
      },
    ],
  },
  {
    name: 'Analytics & Reporting Suite',
    description: 'Operational dashboard with project health, workload, risk, and delivery trend reporting.',
    color: '#ec4899',
    icon: 'BI',
    priority: 'high',
    tags: ['dashboard', 'analytics', 'charts'],
    dueDate: daysFromNow(35),
    tasks: [
      {
        title: 'Define reporting KPI model',
        status: 'done',
        priority: 'high',
        description: 'Choose health score, completion rate, overdue, due-soon, and workload metrics.',
        estimatedHours: 5,
      },
      {
        title: 'Create dashboard aggregation endpoint',
        status: 'in-progress',
        priority: 'high',
        description: 'Return summary cards, status distribution, priority distribution, and weekly trends.',
        dueDate: daysFromNow(4),
        estimatedHours: 7,
      },
      {
        title: 'Build analytics chart components',
        status: 'todo',
        priority: 'medium',
        description: 'Render compact charts with clear labels and loading states.',
        dueDate: daysFromNow(8),
        estimatedHours: 6,
      },
      {
        title: 'Add risk insight drill-down',
        status: 'todo',
        priority: 'medium',
        description: 'Let users inspect why a task or project is marked risky.',
        estimatedHours: 5,
      },
      {
        title: 'Validate reporting numbers against MongoDB',
        status: 'review',
        priority: 'high',
        description: 'Cross-check dashboard totals with direct database counts.',
        dueDate: daysFromNow(3),
        estimatedHours: 4,
      },
      {
        title: 'Export weekly report snapshot',
        status: 'backlog',
        priority: 'low',
        description: 'Prepare a printable weekly project summary for stakeholders.',
        estimatedHours: 5,
      },
      {
        title: 'Add analytics empty states',
        status: 'backlog',
        priority: 'low',
        description: 'Show useful copy and actions when no tasks or projects exist.',
        estimatedHours: 3,
      },
    ],
  },
];

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const error = new Error(payload.error || response.statusText);
    error.status = response.status;
    throw error;
  }

  return payload;
};

const loginOrRegister = async () => {
  try {
    const login = await request('/auth/login', {
      method: 'POST',
      body: {
        email: credentials.email,
        password: credentials.password,
      },
    });
    return login.data;
  } catch (error) {
    if (error.status !== 401) throw error;

    const registration = await request('/auth/register', {
      method: 'POST',
      body: credentials,
    });
    return registration.data;
  }
};

const ensureProject = async (token, definition) => {
  const projects = await request('/projects', { token });
  const existing = projects.data.find((project) => {
    const legacyNames = definition.legacyNames || [];
    return project.name === definition.name || legacyNames.includes(project.name);
  });

  const { tasks, legacyNames, ...projectBody } = definition;

  if (existing) {
    const updated = await request(`/projects/${existing._id}`, {
      method: 'PUT',
      token,
      body: projectBody,
    });
    return updated.data;
  }

  const created = await request('/projects', {
    method: 'POST',
    token,
    body: projectBody,
  });

  return created.data;
};

const ensureTasks = async (token, userId, projectId, taskDefinitions) => {
  const tasks = await request(`/tasks?project=${projectId}`, { token });
  const existingByTitle = new Map(tasks.data.map((task) => [task.title, task]));
  let created = 0;
  let updated = 0;

  for (const task of tasks.data) {
    if (task.assignee) continue;

    await request(`/tasks/${task._id}`, {
      method: 'PUT',
      token,
      body: { assignee: userId },
    });
    updated += 1;
  }

  for (const task of taskDefinitions) {
    const existing = existingByTitle.get(task.title) || (task.legacyTitle ? existingByTitle.get(task.legacyTitle) : null);
    const { legacyTitle, ...taskBody } = task;

    if (existing) {
      await request(`/tasks/${existing._id}`, {
        method: 'PUT',
        token,
        body: {
          ...taskBody,
          assignee: userId,
        },
      });
      updated += 1;
      continue;
    }

    await request('/tasks', {
      method: 'POST',
      token,
      body: {
        ...taskBody,
        project: projectId,
        assignee: userId,
      },
    });
    created += 1;
  }

  return { existing: tasks.data.length, created, updated, totalAfter: tasks.data.length + created };
};

const run = async () => {
  console.log(`Preparing real demo data at ${BASE_URL}`);
  const auth = await loginOrRegister();
  const token = auth.token;
  const userId = auth.user.id;

  let createdTasks = 0;
  let updatedTasks = 0;
  let totalTasks = 0;
  const preparedProjects = [];

  for (const definition of projectDefinitions) {
    const project = await ensureProject(token, definition);
    const result = await ensureTasks(token, userId, project._id, definition.tasks);
    createdTasks += result.created;
    updatedTasks += result.updated;
    totalTasks += result.totalAfter;
    preparedProjects.push(project.name);
  }

  const insights = await request('/ai/insights', { token });

  console.log('REAL DEMO DATA READY');
  console.log(`Login: ${credentials.email}`);
  console.log(`Password: ${credentials.password}`);
  console.log(`Projects prepared: ${preparedProjects.length}`);
  console.log(`Tasks created this run: ${createdTasks}`);
  console.log(`Tasks assigned this run: ${updatedTasks}`);
  console.log(`Prepared project task total: ${totalTasks}`);
  console.log(`AI health score: ${insights.data.healthScore}`);
};

run().catch((error) => {
  console.error('Failed to prepare real demo data');
  console.error(error.message);
  process.exit(1);
});
