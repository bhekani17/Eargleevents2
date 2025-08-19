import express from "express";
import { getAllEquipments,deleteEquipment,updateEquipment,createEquipment } from "../controllers/equipmentsController.js";
const router = express.Router();


router.get("/", getAllEquipments);
router.post("/", createEquipment);
router.put("/:id", updateEquipment);
router.delete("/:id", deleteEquipment);

export default router;

