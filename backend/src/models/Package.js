import mongoose from 'mongoose';
import slugify from 'slugify';

const packageSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Package name is required'],
        trim: true,
        maxlength: [100, 'Package name cannot be more than 100 characters'],
        unique: true
    },
    
    // Descriptions
    description: {
        type: String,
        trim: true,
        default: ''
    },
    
    // Pricing
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: [0, 'Price cannot be negative']
    },
    
    // Categorization
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'wedding', 
            'corporate', 
            'birthday', 
            'conference',
            'exhibition', 
            'private',
            'charity',
            'concert',
            'festival',
            'other'
        ],
        default: 'other',
        index: true
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Additional fields with defaults
    features: [{
        type: String,
        trim: true
    }],
    
    images: [{
        url: String,
        altText: String,
        isPrimary: Boolean
    }],
    
    includedServices: [{
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service'
        },
        name: String,
        quantity: {
            type: Number,
            default: 1
        }
    }],
    
    includedEquipment: [{
        equipmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment'
        },
        name: String,
        quantity: {
            type: Number,
            default: 1
        }
    }],
    
    specifications: {
        type: Map,
        of: String
    },
    
    // Metadata
    isPopular: {
        type: Boolean,
        default: false
    },
    
    isFeatured: {
        type: Boolean,
        default: false
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    bookingCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Custom Fields
    customFields: mongoose.Schema.Types.Mixed
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Remove sensitive/private fields when converting to JSON
            delete ret.__v;
            delete ret.createdBy;
            delete ret.updatedBy;
            delete ret.customFields;
            return ret;
        }
    },
    toObject: { 
        virtuals: true,
        transform: function(doc, ret) {
            // Remove sensitive/private fields when converting to object
            delete ret.__v;
            delete ret.createdBy;
            delete ret.updatedBy;
            delete ret.customFields;
            return ret;
        }
    }
});

// Virtuals for imageUrl to map to primary image in images[]
packageSchema.virtual('imageUrl')
    .get(function() {
        if (Array.isArray(this.images) && this.images.length > 0) {
            const primary = this.images.find(i => i && i.isPrimary && i.url) || this.images[0];
            return primary?.url || '';
        }
        return '';
    })
    .set(function(url) {
        if (!url) return;
        // Initialize images array if missing
        if (!Array.isArray(this.images)) this.images = [];
        // If an entry exists, update the primary or first
        if (this.images.length > 0) {
            // Ensure exactly one primary
            this.images = this.images.map((img, idx) => ({
                ...(img || {}),
                url: idx === 0 ? url : (img?.url || ''),
                isPrimary: idx === 0
            }));
        } else {
            this.images.push({ url, isPrimary: true });
        }
    });

// Virtual for getting the final price after discount
packageSchema.virtual('finalPrice').get(function() {
    return this.discountPrice > 0 ? this.discountPrice : this.basePrice;
});

// Virtual for checking if package is on sale
packageSchema.virtual('isOnSale').get(function() {
    return this.discountPrice > 0 && this.discountPrice < this.basePrice;
});

// Virtual for getting the discount percentage
packageSchema.virtual('discountPercentage').get(function() {
    if (!this.isOnSale) return 0;
    return Math.round(((this.basePrice - this.discountPrice) / this.basePrice) * 100);
});

// Virtual for getting the total duration including setup and teardown
packageSchema.virtual('totalDurationHours').get(function() {
    return this.durationHours + (this.setupTime || 0) / 60 + (this.teardownTime || 0) / 60;
});

// Virtual for getting the price per person
packageSchema.virtual('pricePerPerson').get(function() {
    return this.minGuests > 0 ? (this.finalPrice / this.minGuests).toFixed(2) : 0;
});

// Text index for search functionality
packageSchema.index({ 
    name: 'text', 
    description: 'text',
    shortDescription: 'text',
    'includedServices.serviceName': 'text',
    'includedEquipment.equipmentName': 'text',
    'features.title': 'text',
    'features.description': 'text',
    tags: 'text'
});

// Compound indexes for common queries
packageSchema.index({ isActive: 1, isFeatured: 1 });
packageSchema.index({ category: 1, finalPrice: 1 });
packageSchema.index({ 'rating.average': -1 });
packageSchema.index({ popularity: -1 });
packageSchema.index({ bookingCount: -1 });
packageSchema.index({ createdAt: -1 });
packageSchema.index({ updatedAt: -1 });

// Pre-save hooks
packageSchema.pre('save', async function(next) {
    // Update timestamps
    this.updatedAt = new Date();
    
    // Generate slug from name if not provided or name has changed
    if (this.isModified('name') && !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
    }
    
    // Ensure only one primary image
    if (this.isModified('images') && this.images && this.images.length > 0) {
        const primaryImages = this.images.filter(img => img.isPrimary);
        if (primaryImages.length > 1) {
            // Reset all to non-primary
            this.images.forEach(img => { img.isPrimary = false; });
            // Set first one as primary
            this.images[0].isPrimary = true;
        } else if (primaryImages.length === 0 && this.images.length > 0) {
            // If no primary image, set the first one
            this.images[0].isPrimary = true;
        }
    }
    
    // Validate pricing tiers
    if (this.isModified('pricingTiers') && this.pricingTiers && this.pricingTiers.length > 0) {
        // Sort tiers by minGuests
        this.pricingTiers.sort((a, b) => a.minGuests - b.minGuests);
        
        // Validate no overlapping ranges
        for (let i = 1; i < this.pricingTiers.length; i++) {
            if (this.pricingTiers[i].minGuests <= this.pricingTiers[i - 1].maxGuests) {
                throw new Error(`Pricing tiers overlap between ${this.pricingTiers[i - 1].minGuests}-${this.pricingTiers[i - 1].maxGuests} and ${this.pricingTiers[i].minGuests}-${this.pricingTiers[i].maxGuests}`);
            }
        }
    }
    
    next();
});

// Post-save hook to update related documents
packageSchema.post('save', async function(doc) {
    // Update any related documents or cache
    // This is a placeholder for future implementation
});

// Static methods
packageSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

packageSchema.statics.findByCategory = function(category) {
    return this.find({ 
        category: new RegExp(category, 'i'),
        isActive: true 
    });
};

packageSchema.statics.findFeatured = function(limit = 5) {
    return this.find({ 
        isActive: true,
        isFeatured: true 
    }).limit(parseInt(limit));
};

// Instance methods
packageSchema.methods.calculatePrice = function(guestCount, options = {}) {
    // Default to base price if no pricing tiers
    if (!this.pricingTiers || this.pricingTiers.length === 0) {
        return this.finalPrice;
    }
    
    // Find the appropriate pricing tier
    const tier = this.pricingTiers.find(t => 
        guestCount >= t.minGuests && 
        guestCount <= t.maxGuests && 
        t.isActive !== false
    );
    
    if (!tier) {
        throw new Error(`No pricing tier found for ${guestCount} guests`);
    }
    
    // Calculate base price plus any additional guests
    const additionalGuests = Math.max(0, guestCount - tier.minGuests);
    return tier.basePrice + (additionalGuests * (tier.pricePerAdditionalGuest || 0));
};

packageSchema.methods.isAvailableForDate = async function(date) {
    // Check if date is in blackout dates
    const checkDate = new Date(date);
    const isBlackedOut = this.blackoutDates.some(blackout => {
        const start = new Date(blackout.startDate);
        const end = blackout.endDate ? new Date(blackout.endDate) : new Date(blackout.startDate);
        return checkDate >= start && checkDate <= end;
    });
    
    if (isBlackedOut) return false;
    
    // Check if day of week is available
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (!this.availableDays || !this.availableDays.includes(dayOfWeek)) {
        return false;
    }
    
    // Add additional availability checks here (e.g., check bookings)
    // This is a placeholder - implement based on your booking system
    
    return true;
};

packageSchema.methods.incrementViewCount = async function() {
    this.viewCount += 1;
    await this.save();
    return this.viewCount;
};

packageSchema.methods.incrementBookingCount = async function() {
    this.bookingCount += 1;
    await this.save();
    return this.bookingCount;
};

packageSchema.methods.updateRating = async function(newRating) {
    if (newRating < 0 || newRating > 5) {
        throw new Error('Rating must be between 0 and 5');
    }
    
    const currentTotal = this.rating.average * this.rating.count;
    this.rating.count += 1;
    this.rating.average = (currentTotal + newRating) / this.rating.count;
    
    await this.save();
    return this.rating;
};

const Package = mongoose.model('Package', packageSchema);

export default Package;