const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a village name'],
      unique: true,
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'Please add a district name'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'Please add a state name'],
      trim: true,
    },
    population: {
      type: Number,
      required: [true, 'Please add population'],
      min: [0, 'Population cannot be negative'],
    },
    sarpanchName: {
      type: String,
      required: [true, 'Please add Sarpanch name'],
      trim: true,
    },
    sarpanchContact: {
      type: String,
      required: [true, 'Please add Sarpanch contact details'],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Village', villageSchema);
