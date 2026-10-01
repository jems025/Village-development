const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get budget details for a village
// @route   GET /api/budgets/village/:villageId
// @access  Private
router.get('/village/:villageId', protect, async (req, res) => {
  try {
    const targetVillageId = req.params.villageId || req.user.village;

    if (!targetVillageId) {
      return res.status(400).json({ success: false, message: 'Village ID is required' });
    }

    // Role check: Citizen/Officer can only view their own village budget (Admins see all)
    if (req.user.role !== 'admin' && req.user.village.toString() !== targetVillageId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this village budget' });
    }

    const budget = await Budget.findOne({ village: targetVillageId })
      .populate('village')
      .sort({ year: -1 }); // Get latest year

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget data not found for this village' });
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create/initialize a village budget for a year
// @route   POST /api/budgets
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { village, year, totalBudget, departmentAllocations } = req.body;

    const existingBudget = await Budget.findOne({ village, year });
    if (existingBudget) {
      return res.status(400).json({ success: false, message: `Budget for year ${year} already exists for this village` });
    }

    // Validate allocations total doesn't exceed totalBudget
    const allocatedSum = departmentAllocations.reduce((sum, dept) => sum + Number(dept.allocated), 0);
    if (allocatedSum > totalBudget) {
      return res.status(400).json({
        success: false,
        message: `Sum of department allocations (₹${allocatedSum}) exceeds total budget (₹${totalBudget})`,
      });
    }

    const budget = await Budget.create({
      village,
      year,
      totalBudget,
      departmentAllocations,
      auditTrail: [{ user: req.user._id, action: `Initialized budget for year ${year}` }],
    });

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_BUDGET',
      details: `Created budget for village ${village} (Year: ${year}, Total: ₹${totalBudget})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update allocations and expenses
// @route   PUT /api/budgets/village/:villageId/allocate
// @access  Private (Admin or Officer)
router.put('/village/:villageId/allocate', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const targetVillageId = req.params.villageId;

    // Check permissions
    if (req.user.role !== 'admin' && req.user.village.toString() !== targetVillageId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this budget' });
    }

    const { year, departmentAllocations, totalBudget } = req.body;

    let budget = await Budget.findOne({ village: targetVillageId, year });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found for specified year' });
    }

    // Update total budget if provided
    if (totalBudget) {
      budget.totalBudget = Number(totalBudget);
    }

    // Process new allocations
    if (departmentAllocations) {
      const allocatedSum = departmentAllocations.reduce((sum, dept) => sum + Number(dept.allocated), 0);
      if (allocatedSum > budget.totalBudget) {
        return res.status(400).json({
          success: false,
          message: `Allocations (₹${allocatedSum}) exceed total budget limit (₹${budget.totalBudget})`,
        });
      }
      budget.departmentAllocations = departmentAllocations;
    }

    budget.auditTrail.push({
      user: req.user._id,
      action: 'Updated budget allocations',
    });

    await budget.save();

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_BUDGET',
      details: `Updated budget for village ${targetVillageId} (Year: ${year})`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: budget });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
