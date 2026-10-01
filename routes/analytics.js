const express = require('express');
const router = express.Router();
const Village = require('../models/Village');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');

// @desc    Get central district-wide dashboard metrics (Admin only)
// @route   GET /api/analytics/district
// @access  Private (Admin)
router.get('/district', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Admin only' });
    }

    // 1. Core counters
    const totalVillages = await Village.countDocuments();
    const totalProjects = await Project.countDocuments();
    const ongoingProjects = await Project.countDocuments({ status: 'Ongoing' });
    const completedProjects = await Project.countDocuments({ status: 'Completed' });
    const delayedProjects = await Project.countDocuments({ status: 'Delayed' });
    const proposedProjects = await Project.countDocuments({ status: 'Proposed' });
    const approvedProjects = await Project.countDocuments({ status: 'Approved' });

    const totalComplaints = await Complaint.countDocuments();
    const resolvedComplaints = await Complaint.countDocuments({ status: 'Resolved' });
    const pendingComplaints = totalComplaints - resolvedComplaints;

    // 2. Budget utilization aggregate
    const budgets = await Budget.find({});
    let totalBudgetAllocated = 0;
    let totalBudgetSpent = 0;
    
    budgets.forEach(b => {
      totalBudgetAllocated += b.totalBudget;
      b.departmentAllocations.forEach(d => {
        totalBudgetSpent += d.spent;
      });
    });

    // 3. Project categories breakdown
    const projectCategories = await Project.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // 4. Complaint categories breakdown
    const complaintCategories = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // 5. Village leaderboard (Performance rank based on completed project ratio)
    const projectsByVillage = await Project.aggregate([
      {
        $group: {
          _id: '$village',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const populatedRankings = await Promise.all(
      projectsByVillage.map(async (item) => {
        const village = await Village.findById(item._id).select('name sarpanchName');
        const ratio = item.total > 0 ? (item.completed / item.total) * 100 : 0;
        return {
          villageId: item._id,
          name: village ? village.name : 'Unknown',
          sarpanch: village ? village.sarpanchName : 'N/A',
          totalProjects: item.total,
          completedProjects: item.completed,
          completionRate: Math.round(ratio),
        };
      })
    );
    populatedRankings.sort((a, b) => b.completionRate - a.completionRate);

    res.json({
      success: true,
      metrics: {
        totalVillages,
        totalProjects,
        ongoingProjects,
        completedProjects,
        delayedProjects,
        proposedProjects,
        approvedProjects,
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        totalBudgetAllocated,
        totalBudgetSpent,
      },
      charts: {
        projectCategories,
        complaintCategories,
      },
      rankings: populatedRankings.slice(0, 5), // top 5 villages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get village-level dashboard metrics (Officer / Citizen)
// @route   GET /api/analytics/village/:villageId
// @access  Private
router.get('/village/:villageId', protect, async (req, res) => {
  try {
    const targetVillageId = req.params.villageId || req.user.village;

    if (!targetVillageId) {
      return res.status(400).json({ success: false, message: 'Village ID is required' });
    }

    // Role check: citizen/officer must match their own village
    if (req.user.role !== 'admin' && req.user.village.toString() !== targetVillageId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this village analytics' });
    }

    const village = await Village.findById(targetVillageId);
    if (!village) {
      return res.status(404).json({ success: false, message: 'Village not found' });
    }

    // 1. Project stats
    const totalProjects = await Project.countDocuments({ village: targetVillageId });
    const ongoingProjects = await Project.countDocuments({ village: targetVillageId, status: 'Ongoing' });
    const completedProjects = await Project.countDocuments({ village: targetVillageId, status: 'Completed' });
    const delayedProjects = await Project.countDocuments({ village: targetVillageId, status: 'Delayed' });
    const proposedProjects = await Project.countDocuments({ village: targetVillageId, status: 'Proposed' });

    // 2. Complaint stats
    const totalComplaints = await Complaint.countDocuments({ village: targetVillageId });
    const resolvedComplaints = await Complaint.countDocuments({ village: targetVillageId, status: 'Resolved' });
    const pendingComplaints = totalComplaints - resolvedComplaints;

    // 3. Budget utilization department-wise
    const budget = await Budget.findOne({ village: targetVillageId }).sort({ year: -1 });

    res.json({
      success: true,
      village,
      metrics: {
        totalProjects,
        ongoingProjects,
        completedProjects,
        delayedProjects,
        proposedProjects,
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        budgetAllocated: budget ? budget.totalBudget : 0,
        budgetSpent: budget ? budget.departmentAllocations.reduce((sum, d) => sum + d.spent, 0) : 0,
      },
      budgetDetails: budget || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
