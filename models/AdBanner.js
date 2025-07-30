const mongoose = require('mongoose');

const adBannerSchema = new mongoose.Schema({
    // Direct link to the Business Page that owns this ad
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business', // Assumes you have a 'Business' model
        required: [true, 'A business must be linked to the ad banner']
    },
    // The main promotional text for the banner (short and impactful)
    headline: {
        type: String,
        required: [true, 'Ad banner headline is required'],
        trim: true,
        maxlength: [80, 'Headline cannot exceed 80 characters for a flash banner'] // Keep it concise
    },
    // Optional, very brief supporting text if needed
    callToAction: {
        type: String,
        trim: true,
        default: 'Learn More', // Common CTA
        maxlength: [30, 'Call to action cannot exceed 30 characters']
    },
    // URL for the banner image/GIF
    bannerImage: {
        type: String,
        required: [true, 'Banner image URL is required'],
        trim: true,
        // Basic URL validation
        match: [/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/, 'Please provide a valid image URL']
    },
    // The destination URL when the banner is clicked (e.g., business page, product page)
    targetUrl: {
        type: String,
        trim: true,
        // Match for valid URLs
        match: [/^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/[a-zA-Z0-9]+\.[^\s]{2,}|[a-zA-Z0-9]+\.[^\s]{2,})$/, 'Please provide a valid target URL']
    },
    // Status flags
    isPaid: { // Renamed from paidAd for clarity
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Start and End dates for scheduling ads
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('AdBanner', adBannerSchema);