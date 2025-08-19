import Service from "../models/Service.js";

export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json(services);
  } catch (error) {
    console.error("Error in getAllServices controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const createService = async (req, res) => {
    try {
        const { name, category, price, priceUnit, images, features, includedServices, includedEquipment, specifications, isPopular, isFeatured } = req.body;
        
        const newService = new Service({ 
          name, 
          category, 
          price, 
          priceUnit, 
          images, 
   
          features, 
          includedServices, 
          includedEquipment, 
          specifications, 
          isPopular, 
          isFeatured 
        });
        
        await newService.save();
        res.status(201).json({ message: "Service created successfully", data: newService });
      } catch (error) {
        console.error("Error in createService controller", error);
        res.status(500).json({ message: "Internal server error" });
      }
};

export const updateService = async (req, res) => {
    try {
      const { name, category, price, priceUnit, images, features, includedServices, includedEquipment, specifications, isPopular, isFeatured } = req.body;
      
      const updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        { name, category, price, priceUnit, images, features, includedServices, includedEquipment, specifications, isPopular, isFeatured },
        {
          new: true,
        }
      );
  
      if (!updatedService) return res.status(404).json({ message: "Service not found" });
  
      res.status(200).json({ message: "Service updated successfully", data: updatedService });
    } catch (error) {
      console.error("Error in updateService controller", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

export const deleteService = async (req, res) => {
    try {
        const deletedService = await Service.findByIdAndDelete(req.params.id);
    
        if (!deletedService) return res.status(404).json({ message: "Service not found" });
    
        res.status(200).json({ message: "Service deleted successfully" });
      } catch (error) {
        console.error("Error in deleteService controller", error);
        res.status(500).json({ message: "Internal server error" });
      }
};