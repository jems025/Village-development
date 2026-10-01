const mongoose = require('mongoose');

const departmentAllocationSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    enum: [
      'Roads',
      'Water Supply',
      'Drainage',
      'Education',
      'Health',
      'Sanitation',
      'Digital Infrastructure',
      'Community Development',
      'Irrigation',
      'Street Lights'
    ]
  },
  allocated: {
    type: Number,
    required: true,
    min: 0,
  },
  spent: {
    type: Number,
    default: 0,
    min: 0,
  }
});

const budgetSchema = new mongoose.Schema(
  {
    village: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Village',
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    departmentAllocations: [departmentAllocationSchema],
    auditTrail: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        action: {
          type: String,
          required: true,
        },
        timestamp: {
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

// Ensure budget year is unique per village
budgetSchema.index({ village: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
