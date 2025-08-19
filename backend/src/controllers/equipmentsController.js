import Equipment from "../models/equipments.js";

export const getAllEquipments = async (req, res) => {
  try {
    const equipments = await Equipment.find();
    res.status(200).json(equipments);
  } catch (error) {
    console.error("Error in getAllEquipments controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const createEquipment = async (req, res) => {
    try {
        console.log('Create Equipment Request Body:', JSON.stringify(req.body, null, 2));
        
        const { 
            name, 
            category, 
            pricePerDay, 
            images = [], 
            features = [], 
            specifications = {}, 
            availability = true, 
            quantity, 
            condition = 'Good', 
            isPopular = false, 
            description = '' 
        } = req.body;
        
        // Input validation
        const errors = {};
        
        if (!name?.trim()) errors.name = 'Name is required';
        if (!category?.trim()) errors.category = 'Category is required';
        if (pricePerDay === undefined || pricePerDay === '') errors.pricePerDay = 'Price per day is required';
        if (quantity === undefined || quantity === '') errors.quantity = 'Quantity is required';
        
        if (Object.keys(errors).length > 0) {
            console.error('Validation errors:', errors);
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors 
            });
        }
        
        // Create new equipment
        const newEquipment = new Equipment({ 
            name, 
            category, 
            pricePerDay: parseFloat(pricePerDay),
            quantity: parseInt(quantity, 10),
            images: Array.isArray(images) ? images : [],
            features: Array.isArray(features) ? features.filter(f => f && f.trim() !== '') : [],
            specifications: {
                size: specifications?.size || '',
                capacity: specifications?.capacity || '',
                powerRequirements: specifications?.power || specifications?.powerRequirements || '',
                setup: specifications?.setup || ''
            },
            description,
            availability: !!availability,
            condition: ['New', 'Good', 'Fair'].includes(condition) ? condition : 'Good',
            isPopular: !!isPopular
        });
        
        // Save to database
        const savedEquipment = await newEquipment.save();
        
        res.status(201).json({ 
            success: true,
            message: "Equipment created successfully", 
            data: savedEquipment 
        });
        
    } catch (error) {
        console.error("Error in createEquipment controller:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = {};
            Object.keys(error.errors).forEach(key => {
                errors[key] = error.errors[key].message;
            });
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors 
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate field value entered',
                field: Object.keys(error.keyPattern)[0],
                value: error.keyValue[Object.keys(error.keyPattern)[0]]
            });
        }
        
        // Generic error response
        res.status(500).json({ 
            success: false,
            message: error.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const updateEquipment = async (req, res) => {
    try {
        console.log('Update Equipment Request:', {
            id: req.params.id,
            body: req.body
        });

        const { 
            name, 
            category, 
            pricePerDay, 
            images = [], 
            features = [], 
            specifications = {}, 
            availability = true, 
            quantity, 
            condition = 'Good', 
            isPopular = false, 
            description = '' 
        } = req.body;

        // Input validation
        const errors = {};
        
        if (!name?.trim()) errors.name = 'Name is required';
        if (!category?.trim()) errors.category = 'Category is required';
        if (pricePerDay === undefined || pricePerDay === '') errors.pricePerDay = 'Price per day is required';
        if (quantity === undefined || quantity === '') errors.quantity = 'Quantity is required';
        
        if (Object.keys(errors).length > 0) {
            console.error('Update validation errors:', errors);
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed',
                errors 
            });
        }

        const updateData = {
            name,
            category,
            pricePerDay: parseFloat(pricePerDay),
            quantity: parseInt(quantity, 10),
            features: Array.isArray(features) ? features : [],
            specifications: {
                size: specifications?.size || '',
                capacity: specifications?.capacity || '',
                powerRequirements: specifications?.power || specifications?.powerRequirements || '',
                setup: specifications?.setup || ''
            },
            availability: !!availability,
            condition: ['New', 'Good', 'Fair'].includes(condition) ? condition : 'Good',
            isPopular: !!isPopular,
            description: description || ''
        };

        // Only update images if they're provided
        if (Array.isArray(images) && images.length > 0) {
            updateData.images = images;
        }

        const updatedEquipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
  
        if (!updatedEquipment) {
            console.error('Equipment not found with ID:', req.params.id);
            return res.status(404).json({ 
                success: false,
                message: "Equipment not found" 
            });
        }
  
        console.log('Equipment updated successfully:', updatedEquipment._id);
        res.status(200).json({ 
            success: true,
            message: "Equipment updated successfully", 
            data: updatedEquipment 
        });
    } catch (error) {
        console.error("Error in updateEquipment controller:", error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Failed to update equipment",
            ...(process.env.NODE_ENV === 'development' && { error: error.toString() })
        });
    }
};

export const deleteEquipment = async (req, res) => {
    try {
        console.log('Delete Equipment Request ID:', req.params.id);

        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Equipment ID is required'
            });
        }

        // Validate ObjectId format to avoid CastError
        const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(String(req.params.id));
        if (!isValidObjectId) {
            console.warn('Invalid equipment ID format for deletion:', req.params.id);
            return res.status(400).json({
                success: false,
                message: 'Invalid equipment ID format'
            });
        }

        const deletedEquipment = await Equipment.findByIdAndDelete(req.params.id);

        if (!deletedEquipment) {
            console.error('Equipment not found for deletion:', req.params.id);
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        console.log('Equipment deleted successfully:', req.params.id);
        res.status(200).json({
            success: true,
            message: 'Equipment deleted successfully'
        });
    } catch (error) {
        console.error("Error in deleteEquipment controller:", error);
        res.status(500).json({ 
            success: false,
            message: error.message || "Failed to delete equipment",
            ...(process.env.NODE_ENV === 'development' && { error: error.toString() })
        });
    }
};