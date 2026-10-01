const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');
const Budget = require('../models/Budget');
const Village = require('../models/Village');
const { protect } = require('../middleware/auth');

// @desc    Get detailed report data for export
// @route   GET /api/reports/export
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const { villageId, type, startDate, endDate } = req.query;
    
    // Authorization: Citizens and Officers can only pull reports for their own village
    let targetVillageId = villageId;
    if (req.user.role !== 'admin') {
      targetVillageId = req.user.village;
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let reportData = {
      village: null,
      projects: [],
      complaints: [],
      budgets: [],
    };

    if (targetVillageId) {
      reportData.village = await Village.findById(targetVillageId);
    }

    // Determine query scopes
    let projectFilter = {};
    let complaintFilter = {};
    let budgetFilter = {};

    if (targetVillageId) {
      projectFilter.village = targetVillageId;
      complaintFilter.village = targetVillageId;
      budgetFilter.village = targetVillageId;
    }

    if (startDate && endDate) {
      projectFilter.createdAt = dateQuery.createdAt;
      complaintFilter.createdAt = dateQuery.createdAt;
    }

    // Fetch required data segments based on report request type
    if (!type || type === 'all' || type === 'projects') {
      reportData.projects = await Project.find(projectFilter)
        .populate('village')
        .populate('responsibleOfficer', 'name');
    }

    if (!type || type === 'all' || type === 'complaints') {
      reportData.complaints = await Complaint.find(complaintFilter)
        .populate('village')
        .populate('reportedBy', 'name');
    }

    if (!type || type === 'all' || type === 'budgets') {
      reportData.budgets = await Budget.find(budgetFilter)
        .populate('village');
    }

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
