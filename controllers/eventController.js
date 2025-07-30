const pool = require("../models/db");

// POST /events
exports.createEvent = async (req, res) => {
  try {
    const { title, date_time, location, capacity } = req.body;

    if (!title || !date_time || !location || !capacity) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (capacity <= 0 || capacity > 1000) {
      return res
        .status(400)
        .json({ error: "Capacity must be between 1 and 1000" });
    }

    const result = await pool.query(
      `INSERT INTO events (title, date_time, location, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title, date_time, location, capacity]
    );

    res.status(201).json({
      message: "Event created successfully",
      event_id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /events/:id
exports.getEventDetails = async (req, res) => {
  const eventId = req.params.id;

  try {
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [
      eventId,
    ]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];

    const userResult = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       INNER JOIN registrations r ON u.id = r.user_id
       WHERE r.event_id = $1`,
      [eventId]
    );

    res.json({
      ...event,
      registered_users: userResult.rows,
    });
  } catch (error) {
    console.error("Error fetching event details:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.registerForEvent = async (req, res) => {
  const eventId = req.params.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    // 1. Check if event exists and is in the future
    const eventResult = await pool.query(`SELECT * FROM events WHERE id = $1`, [
      eventId,
    ]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];
    const now = new Date();
    const eventTime = new Date(event.date_time);

    if (eventTime < now) {
      return res.status(403).json({ error: "Cannot register for past event" });
    }

    // 2. Get or create user
    let userResult = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    let userId;
    if (userResult.rows.length === 0) {
      const insertUser = await pool.query(
        `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id`,
        [name, email]
      );
      userId = insertUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    // 3. Check for duplicate registration
    const regCheck = await pool.query(
      `SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    if (regCheck.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "User already registered for this event" });
    }

    // 4. Check if event is full
    const regCount = await pool.query(
      `SELECT COUNT(*) FROM registrations WHERE event_id = $1`,
      [eventId]
    );

    const totalRegistered = parseInt(regCount.rows[0].count);
    if (totalRegistered >= event.capacity) {
      return res.status(403).json({ error: "Event is full" });
    }

    // 5. Register user
    await pool.query(
      `INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)`,
      [userId, eventId]
    );

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.cancelRegistration = async (req, res) => {
  const { eventId, userId } = req.params;

  try {
    // Check if registration exists
    const check = await pool.query(
      `SELECT * FROM registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (check.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "User is not registered for this event" });
    }

    // Delete the registration
    await pool.query(
      `DELETE FROM registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Cancel registration error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.listUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();

    const result = await pool.query(
      `SELECT * FROM events
       WHERE date_time > $1
       ORDER BY date_time ASC, location ASC`,
      [now]
    );

    res.json({ upcoming_events: result.rows });
  } catch (error) {
    console.error("Error listing upcoming events:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getEventStats = async (req, res) => {
  const eventId = req.params.id;

  try {
    // 1. Get event capacity
    const eventResult = await pool.query(
      `SELECT capacity FROM events WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const capacity = eventResult.rows[0].capacity;

    // 2. Count registrations
    const regResult = await pool.query(
      `SELECT COUNT(*) FROM registrations WHERE event_id = $1`,
      [eventId]
    );

    const totalRegistrations = parseInt(regResult.rows[0].count);
    const remainingCapacity = capacity - totalRegistrations;
    const percentFull = Math.round((totalRegistrations / capacity) * 100);

    res.json({
      total_registrations: totalRegistrations,
      remaining_capacity: remainingCapacity,
      percent_full: percentFull,
    });
  } catch (error) {
    console.error("Error getting event stats:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
