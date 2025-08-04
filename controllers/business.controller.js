const Business = require('../models/Business'); // Path to your Business Mongoose model
const User = require('../models/User'); // Path to your User Mongoose model (for owner validation/population)
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation

// @desc    Create a new business page
// @route   POST /api/businesses
// @access  Private (Auth required)
exports.createBusiness = async (req, res) => {
  try {
    const ownerId = req.user.id; // Get owner ID from authenticated user
    const {
      businessName, slogan, aboutUs, email, phone, whatsappLink, website,
      address, city, state, country, zipCode, logo, coverPicture, media,
      category, services, openingHours, campaign, paidAd, isActive, socialMedia
    } = req.body;

    // Basic validation (more comprehensive validation can be done with libraries like Joi or Express-validator)
    if (!businessName || !email || !category) {
      return res.status(400).json({ message: 'Business name, email, and category are required.' });
    }

    // Check if a business with this email already exists
    const existingBusiness = await Business.findOne({ email });
    if (existingBusiness) {
      return res.status(400).json({ message: 'A business with this email already exists.' });
    }

    const newBusiness = await Business.create({
      businessName, slogan, aboutUs, email, phone, whatsappLink, website,
      address, city, state, country, zipCode, logo, coverPicture, media,
      category, services, openingHours, campaign, paidAd, isActive, socialMedia,
      owner: ownerId // Assign the authenticated user as the owner
    });

    // Optionally, add the business ID to the owner's user profile
    const ownerUser = await User.findById(ownerId);
    if (ownerUser) {
      if (!ownerUser.businessPage) {
        ownerUser.businessPage = [];
      }
      ownerUser.businessPage.push(newBusiness._id);
      await ownerUser.save();
    }

    // Populate owner details before sending response
    const populatedBusiness = await Business.findById(newBusiness._id).populate('owner', 'username email avatar');

    res.status(201).json(populatedBusiness);
  } catch (error) {
    console.error('Error creating business:', error);
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    // Handle duplicate key error (e.g., unique email)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate field value entered. Please use another value.' });
    }
    res.status(500).json({ message: 'Server error during business creation.' });
  }
};

// @desc    Get a single business page by ID
// @route   GET /api/businesses/:id
// @access  Public
exports.getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid business ID format.' });
    }

    const business = await Business.findById(id).populate('owner', 'username email avatar');

    if (!business) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    // Increment view count (optional, but good for business pages)
    business.viewsCount = (business.viewsCount || 0) + 1;
    await business.save();

    res.status(200).json(business);
  } catch (error) {
    console.error('Error fetching business by ID:', error);
    res.status(500).json({ message: 'Server error while fetching business.' });
  }
};

// @desc    Get all business pages (can be filtered/paginated)
// @route   GET /api/businesses
// @access  Public
exports.getAllBusinesses = async (req, res) => {
  try {
    // Implement pagination, filtering, and sorting here if needed
    const businesses = await Business.find({ isActive: true }).populate('owner', 'username email avatar').sort({ createdAt: -1 });
    res.status(200).json(businesses);
  } catch (error) {
    console.error('Error fetching all businesses:', error);
    res.status(500).json({ message: 'Server error while fetching businesses.' });
  }
};

// @desc    Get businesses owned by the authenticated user
// @route   GET /api/businesses/my
// @access  Private (Auth required)
exports.getBusinessesByOwner = async (req, res) => {
  try {
    const ownerId = req.user.id; // Get owner ID from authenticated user

    const businesses = await Business.find({ owner: ownerId }).populate('owner', 'username email avatar').sort({ createdAt: -1 });

    res.status(200).json(businesses);
  } catch (error) {
    console.error('Error fetching businesses by owner:', error);
    res.status(500).json({ message: 'Server error while fetching owned businesses.' });
  }
};

// @desc    Update a business page
// @route   PUT /api/businesses/:id
// @access  Private (Owner or Admin only)
exports.updateBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id; // Authenticated user
    const isAdmin = req.user.isAdmin; // Assuming isAdmin is available on req.user

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid business ID format.' });
    }

    const business = await Business.findById(id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    // Check if the authenticated user is the owner or an admin
    if (business.owner.toString() !== currentUserId && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this business.' });
    }

    // Update fields from req.body
    const updatedBusiness = await Business.findByIdAndUpdate(
      id,
      req.body, // Directly apply updates from body
      { new: true, runValidators: true } // Return the updated document and run schema validators
    ).populate('owner', 'username email avatar');

    res.status(200).json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate field value entered. Please use another value.' });
    }
    res.status(500).json({ message: 'Server error during business update.' });
  }
};

// @desc    Delete a business page
// @route   DELETE /api/businesses/:id
// @access  Private (Owner or Admin only)
exports.deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid business ID format.' });
    }

    const business = await Business.findById(id);

    if (!business) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    // Check if the authenticated user is the owner or an admin
    if (business.owner.toString() !== currentUserId && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this business.' });
    }

    await business.deleteOne(); // Use deleteOne() for Mongoose 6+

    // Optionally, remove the business ID from the owner's user profile
    const ownerUser = await User.findById(business.owner);
    if (ownerUser && ownerUser.businessPage) {
      ownerUser.businessPage = ownerUser.businessPage.filter(
        (bizId) => bizId.toString() !== business._id.toString()
      );
      await ownerUser.save();
    }

    res.status(200).json({ message: 'Business deleted successfully.' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ message: 'Server error during business deletion.' });
  }
};

// @desc    Search for business pages
// @route   GET /api/businesses/search?q=query
// @access  Public
exports.searchBusinesses = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

    const businesses = await Business.find({
      isActive: true, // Only search active businesses
      $or: [
        { businessName: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { slogan: { $regex: searchRegex } },
        { aboutUs: { $regex: searchRegex } },
        { city: { $regex: searchRegex } },
        { state: { $regex: searchRegex } },
        { country: { $regex: searchRegex } },
      ],
    }).populate('owner', 'username email avatar').limit(20); // Limit search results

    res.status(200).json(businesses);
  } catch (error) {
    console.error('Error searching businesses:', error);
    res.status(500).json({ message: 'Server error during business search.' });
  }
};
