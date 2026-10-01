const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a complaint title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description of the issue'],
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: [
        'Road damage',
        'Water leakage',
        'Garbage collection',
        'Electricity issues',
        'Street light problems',
        'Illegal dumping',
        'Public sanitation',
        'Other civic issues',
      ],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    village: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true,
    },
    photo: {
      type: String, // Path to stored image
    },
    gpsLocation: {
      lat: {
        type: Number,
        required: [true, 'Please add latitude'],
      },
      lng: {
        type: Number,
        required: [true, 'Please add longitude'],
      },
    },
    status: {
      type: String,
      enum: ['Submitted', 'In Progress', 'Resolved'],
      default: 'Submitted',
    },
    officerResponse: {
      type: String,
      default: '',
    },
    resolutionDate: {
      type: Date,
    },
    history: [
      {
        status: {
          type: String,
          required: true,
        },
        remarks: {
          type: String,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-populate history before save
complaintSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.history.push({
      status: this.status,
      remarks: this.officerResponse || 'Complaint status updated',
    });
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
