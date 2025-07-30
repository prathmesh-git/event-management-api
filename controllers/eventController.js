const { sequelize, User, Event, Registration } = require("../models");
const { Op } = require("sequelize");

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

    const event = await Event.create({ title, date_time, location, capacity });

    res.status(201).json({
      message: "Event created successfully",
      event_id: event.id,
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
    const event = await Event.findByPk(eventId, {
      include: {
        model: User,
        attributes: ["id", "name", "email"],
        through: { attributes: [] },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      id: event.id,
      title: event.title,
      date_time: event.date_time,
      location: event.location,
      capacity: event.capacity,
      registered_users: event.Users,
    });
  } catch (error) {
    console.error("Error fetching event details:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /events/:id/register
exports.registerForEvent = async (req, res) => {
  const eventId = req.params.id;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const t = await sequelize.transaction();

  try {
    const event = await Event.findOne({
      where: { id: eventId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: "Event not found" });
    }

    if (new Date(event.date_time) < new Date()) {
      await t.rollback();
      return res.status(403).json({ error: "Cannot register for past event" });
    }

    const [user] = await User.findOrCreate({
      where: { email },
      defaults: { name },
      transaction: t,
    });

    const alreadyRegistered = await Registration.findOne({
      where: { userId: user.id, eventId: event.id },
      transaction: t,
    });

    if (alreadyRegistered) {
      await t.rollback();
      return res
        .status(409)
        .json({ error: "User already registered for this event" });
    }

    const currentCount = await Registration.count({
      where: { eventId: event.id },
      transaction: t,
    });

    if (currentCount >= event.capacity) {
      await t.rollback();
      return res.status(403).json({ error: "Event is full" });
    }

    await Registration.create(
      { userId: user.id, eventId: event.id },
      { transaction: t }
    );
    await t.commit();

    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Registration error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.cancelRegistration = async (req, res) => {
  const { eventId, userId } = req.params;

  try {
    const reg = await Registration.findOne({ where: { eventId, userId } });

    if (!reg) {
      return res
        .status(404)
        .json({ error: "User is not registered for this event" });
    }

    await reg.destroy();
    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Cancel registration error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.listUpcomingEvents = async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.findAll({
      where: {
        date_time: {
          [Op.gt]: now,
        },
      },
      order: [
        ["date_time", "ASC"],
        ["location", "ASC"],
      ],
    });

    res.json({ upcoming_events: events });
  } catch (error) {
    console.error("Error listing upcoming events:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getEventStats = async (req, res) => {
  const eventId = req.params.id;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const totalRegistrations = await Registration.count({ where: { eventId } });
    const remainingCapacity = event.capacity - totalRegistrations;
    const percentFull = Math.round((totalRegistrations / event.capacity) * 100);

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
