import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/acknowledge", authenticateToken, async (req, res) => {
  try {
    // TODO: Implement policy acknowledgment
    // For now, just acknowledge the request
    res.json({ message: "Policy acknowledged" });
  } catch (error) {
    console.error("Policy acknowledge error:", error);
    res.status(500).json({ error: "Failed to acknowledge policy" });
  }
});

export default router;
