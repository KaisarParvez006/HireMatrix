const bcrypt = require('bcryptjs');
const User = require('../models/Users');

const seedDefaultAdmin = async () => {
  try {
    const existing = await User.findOne({ role: 'Admin' });
    if (existing) return;
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Super Admin',
      email: 'admin@hirematrix.com',
      password: hashed,
      role: 'Admin',
      approvalStatus: 'Approved',
      emailVerified: true,
      isActive: true,
    });
    console.log('Default admin: admin@hirematrix.com / admin123');
  } catch (error) {
    console.error('Failed to seed admin:', error.message);
  }
};

module.exports = seedDefaultAdmin;
