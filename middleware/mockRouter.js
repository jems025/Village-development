const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  mockVillages,
  mockUsers,
  mockBudgets,
  mockProjects,
  mockComplaints,
  mockNotifications,
} = require('../config/mockStore');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });
};

// Check if Mongoose is connected
const isConnected = () => global.isDbConnected === true;

// Middleware to fallback if DB not connected
router.use((req, res, next) => {
  if (isConnected()) {
    return next(); // Mongoose will handle it
  }

  // Handle Auth
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = req.body;
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      return res.json({
        success: true,
        token: generateToken(user._id),
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, village: user.village, phone: user.phone }
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (req.path === '/api/auth/me' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = mockUsers.find(u => u._id === decoded.id) || mockUsers[0];
        return res.json({ success: true, user });
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }
    return res.json({ success: true, user: mockUsers[0] });
  }

  // Handle Villages
  if (req.path === '/api/villages' && req.method === 'GET') {
    return res.json({ success: true, count: mockVillages.length, data: mockVillages });
  }

  // Handle Projects
  if (req.path.startsWith('/api/projects') && req.method === 'GET') {
    return res.json({ success: true, count: mockProjects.length, data: mockProjects });
  }

  if (req.path === '/api/projects' && req.method === 'POST') {
    const newProj = {
      _id: 'p_' + Date.now(),
      ...req.body,
      progress: 0,
      spent: 0,
      status: 'Proposed',
      village: mockVillages[0],
    };
    mockProjects.unshift(newProj);
    return res.status(201).json({ success: true, data: newProj });
  }

  // Handle Complaints
  if (req.path.startsWith('/api/complaints') && req.method === 'GET') {
    return res.json({ success: true, count: mockComplaints.length, data: mockComplaints });
  }

  if (req.path === '/api/complaints' && req.method === 'POST') {
    const newComp = {
      _id: 'c_' + Date.now(),
      title: req.body.title || 'Civic Issue',
      description: req.body.description || '',
      category: req.body.category || 'Road damage',
      status: 'Submitted',
      village: mockVillages[0],
      createdAt: new Date(),
    };
    mockComplaints.unshift(newComp);
    return res.status(201).json({ success: true, data: newComp });
  }

  // Handle Budgets
  if (req.path.startsWith('/api/budgets/village') && req.method === 'GET') {
    return res.json({ success: true, data: mockBudgets[0] });
  }

  // Handle Analytics
  if (req.path.startsWith('/api/analytics')) {
    return res.json({
      success: true,
      metrics: {
        totalVillages: mockVillages.length,
        totalProjects: mockProjects.length,
        ongoingProjects: 2,
        completedProjects: 1,
        proposedProjects: 0,
        approvedProjects: 0,
        delayedProjects: 0,
        totalBudgetAllocated: 9000000,
        totalBudgetSpent: 5100000,
        totalComplaints: mockComplaints.length,
        pendingComplaints: 1,
        resolvedComplaints: 1,
      },
      rankings: [
        { villageId: 'v1', name: 'Piplantri', sarpanch: 'Shyam Sunder Paliwal', completionRate: 85 },
        { villageId: 'v2', name: 'Hiware Bazar', sarpanch: 'Popatrao Pawar', completionRate: 75 },
      ],
      village: mockVillages[0],
      budgetDetails: mockBudgets[0],
      charts: {
        complaintCategories: [
          { _id: 'Water leakage', count: 1 },
          { _id: 'Street light problems', count: 1 },
        ]
      }
    });
  }

  // Handle Notifications
  if (req.path === '/api/notifications' && req.method === 'GET') {
    return res.json({ success: true, count: mockNotifications.length, data: mockNotifications });
  }

  // Handle Reports
  if (req.path.startsWith('/api/reports/export')) {
    return res.json({
      success: true,
      data: {
        village: mockVillages[0],
        projects: mockProjects,
        budgets: mockBudgets,
        complaints: mockComplaints,
      }
    });
  }

  // Default fallback for any other POST/PUT
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return res.json({ success: true, message: 'Action registered successfully' });
  }

  next();
});

module.exports = router;
