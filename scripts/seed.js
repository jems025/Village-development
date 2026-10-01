const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const User = require('../models/User');
const Village = require('../models/Village');
const Project = require('../models/Project');
const Complaint = require('../models/Complaint');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/village_portal');
    console.log('MongoDB connected for seeding...');

    // Clear old data
    await User.deleteMany({});
    await Village.deleteMany({});
    await Project.deleteMany({});
    await Complaint.deleteMany({});
    await Budget.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('Data cleared.');

    // 1. Create Villages
    const villages = await Village.create([
      {
        name: 'Piplantri',
        district: 'Rajsamand',
        state: 'Rajasthan',
        population: 4500,
        sarpanchName: 'Shyam Sunder Paliwal',
        sarpanchContact: '+91 98290 12345',
        gpsLocation: { lat: 25.0748, lng: 73.8824 },
      },
      {
        name: 'Hiware Bazar',
        district: 'Ahmednagar',
        state: 'Maharashtra',
        population: 1250,
        sarpanchName: 'Popatrao Pawar',
        sarpanchContact: '+91 94222 54321',
        gpsLocation: { lat: 18.8924, lng: 74.5829 },
      },
    ]);
    console.log('Villages seeded.');

    const piplantriId = villages[0]._id;
    const hiwareBazarId = villages[1]._id;

    // 2. Create Users
    // NOTE: Pre-save hooks in User.js will hash the passwords automatically
    const admin = new User({
      name: 'District Administrator (Rajsamand)',
      email: 'admin@village.gov.in',
      password: 'admin123',
      role: 'admin',
      phone: '+91 11223 34455',
    });
    await admin.save();

    const officer1 = new User({
      name: 'Rajesh Sharma (Gram Sevak)',
      email: 'officer1@village.gov.in',
      password: 'officer123',
      role: 'officer',
      village: piplantriId,
      phone: '+91 98765 43210',
    });
    await officer1.save();

    const officer2 = new User({
      name: 'Suresh Patil (Gram Sevak)',
      email: 'officer2@village.gov.in',
      password: 'officer123',
      role: 'officer',
      village: hiwareBazarId,
      phone: '+91 99887 76655',
    });
    await officer2.save();

    const citizen1 = new User({
      name: 'Amit Kumar',
      email: 'citizen1@gmail.com',
      password: 'citizen123',
      role: 'citizen',
      village: piplantriId,
      phone: '+91 91234 56789',
    });
    await citizen1.save();

    const citizen2 = new User({
      name: 'Ramesh Kale',
      email: 'citizen2@gmail.com',
      password: 'citizen123',
      role: 'citizen',
      village: hiwareBazarId,
      phone: '+91 92345 67890',
    });
    await citizen2.save();

    console.log('Users seeded.');

    // 3. Create Budgets
    const budgets = await Budget.create([
      {
        village: piplantriId,
        year: 2026,
        totalBudget: 5000000, // 50 Lakhs
        departmentAllocations: [
          { department: 'Roads', allocated: 1500000, spent: 1200000 },
          { department: 'Water Supply', allocated: 1200000, spent: 900000 },
          { department: 'Education', allocated: 800000, spent: 400000 },
          { department: 'Health', allocated: 500000, spent: 300000 },
          { department: 'Sanitation', allocated: 500000, spent: 450000 },
          { department: 'Digital Infrastructure', allocated: 500000, spent: 200000 },
        ],
        auditTrail: [{ action: 'Initial Seeding' }],
      },
      {
        village: hiwareBazarId,
        year: 2026,
        totalBudget: 4000000, // 40 Lakhs
        departmentAllocations: [
          { department: 'Water Supply', allocated: 1500000, spent: 1400000 },
          { department: 'Irrigation', allocated: 1000000, spent: 800000 },
          { department: 'Roads', allocated: 800000, spent: 200000 },
          { department: 'Sanitation', allocated: 400000, spent: 350000 },
          { department: 'Street Lights', allocated: 300000, spent: 150000 },
        ],
        auditTrail: [{ action: 'Initial Seeding' }],
      },
    ]);
    console.log('Budgets seeded.');

    // 4. Create Development Projects
    const projects = await Project.create([
      {
        title: 'Piplantri Bypass Road Concrete Paving',
        description: 'Paving the main bypass corridor connecting the primary school to the rural state highway, allowing safe vehicular transport.',
        category: 'Road construction',
        budget: 1200000,
        spent: 1200000,
        startDate: new Date('2026-01-10'),
        expectedCompletionDate: new Date('2026-04-15'),
        status: 'Completed',
        progress: 100,
        contractorName: 'Marwar Infra Projects Ltd',
        responsibleOfficer: officer1._id,
        village: piplantriId,
        gpsLocation: { lat: 25.0760, lng: 73.8810 },
        ratings: [
          { user: citizen1._id, rating: 5, comment: 'Excellent road quality. Completed on time.' }
        ]
      },
      {
        title: 'Central Drinking Water Pipeline Extension',
        description: 'Extending tap water supply to the eastern hamlet including individual household connections and automated pump sets.',
        category: 'Water supply',
        budget: 900000,
        spent: 600000,
        startDate: new Date('2026-03-01'),
        expectedCompletionDate: new Date('2026-08-30'),
        status: 'Ongoing',
        progress: 65,
        contractorName: 'Apex Water Works Co.',
        responsibleOfficer: officer1._id,
        village: piplantriId,
        gpsLocation: { lat: 25.0735, lng: 73.8845 },
      },
      {
        title: 'Smart Classroom & Computer Lab Setup',
        description: 'Digitizing the Gram Panchayat senior secondary school with computers, broadband, and interactive display boards.',
        category: 'Schools',
        budget: 800000,
        spent: 400000,
        startDate: new Date('2026-05-15'),
        expectedCompletionDate: new Date('2026-10-15'),
        status: 'Ongoing',
        progress: 50,
        contractorName: 'Rajasthan Edutech Solutions',
        responsibleOfficer: officer1._id,
        village: piplantriId,
        gpsLocation: { lat: 25.0745, lng: 73.8820 },
      },
      {
        title: 'Primary Health Center Solar Power Grid',
        description: 'Installing solar panels and backup storage battery banks to provide continuous power for medicine preservation and emergency procedures.',
        category: 'Health centers',
        budget: 500000,
        spent: 0,
        startDate: new Date('2026-08-01'),
        expectedCompletionDate: new Date('2026-12-01'),
        status: 'Approved',
        progress: 0,
        contractorName: 'Surya Jyoti Solar Panels',
        responsibleOfficer: officer1._id,
        village: piplantriId,
        gpsLocation: { lat: 25.0720, lng: 73.8805 },
      },
      // Hiware Bazar projects
      {
        title: 'Water Harvesting & Check Dam Reinforcement',
        description: 'Restoration and structural strengthening of traditional check dams to control rainwater runoff and recharge ground water aquifers.',
        category: 'Irrigation projects',
        budget: 1000000,
        spent: 800000,
        startDate: new Date('2026-02-15'),
        expectedCompletionDate: new Date('2026-06-30'),
        status: 'Delayed',
        progress: 80,
        contractorName: 'Sahyadri Watershed Builders',
        responsibleOfficer: officer2._id,
        village: hiwareBazarId,
        gpsLocation: { lat: 18.8950, lng: 74.5800 },
      },
      {
        title: 'Village Sanitation & Drainage Overhaul',
        description: 'Covering open drains and adding separation tanks to collect and process graywater safely.',
        category: 'Drainage',
        budget: 600000,
        spent: 350000,
        startDate: new Date('2026-04-01'),
        expectedCompletionDate: new Date('2026-09-15'),
        status: 'Ongoing',
        progress: 60,
        contractorName: 'Patil Contracting Services',
        responsibleOfficer: officer2._id,
        village: hiwareBazarId,
        gpsLocation: { lat: 18.8910, lng: 74.5840 },
      },
    ]);
    console.log('Projects seeded.');

    // 5. Create Complaints
    const complaints = await Complaint.create([
      {
        title: 'Broken Pipeline near Public Standpost',
        description: 'Main pipeline leading to the public tap has cracked, causing continuous drinking water wastage and mud accumulation.',
        category: 'Water leakage',
        reportedBy: citizen1._id,
        village: piplantriId,
        gpsLocation: { lat: 25.0730, lng: 73.8850 },
        status: 'In Progress',
        officerResponse: 'Excavation team assigned. Pipe repair scheduled for Friday morning.',
        history: [
          { status: 'Submitted', remarks: 'Complaint submitted by citizen.' },
          { status: 'In Progress', remarks: 'Excavation team assigned. Pipe repair scheduled for Friday morning.' }
        ]
      },
      {
        title: 'Street Light Failure at Main Market Junction',
        description: 'Three consecutive street lights are not functioning, making the junction unsafe for shoppers after dark.',
        category: 'Street light problems',
        reportedBy: citizen1._id,
        village: piplantriId,
        gpsLocation: { lat: 25.0750, lng: 73.8830 },
        status: 'Resolved',
        officerResponse: 'Bulbs and wiring harness replaced. Light operation tested successfully.',
        resolutionDate: new Date('2026-07-12'),
        history: [
          { status: 'Submitted', remarks: 'Complaint submitted by citizen.' },
          { status: 'In Progress', remarks: 'Maintenance crew dispatched.' },
          { status: 'Resolved', remarks: 'Bulbs and wiring harness replaced. Light operation tested successfully.' }
        ]
      },
      {
        title: 'Potholes on High School Approach Road',
        description: 'Large potholes have developed near the school gate, causing minor bike skids. Heavy rains have worsened the issue.',
        category: 'Road damage',
        reportedBy: citizen2._id,
        village: hiwareBazarId,
        gpsLocation: { lat: 18.8930, lng: 74.5815 },
        status: 'Submitted',
        history: [
          { status: 'Submitted', remarks: 'Complaint submitted by citizen.' }
        ]
      },
    ]);
    console.log('Complaints seeded.');

    // 6. Notifications
    await Notification.create([
      {
        title: 'Independence Day Assembly Notice',
        message: 'All villagers are requested to assemble at the Gram Panchayat hall at 8:30 AM on August 15th for flag hoisting.',
        type: 'announcement',
      },
      {
        title: 'New Annual Budget Approved',
        message: 'The District Administration has approved a development budget of ₹5,000,000 for Piplantri village for FY 2026-27.',
        type: 'budget',
        village: piplantriId,
      },
    ]);
    console.log('Notifications seeded.');

    console.log('Database Seeding Successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
