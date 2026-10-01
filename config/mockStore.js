// Instant Mock Data Store for 0-latency standalone fallback

const mockVillages = [
  {
    _id: 'v1',
    name: 'Piplantri',
    district: 'Rajsamand',
    state: 'Rajasthan',
    population: 4500,
    sarpanchName: 'Shyam Sunder Paliwal',
    sarpanchContact: '+91 98290 12345',
    gpsLocation: { lat: 25.0748, lng: 73.8824 },
  },
  {
    _id: 'v2',
    name: 'Hiware Bazar',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    population: 1250,
    sarpanchName: 'Popatrao Pawar',
    sarpanchContact: '+91 94222 54321',
    gpsLocation: { lat: 18.8924, lng: 74.5829 },
  },
  {
    _id: 'v3',
    name: 'Mawlynnong',
    district: 'East Khasi Hills',
    state: 'Meghalaya',
    population: 950,
    sarpanchName: 'Henry Kharrymba',
    sarpanchContact: '+91 98560 99887',
    gpsLocation: { lat: 25.2012, lng: 91.9160 },
  }
];

const mockUsers = [
  {
    _id: 'u1',
    name: 'District Administrator (Rajsamand)',
    email: 'admin@village.gov.in',
    password: 'admin123',
    role: 'admin',
    phone: '+91 11223 34455',
  },
  {
    _id: 'u2',
    name: 'Rajesh Sharma (Gram Sevak)',
    email: 'officer1@village.gov.in',
    password: 'officer123',
    role: 'officer',
    village: mockVillages[0],
    phone: '+91 98765 43210',
  },
  {
    _id: 'u3',
    name: 'Amit Kumar',
    email: 'citizen1@gmail.com',
    password: 'citizen123',
    role: 'citizen',
    village: mockVillages[0],
    phone: '+91 91234 56789',
  }
];

const mockBudgets = [
  {
    _id: 'b1',
    village: mockVillages[0],
    year: 2026,
    totalBudget: 5000000,
    departmentAllocations: [
      { _id: 'd1', department: 'Roads', allocated: 1500000, spent: 1200000 },
      { _id: 'd2', department: 'Water Supply', allocated: 1200000, spent: 900000 },
      { _id: 'd3', department: 'Education', allocated: 800000, spent: 400000 },
      { _id: 'd4', department: 'Health', allocated: 500000, spent: 300000 },
      { _id: 'd5', department: 'Sanitation', allocated: 500000, spent: 450000 },
      { _id: 'd6', department: 'Digital Infrastructure', allocated: 500000, spent: 200000 },
    ],
    auditTrail: [
      { _id: 'a1', action: 'Initial FY 2026 Allocation', timestamp: new Date() }
    ]
  },
  {
    _id: 'b2',
    village: mockVillages[1],
    year: 2026,
    totalBudget: 4000000,
    departmentAllocations: [
      { _id: 'd7', department: 'Water Supply', allocated: 1500000, spent: 1400000 },
      { _id: 'd8', department: 'Irrigation', allocated: 1000000, spent: 800000 },
      { _id: 'd9', department: 'Roads', allocated: 800000, spent: 200000 },
    ],
    auditTrail: [
      { _id: 'a2', action: 'Initial FY 2026 Allocation', timestamp: new Date() }
    ]
  }
];

const mockProjects = [
  {
    _id: 'p1',
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
    responsibleOfficer: mockUsers[1],
    village: mockVillages[0],
    gpsLocation: { lat: 25.0760, lng: 73.8810 },
    ratings: [
      { user: mockUsers[2]._id, rating: 5, comment: 'Excellent road quality. Completed on time.' }
    ]
  },
  {
    _id: 'p2',
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
    responsibleOfficer: mockUsers[1],
    village: mockVillages[0],
    gpsLocation: { lat: 25.0735, lng: 73.8845 },
  },
  {
    _id: 'p3',
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
    responsibleOfficer: mockUsers[1],
    village: mockVillages[0],
    gpsLocation: { lat: 25.0745, lng: 73.8820 },
  }
];

const mockComplaints = [
  {
    _id: 'c1',
    title: 'Broken Pipeline near Public Standpost',
    description: 'Main pipeline leading to the public tap has cracked, causing continuous drinking water wastage and mud accumulation.',
    category: 'Water leakage',
    reportedBy: mockUsers[2],
    village: mockVillages[0],
    gpsLocation: { lat: 25.0730, lng: 73.8850 },
    status: 'In Progress',
    officerResponse: 'Excavation team assigned. Pipe repair scheduled for Friday morning.',
    createdAt: new Date()
  },
  {
    _id: 'c2',
    title: 'Street Light Failure at Main Market Junction',
    description: 'Three consecutive street lights are not functioning, making the junction unsafe for shoppers after dark.',
    category: 'Street light problems',
    reportedBy: mockUsers[2],
    village: mockVillages[0],
    gpsLocation: { lat: 25.0750, lng: 73.8830 },
    status: 'Resolved',
    officerResponse: 'Bulbs and wiring harness replaced. Light operation tested successfully.',
    createdAt: new Date()
  }
];

const mockNotifications = [
  {
    _id: 'n1',
    title: 'Panchayat General Body Meeting Announced',
    message: 'All villagers and ward members are invited to attend the quarterly Gram Sabha meeting on Sunday at 10 AM.',
    type: 'announcement',
    isRead: false,
    createdAt: new Date()
  },
  {
    _id: 'n2',
    title: 'New Annual Budget Approved',
    message: 'The District Administration has approved a development budget of ₹5,000,000 for Piplantri village for FY 2026-27.',
    type: 'budget',
    isRead: false,
    createdAt: new Date()
  }
];

module.exports = {
  mockVillages,
  mockUsers,
  mockBudgets,
  mockProjects,
  mockComplaints,
  mockNotifications,
};
