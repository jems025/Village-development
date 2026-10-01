const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = {};

    // Filters based on User Role
    if (req.user.role === 'citizen') {
      // Citizen only sees their own complaints
      query.reportedBy = req.user._id;
    } else if (req.user.role === 'officer') {
      // Officer sees all complaints in their village
      query.village = req.user.village;
    }
    // Admin sees everything

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email phone')
      .populate('village')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('village');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Check permissions: Citizens can only see their own complaints, Officers see village ones
    if (req.user.role === 'citizen' && complaint.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
    }

    if (req.user.role === 'officer' && complaint.village._id.toString() !== req.user.village.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
    }

    res.json({ success: true, data: complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    File a new complaint
// @route   POST /api/complaints
// @access  Private (Citizen only)
router.post('/', protect, authorize('citizen'), upload.single('photo'), async (req, res) => {
  try {
    const { title, description, category, gpsLocation } = req.body;

    const parsedGps = typeof gpsLocation === 'string' ? JSON.parse(gpsLocation) : gpsLocation;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : '';

    const complaint = await Complaint.create({
      title,
      description,
      category,
      reportedBy: req.user._id,
      village: req.user.village,
      photo: photoPath,
      gpsLocation: parsedGps,
      status: 'Submitted',
    });

    // Notify village officers that a new complaint has been filed
    // In a real app we might query users with role = officer and village = req.user.village
    await Notification.create({
      title: `New Civic Complaint: ${title}`,
      message: `A new complaint regarding "${category}" has been filed by a citizen in your village.`,
      type: 'complaint',
      village: req.user.village,
    });

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'FILE_COMPLAINT',
      details: `Filed complaint '${title}' under category '${category}'`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Respond or resolve a complaint
// @route   PUT /api/complaints/:id/respond
// @access  Private (Officer or Admin)
router.put('/:id/respond', protect, authorize('officer', 'admin'), async (req, res) => {
  try {
    const { status, officerResponse } = req.body;

    if (!status || !['In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update' });
    }

    let complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Officer check: Must belong to same village
    if (req.user.role === 'officer' && complaint.village.toString() !== req.user.village.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this village complaint' });
    }

    complaint.status = status;
    complaint.officerResponse = officerResponse || '';
    if (status === 'Resolved') {
      complaint.resolutionDate = Date.now();
    }

    await complaint.save();

    // Notify the user who reported it
    await Notification.create({
      recipient: complaint.reportedBy,
      title: `Complaint Update: ${complaint.title}`,
      message: `Your complaint has been updated to "${status}". Officer remarks: ${officerResponse || 'None'}`,
      type: 'complaint',
      village: complaint.village,
    });

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'RESPOND_COMPLAINT',
      details: `Responded to complaint '${complaint.title}' with status ${status}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: complaint });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
