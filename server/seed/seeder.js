const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
require('dotenv').config({ path: '../.env' });

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow-ai';
    await mongoose.connect(uri);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await User.deleteMany();
    await Project.deleteMany();
    await Task.deleteMany();
    console.log('🗑️  Cleared existing data');

    // Create users
    const users = await User.create([
      {
        name: 'Alex Johnson',
        email: 'alex@taskflow.ai',
        password: 'password123',
        role: 'admin',
        title: 'Product Manager',
        department: 'Product',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@taskflow.ai',
        password: 'password123',
        role: 'manager',
        title: 'Tech Lead',
        department: 'Engineering',
      },
      {
        name: 'Mike Rivera',
        email: 'mike@taskflow.ai',
        password: 'password123',
        role: 'user',
        title: 'Frontend Developer',
        department: 'Engineering',
      },
      {
        name: 'Emily Park',
        email: 'emily@taskflow.ai',
        password: 'password123',
        role: 'user',
        title: 'UI/UX Designer',
        department: 'Design',
      },
      {
        name: 'David Kim',
        email: 'david@taskflow.ai',
        password: 'password123',
        role: 'user',
        title: 'Backend Developer',
        department: 'Engineering',
      },
    ]);
    console.log(`👤 Created ${users.length} users`);

    // Create projects
    const projects = await Project.create([
      {
        name: 'E-Commerce Platform',
        description: 'Building a modern e-commerce platform with React and Node.js. Features include product catalog, shopping cart, payment integration, and order management.',
        color: '#6366f1',
        icon: '🛒',
        status: 'active',
        priority: 'high',
        owner: users[0]._id,
        members: [
          { user: users[1]._id, role: 'admin' },
          { user: users[2]._id, role: 'editor' },
          { user: users[3]._id, role: 'editor' },
        ],
        tags: ['react', 'nodejs', 'mongodb', 'stripe'],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Mobile Banking App',
        description: 'Cross-platform mobile banking application with biometric authentication, real-time transactions, and financial analytics dashboard.',
        color: '#10b981',
        icon: '🏦',
        status: 'active',
        priority: 'critical',
        owner: users[1]._id,
        members: [
          { user: users[0]._id, role: 'viewer' },
          { user: users[4]._id, role: 'editor' },
        ],
        tags: ['react-native', 'fintech', 'security'],
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'AI Chat Assistant',
        description: 'Intelligent chatbot powered by GPT-4 with custom training, multi-language support, and conversation analytics.',
        color: '#f59e0b',
        icon: '🤖',
        status: 'active',
        priority: 'medium',
        owner: users[0]._id,
        members: [
          { user: users[1]._id, role: 'editor' },
          { user: users[4]._id, role: 'editor' },
        ],
        tags: ['ai', 'nlp', 'python', 'openai'],
        dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'Design System v2',
        description: 'Complete redesign of our component library with dark mode, accessibility improvements, and Storybook documentation.',
        color: '#ec4899',
        icon: '🎨',
        status: 'active',
        priority: 'medium',
        owner: users[3]._id,
        members: [
          { user: users[2]._id, role: 'editor' },
        ],
        tags: ['design', 'components', 'storybook', 'a11y'],
        dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
    ]);
    console.log(`📁 Created ${projects.length} projects`);

    // Create tasks for E-Commerce Platform
    const ecommerceTasks = [
      { title: 'Setup project architecture', status: 'done', priority: 'high', assignee: users[1]._id, completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { title: 'Design database schema', status: 'done', priority: 'high', assignee: users[4]._id, completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { title: 'Implement user authentication', status: 'done', priority: 'urgent', assignee: users[4]._id, completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { title: 'Create product listing page', status: 'in-progress', priority: 'high', assignee: users[2]._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { title: 'Build shopping cart functionality', status: 'in-progress', priority: 'high', assignee: users[2]._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { title: 'Design checkout flow UI', status: 'review', priority: 'medium', assignee: users[3]._id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { title: 'Integrate Stripe payment gateway', status: 'todo', priority: 'urgent', assignee: users[4]._id, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      { title: 'Build order management dashboard', status: 'todo', priority: 'medium', assignee: users[2]._id, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { title: 'Implement search & filters', status: 'todo', priority: 'medium', assignee: users[2]._id, dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
      { title: 'Setup CI/CD pipeline', status: 'backlog', priority: 'low', assignee: users[1]._id },
      { title: 'Write API documentation', status: 'backlog', priority: 'low', assignee: users[4]._id },
      { title: 'Performance optimization', status: 'backlog', priority: 'medium' },
    ];

    // Create tasks for Mobile Banking
    const bankingTasks = [
      { title: 'Setup React Native project', status: 'done', priority: 'high', assignee: users[4]._id, completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { title: 'Implement biometric authentication', status: 'in-progress', priority: 'urgent', assignee: users[4]._id, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { title: 'Design transaction history UI', status: 'review', priority: 'high', assignee: users[3]._id, dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
      { title: 'Build real-time balance updates', status: 'todo', priority: 'high', assignee: users[4]._id, dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) },
      { title: 'Security audit & penetration testing', status: 'backlog', priority: 'urgent' },
    ];

    // Create tasks for AI Chat
    const aiTasks = [
      { title: 'Setup OpenAI API integration', status: 'done', priority: 'high', assignee: users[4]._id, completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { title: 'Build conversation management', status: 'in-progress', priority: 'high', assignee: users[4]._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { title: 'Implement multi-language support', status: 'todo', priority: 'medium', assignee: users[1]._id, dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
      { title: 'Create analytics dashboard', status: 'backlog', priority: 'low' },
    ];

    // Create tasks for Design System
    const designTasks = [
      { title: 'Audit existing components', status: 'done', priority: 'high', assignee: users[3]._id, completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { title: 'Design new color palette', status: 'in-progress', priority: 'high', assignee: users[3]._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { title: 'Build Button component', status: 'todo', priority: 'medium', assignee: users[2]._id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { title: 'Build Input component', status: 'todo', priority: 'medium', assignee: users[2]._id, dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) },
      { title: 'Setup Storybook documentation', status: 'backlog', priority: 'low', assignee: users[2]._id },
    ];

    const allTasks = [
      ...ecommerceTasks.map((t, i) => ({
        ...t,
        project: projects[0]._id,
        creator: users[0]._id,
        order: i,
        description: `Task for the E-Commerce Platform project: ${t.title}`,
      })),
      ...bankingTasks.map((t, i) => ({
        ...t,
        project: projects[1]._id,
        creator: users[1]._id,
        order: i,
        description: `Task for the Mobile Banking App project: ${t.title}`,
      })),
      ...aiTasks.map((t, i) => ({
        ...t,
        project: projects[2]._id,
        creator: users[0]._id,
        order: i,
        description: `Task for the AI Chat Assistant project: ${t.title}`,
      })),
      ...designTasks.map((t, i) => ({
        ...t,
        project: projects[3]._id,
        creator: users[3]._id,
        order: i,
        description: `Task for the Design System v2 project: ${t.title}`,
      })),
    ];

    const tasks = await Task.create(allTasks);
    console.log(`✅ Created ${tasks.length} tasks`);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Email: alex@taskflow.ai');
    console.log('   Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

seedData();
