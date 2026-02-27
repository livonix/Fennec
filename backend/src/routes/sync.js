import express from "express";

const router = express.Router();

// Sync settings fetch (temporarily public for development)
router.post("/settings/fetch", async (req, res) => {
  try {
    // Return user settings for sync - format expected by frontend
    // Each key should be [timestamp, JSON string data]
    res.json({
      ordering: [Date.now(), "{}"],
      notifications: [Date.now(), "{}"],
      // Add other settings as needed
    });
  } catch (error) {
    console.error("Sync settings fetch error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Sync unreads fetch (temporarily public for development)
router.get("/unreads", async (req, res) => {
  try {
    // Return unread counts - format expected by frontend
    // Should be an array of unread objects
    res.json([]);
  } catch (error) {
    console.error("Sync unreads fetch error:", error);
    res.status(500).json({ error: "Failed to fetch unreads" });
  }
});

// Sync settings set (temporarily public for development)
router.post("/settings/set", async (req, res) => {
  try {
    const { key, data, timestamp } = req.body;

    // In a real implementation, you would save this to database
    // For now, just acknowledge the update
    console.log("Setting sync data:", { key, timestamp });

    res.json({ success: true });
  } catch (error) {
    console.error("Sync settings set error:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
