import Package from "../models/Package.js";

export const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find(); // ✅ FIXED: It was findx() which is incorrect
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error in getAllNotes controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get featured packages (public)
export const getFeaturedPackages = async (req, res) => {
  try {
    const { limit } = req.query;
    const max = parseInt(limit) || 12;
    const featured = await Package.find({ isActive: true, isFeatured: true }).limit(max);
    return res.status(200).json({ success: true, data: featured });
  } catch (error) {
    console.error('Error in getFeaturedPackages controller', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single package by ID (public)
export const getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error in getPackageById controller', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPackage = async (req, res) => {
    try {
        const { 
          name, 
          category, 
          price, 
          basePrice, 
          description,
          imageUrl,
          images, 
          features, 
          includedServices, 
          includedEquipment, 
          specifications, 
          isPopular, 
          isFeatured 
        } = req.body;

        // Map and sanitize payload to match Package schema
        const payload = {
          name,
          // Schema expects lowercase enum values like 'wedding', 'corporate', etc.
          category: (category || 'other').toLowerCase(),
          // Prefer basePrice; fall back to price if provided
          basePrice: typeof basePrice !== 'undefined' ? basePrice : price,
          description: description || '',
          features: Array.isArray(features) ? features : [],
          images,
          includedServices,
          includedEquipment,
          specifications,
          isPopular: Boolean(isPopular),
          isFeatured: Boolean(isFeatured),
          isActive: true
        };

        // If imageUrl provided, set images accordingly (primary)
        if (imageUrl && (!payload.images || !Array.isArray(payload.images) || payload.images.length === 0)) {
          payload.images = [{ url: imageUrl, isPrimary: true }];
        }

        const newPackage = new Package(payload);
        await newPackage.save();
        res.status(201).json({ message: "Package created successfully", data: newPackage });
      } catch (error) {
        console.error("Error in createPackage controller", error);
        // Handle validation errors
        if (error.name === 'ValidationError') {
          const errors = Object.values(error.errors).map(e => e.message);
          return res.status(400).json({ message: 'Validation failed', errors });
        }
        // Handle duplicate key (e.g., unique name)
        if (error.code === 11000) {
          return res.status(409).json({ message: 'A package with this name already exists.' });
        }
        res.status(500).json({ message: "Internal server error" });
      }
};




export const updatePackage = async (req, res) => {
    try {
      const { 
        name, 
        category, 
        price, 
        basePrice, 
        description,
        imageUrl,
        images, 
        features, 
        includedServices, 
        includedEquipment, 
        specifications, 
        isPopular, 
        isFeatured 
      } = req.body;

      const update = {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category: String(category).toLowerCase() }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features: Array.isArray(features) ? features : [] }),
        ...(images !== undefined && { images }),
        ...(includedServices !== undefined && { includedServices }),
        ...(includedEquipment !== undefined && { includedEquipment }),
        ...(specifications !== undefined && { specifications }),
        ...(isPopular !== undefined && { isPopular: Boolean(isPopular) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      };

      // Handle price mapping
      if (typeof basePrice !== 'undefined') {
        update.basePrice = basePrice;
      } else if (typeof price !== 'undefined') {
        update.basePrice = price;
      }

      // If a single imageUrl is provided, map to images as primary
      if (typeof imageUrl !== 'undefined') {
        if (imageUrl) {
          update.images = [{ url: imageUrl, isPrimary: true }];
        } else {
          update.images = [];
        }
      }

      const updatedPackage = await Package.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true, runValidators: true }
      );
  
      if (!updatedPackage) return res.status(404).json({ message: "Package not found" });
  
      res.status(200).json({ message: "Package updated successfully", data: updatedPackage });
    } catch (error) {
      console.error("Error in updatePackage controller", error);
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({ message: 'Validation failed', errors });
      }
      if (error.code === 11000) {
        return res.status(409).json({ message: 'A package with this name already exists.' });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const deletePackage = async (req, res) => {
    try {
        const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    
        if (!deletedPackage) return res.status(404).json({ message: "Package not found" });
    
        res.status(200).json({ message: "Package deleted successfully" });
      } catch (error) {
        console.error("Error in deletePackage controller", error);
        res.status(500).json({ message: "Internal server error" });
      }
};

// Toggle active status (admin-protected at route level)
export const toggleActiveStatus = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    pkg.isActive = !pkg.isActive;
    await pkg.save();
    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error in toggleActiveStatus controller', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle popular status (admin-protected at route level)
export const togglePopularStatus = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    pkg.isPopular = !pkg.isPopular;
    await pkg.save();
    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    console.error('Error in togglePopularStatus controller', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};