const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get notifications/announcements for current user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {
      $or: [
        // Public announcements for everyone
        { recipient: null, village: null },
        // Announcements targeted to the user's village
        { recipient: null, village: req.user.village },
        // Direct notifications to this user
        { recipient: req.user._id },
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate unread count (recipient matches user and isRead is false OR village matches and user not in readBy)
    const formattedNotifications = notifications.map(notif => {
      let isRead = false;
      if (notif.recipient && notif.recipient.toString() === req.user._id.toString()) {
        isRead = notif.isRead;
      } else {
        isRead = notif.readBy.includes(req.user._id);
      }
      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        createdAt: notif.createdAt,
        isRead,
      };
    });

    res.json({ success: true, count: formattedNotifications.length, data: formattedNotifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notif.recipient && notif.recipient.toString() === req.user._id.toString()) {
      notif.isRead = true;
    } else {
      // It's a public/village-wide announcement, add user to readBy array if not already there
      if (!notif.readBy.includes(req.user._id)) {
        notif.readBy.push(req.user._id);
      }
    }

    await notif.save();
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Publish a public announcement
// @route   POST /api/notifications/announce
// @access  Private (Officer/Admin)
router.post('/announce', protect, authorize('officer', 'admin'), async (req, res) => {
  try {
    const { title, message, targetVillageId } = req.body;

    const notif = await Notification.create({
      title,
      message,
      type: 'announcement',
      village: req.user.role === 'admin' ? targetVillageId || null : req.user.village,
    });

    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
