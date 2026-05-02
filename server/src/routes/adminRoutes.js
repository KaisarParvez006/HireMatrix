const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/authMiddleware');
const { getAllUsers, getPendingUsers, updateApproval, updateUser, getReport } = require('../controllers/adminController');

router.get('/users', protect, allowRoles('Admin'), getAllUsers);
router.get('/pending-users', protect, allowRoles('Admin'), getPendingUsers);
router.patch('/users/:id/approval', protect, allowRoles('Admin'), updateApproval);
router.patch('/users/:id', protect, allowRoles('Admin'), updateUser);
router.get('/report', protect, allowRoles('Admin', 'HR'), getReport);

module.exports = router;
