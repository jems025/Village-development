const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, category, village, search } = req.query;
    let query = {};

    // Filter by village
    if (village) {
      query.village = village;
    } else if (req.user.role !== 'admin' && req.user.village) {
      // Citizens and Officers by default only see projects from their own village, 
      // unless specified otherwise. Let's allow them to see their own village projects or filter.
      query.village = req.user.village;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search query (case-insensitive title/contractor)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { contractorName: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('village')
      .populate('responsibleOfficer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('village')
      .populate('responsibleOfficer', 'name email phone')
      .populate('ratings.user', 'name role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin or Officer)
router.post('/', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      budget,
      startDate,
      expectedCompletionDate,
      contractorName,
      responsibleOfficer,
      village,
      gpsLocation,
    } = req.body;

    // Set initial status: Admin creates as 'Approved', Officer creates as 'Proposed'
    const status = req.user.role === 'admin' ? 'Approved' : 'Proposed';

    const project = await Project.create({
      title,
      description,
      category,
      budget,
      spent: 0,
      startDate,
      expectedCompletionDate,
      status,
      progress: 0,
      contractorName,
      responsibleOfficer: responsibleOfficer || req.user._id,
      village: village || req.user.village,
      gpsLocation,
    });

    // Create a public announcement/notification for the village
    await Notification.create({
      title: `New Project: ${title}`,
      message: `A new project "${title}" in category "${category}" with a budget of ₹${budget.toLocaleString()} has been proposed/approved.`,
      type: 'project',
      village: project.village,
    });

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'CREATE_PROJECT',
      details: `Project '${title}' created in village ${project.village} with status ${status}.`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update project progress, status, spent or images
// @route   PUT /api/projects/:id
// @access  Private (Admin or Officer assigned)
router.put('/:id', protect, authorize('admin', 'officer'), upload.array('files', 5), async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Authorization: Only Admin or the assigned responsible officer can update
    if (req.user.role !== 'admin' && project.responsibleOfficer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    // Process files if uploaded
    let uploadedImages = [];
    let uploadedDocs = [];
    if (req.files) {
      req.files.forEach(file => {
        const fileUrl = `/uploads/${file.filename}`;
        if (file.mimetype.startsWith('image/')) {
          uploadedImages.push(fileUrl);
        } else {
          uploadedDocs.push(fileUrl);
        }
      });
    }

    const {
      title,
      description,
      category,
      budget,
      spent,
      startDate,
      expectedCompletionDate,
      status,
      progress,
      contractorName,
      gpsLocation,
    } = req.body;

    // Check if status changed to push notification
    const oldStatus = project.status;
    const oldProgress = project.progress;

    // Build update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (budget) updateData.budget = Number(budget);
    if (spent) updateData.spent = Number(spent);
    if (startDate) updateData.startDate = startDate;
    if (expectedCompletionDate) updateData.expectedCompletionDate = expectedCompletionDate;
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = Number(progress);
    if (contractorName) updateData.contractorName = contractorName;
    if (gpsLocation) updateData.gpsLocation = typeof gpsLocation === 'string' ? JSON.parse(gpsLocation) : gpsLocation;

    if (uploadedImages.length > 0) {
      updateData.$push = { images: { $each: uploadedImages } };
    }
    if (uploadedDocs.length > 0) {
      if (!updateData.$push) updateData.$push = {};
      updateData.$push.documents = { $each: uploadedDocs };
    }

    project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    // Send notifications on progress/status update
    if (status && status !== oldStatus) {
      await Notification.create({
        title: `Project Status Updated: ${project.title}`,
        message: `The project status has changed from "${oldStatus}" to "${status}".`,
        type: 'project',
        village: project.village,
      });
    } else if (progress !== undefined && Number(progress) !== oldProgress) {
      await Notification.create({
        title: `Project Progress Updated: ${project.title}`,
        message: `Project progress is now ${progress}%.`,
        type: 'project',
        village: project.village,
      });
    }

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'UPDATE_PROJECT',
      details: `Project '${project.title}' updated. Progress: ${project.progress}%, Status: ${project.status}`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Approve a proposed project
// @route   PUT /api/projects/:id/approve
// @access  Private/Admin
router.put('/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.status !== 'Proposed') {
      return res.status(400).json({ success: false, message: 'Project is already approved or started' });
    }

    project.status = 'Approved';
    await project.save();

    await Notification.create({
      title: `Project Approved: ${project.title}`,
      message: `The proposed project "${project.title}" has been approved for village development.`,
      type: 'project',
      village: project.village,
    });

    // Log action
    await AuditLog.create({
      user: req.user._id,
      action: 'APPROVE_PROJECT',
      details: `Approved proposed project '${project.title}'`,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Submit citizen rating and feedback
// @route   POST /api/projects/:id/rate
// @access  Private (Citizens only)
router.post('/:id/rate', protect, authorize('citizen'), async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if citizen has already rated this project
    const alreadyRated = project.ratings.some(
      r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyRated) {
      return res.status(400).json({ success: false, message: 'You have already rated this project' });
    }

    project.ratings.push({
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    await project.save();

    res.status(201).json({ success: true, message: 'Rating added successfully', data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
