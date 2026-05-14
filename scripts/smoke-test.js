const assert = require('node:assert/strict');

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';

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
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const detail = payload.error || payload.raw || response.statusText;
    throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${detail}`);
  }

  return payload;
};

const run = async () => {
  const suffix = Date.now();
  const user = {
    name: 'Smoke Test User',
    email: `smoke-${suffix}@taskflowai.com`,
    password: 'password123',
  };

  console.log(`Smoke test target: ${BASE_URL}`);

  const health = await request('/health');
  assert.equal(health.status, 'OK');
  console.log('health ok');

  const registration = await request('/auth/register', {
    method: 'POST',
    body: user,
  });
  const token = registration.data.token;
  assert.ok(token);
  console.log('auth register ok');

  const me = await request('/auth/me', { token });
  assert.equal(me.data.email, user.email);
  console.log('auth me ok');

  const project = await request('/projects', {
    method: 'POST',
    token,
    body: {
      name: `Smoke Project ${suffix}`,
      description: 'Real API smoke test project',
      color: '#14b8a6',
      icon: 'QA',
      tags: ['smoke', 'api'],
    },
  });
  const projectId = project.data._id;
  assert.ok(projectId);
  console.log('project create ok');

  const task = await request('/tasks', {
    method: 'POST',
    token,
    body: {
      project: projectId,
      title: 'Verify real task flow',
      description: 'Created by smoke-test.js',
      status: 'todo',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  const taskId = task.data._id;
  assert.ok(taskId);
  console.log('task create ok');

  const movedTask = await request(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    token,
    body: { status: 'done' },
  });
  assert.equal(movedTask.data.status, 'done');
  console.log('task status update ok');

  const dashboard = await request('/dashboard', { token });
  assert.ok(Number.isInteger(dashboard.data.overview.totalTasks));
  console.log('dashboard ok');

  const insights = await request('/ai/insights', { token });
  assert.ok(Number.isInteger(insights.data.healthScore));
  assert.ok(Array.isArray(insights.data.recommendations));
  console.log('ai insights ok');

  const suggestions = await request('/ai/suggest-tasks', {
    method: 'POST',
    token,
    body: {
      projectId,
      goal: 'Build analytics dashboard for product readiness',
    },
  });
  assert.equal(suggestions.data.tasks.length, 7);
  console.log('ai task suggestions ok');

  await request(`/projects/${projectId}`, {
    method: 'DELETE',
    token,
  });
  console.log('cleanup ok');

  console.log('REAL API SMOKE TEST PASSED');
};

run().catch((error) => {
  console.error('REAL API SMOKE TEST FAILED');
  console.error(error.message);
  process.exit(1);
});
