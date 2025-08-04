// backend/routes/business.routes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware'); // Your authentication middleware
const businessController = require('../controllers/business.controller'); // Path to your new controller

// Public routes (no auth required for viewing)
router.get('/', businessController.getAllBusinesses);
router.get('/search', businessController.searchBusinesses);
router.get('/:id', businessController.getBusinessById); // Get single business by ID

// Private routes (auth required)
router.post('/', auth, businessController.createBusiness); // Create a new business
router.put('/:id', auth, businessController.updateBusiness); // Update a business
router.delete('/:id', auth, businessController.deleteBusiness); // Delete a business
router.get('/my', auth, businessController.getBusinessesByOwner); // Get businesses owned by current user

module.exports = router;