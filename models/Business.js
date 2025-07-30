const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    // Basic Business Information
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        minlength: [2, 'Business name must be at least 2 characters long'],
        maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    slogan: { // Added for a short catchy phrase
        type: String,
        trim: true,
        maxlength: [200, 'Slogan cannot exceed 200 characters']
    },
    aboutUs: {
        type: String,
        trim: true,
        maxlength: [2000, 'About Us cannot exceed 2000 characters'] // Increased length
    },

    // Contact Information
    email: {
        type: String,
        required: [true, 'Email address is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
    },
    phone: {
        type: String,
        trim: true,
        // Optional: Add regex for phone number validation if strict format is needed
        // match: [/^(\+?\d{1,3}[- ]?)?\d{10}$/, 'Please use a valid phone number']
    },
    whatsappLink: { // Consider storing just the number or full URL
        type: String,
        trim: true,
        // Example for a full WhatsApp link validation
        match: [/^(https?:\/\/)?(www\.)?wa\.me\/\d+$/, 'Please provide a valid WhatsApp link (e.g., wa.me/234XXXXXXXXXX)']
    },
    website: { // Added for an official website
        type: String,
        trim: true,
        // Example for a basic URL validation
        match: [/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/, 'Please provide a valid website URL']
    },
    address: {
        type: String,
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    city: { // Added for better location granularity
        type: String,
        trim: true,
        maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: { // Added for better location granularity
        type: String,
        trim: true,
        maxlength: [100, 'State name cannot exceed 100 characters']
    },
    country: { // Added for better location granularity
        type: String,
        trim: true,
        maxlength: [100, 'Country name cannot exceed 100 characters']
    },
    zipCode: { // Added for better location granularity
        type: String,
        trim: true,
        maxlength: [20, 'Zip code cannot exceed 20 characters']
    },

    // Branding & Media
    logo: {
        type: String, // URL to logo image
        trim: true
    },
    coverPicture: {
        type: String, // URL to cover image
        trim: true
    },
    media: [String], // Changed to an array of strings for multiple media URLs
    // Consider adding a 'gallery' or 'videos' array if specific media types are needed

    // Business Operations
    category: { // Added for business classification (e.g., "Restaurant", "Retail", "Service")
        type: String,
        trim: true,
        maxlength: [100, 'Category cannot exceed 100 characters']
    },
    services: [String], // Array of services offered
    openingHours: { // Flexible way to store operating hours
        type: String,
        trim: true,
        maxlength: [500, 'Opening hours description cannot exceed 500 characters']
        // Alternatively, use a more structured object for each day
    },

    // Marketing & Status
    campaign: {
        type: String, // Could store a campaign ID or name
        trim: true
    },
    paidAd: {
        type: Boolean,
        default: false
    },
    isActive: { // Added to easily enable/disable a business page
        type: Boolean,
        default: true
    },

    // Social Media Links (as an object to group them)
    socialMedia: {
        facebook: { type: String, trim: true },
        twitter: { type: String, trim: true },
        instagram: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        // Add other platforms as needed
    },

    // Owner/Creator Information
    owner: { // Link to the User who owns/created this business page
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: true
    }

}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Business', businessSchema);