const express = require('express');
const router = express.Router();
const Village = require('../models/Village');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all villages
// @route   GET /api/villages
// @access  Private (All authenticated users)
router.get('/', protect, async (req, res) => {
  try {
    let villages;
    if (req.user.role === 'admin') {
      villages = await Village.find({});
    } else {
      // Officers/Citizens might only see their own village or all (for transparency let's show all)
      villages = await Village.find({});
    }
    res.json({ success: true, count: villages.length, data: villages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single village details
// @route   GET /api/villages/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const village = await Village.findById(req.id || req.params.id);
    if (!village) {
      return res.status(404).json({ success: false, message: 'Village not found' });
    }
    res.json({ success: true, data: village });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a new village
// @route   POST /api/villages
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, district, state, population, sarpanchName, sarpanchContact, gpsLocation } = req.body;

    const villageExists = await Village.findOne({ name });
    if (villageExists) {
      return res.status(400).json({ success: false, message: 'Village with this name already exists' });
    }

    const village = await Village.create({
      name,
      district,
      state,
      population,
      sarpanchName,
      sarpanchContact,
      gpsLocation,
    });

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'ADD_VILLAGE',
      details: `Village '${name}' added by Admin.`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: village });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update village details
// @route   PUT /api/villages/:id
// @access  Private (Admin or Officer assigned to that village)
router.put('/:id', protect, async (req, res) => {
  try {
    let village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ success: false, message: 'Village not found' });
    }

    // Role check: Only Admin, or Officer registered to this village can edit it
    if (req.user.role !== 'admin' && !(req.user.role === 'officer' && req.user.village.toString() === req.params.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this village info' });
    }

    const { name, district, state, population, sarpanchName, sarpanchContact, gpsLocation } = req.body;

    village = await Village.findByIdAndUpdate(
      req.params.id,
      { name, district, state, population, sarpanchName, sarpanchContact, gpsLocation },
      { new: true, runValidators: true }
    );

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_VILLAGE',
      details: `Village '${village.name}' details updated.`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: village });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
