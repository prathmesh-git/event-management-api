const express = require("express");
const router = express.Router();
const {
  createEvent,
  getEventDetails,
  registerForEvent,
  cancelRegistration,
  listUpcomingEvents,
  getEventStats,
} = require("../controllers/eventController");

// Create a new event
router.post("/", createEvent);

// Upcoming events (should come before /:id or it’ll be treated as a param)
router.get("/upcoming/list", listUpcomingEvents);

// Register for event
router.post("/:id/register", registerForEvent);

// Cancel registration
router.delete("/:eventId/register/:userId", cancelRegistration);

// Get event statistics
router.get("/:id/stats", getEventStats);

// Get event details
router.get("/:id", getEventDetails);

module.exports = router;
