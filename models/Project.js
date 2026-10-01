const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    category: {
      type: String,
      required: [true, 'Please specify project category'],
      enum: [
        'Road construction',
        'Water supply',
        'Drainage',
        'Schools',
        'Health centers',
        'Street lights',
        'Parks',
        'Digital infrastructure',
        'Community halls',
        'Irrigation projects',
      ],
    },
    budget: {
      type: Number,
      required: [true, 'Please add budget amount'],
      min: [0, 'Budget cannot be negative'],
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please add start date'],
    },
    expectedCompletionDate: {
      type: Date,
      required: [true, 'Please add expected completion date'],
    },
    status: {
      type: String,
      enum: ['Proposed', 'Approved', 'Ongoing', 'Completed', 'Delayed'],
      default: 'Proposed',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    images: [
      {
        type: String,
      },
    ],
    documents: [
      {
        type: String,
      },
    ],
    contractorName: {
      type: String,
      required: [true, 'Please add contractor name'],
      trim: true,
    },
    responsibleOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a responsible officer'],
    },
    village: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: [true, 'Please link to a village'],
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
    ratings: [ratingSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);
