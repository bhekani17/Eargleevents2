import express from "express";
import { getAllServices, deleteService, updateService, createService } from "../controllers/servicesController.js";
const router = express.Router();

router.get("/", getAllServices);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;