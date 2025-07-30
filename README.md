# 🎉 Event Management REST API

A fully functional Event Management API built with **Node.js**, **Express**, and **PostgreSQL**. This project handles event creation, user registration, capacity tracking, and provides event statistics — with all key backend validations in place.

---

## 🚀 Features

- Create and manage events (title, date/time, location, capacity)
- Register users for events (with email uniqueness)
- Prevent duplicate, over-capacity, and past-event registrations
- Cancel user registrations
- List upcoming events (sorted by date, then location)
- View event stats (registrations, remaining seats, capacity %)

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Query Layer:** `pg` Node module
- **Environment:** dotenv for config, nodemon for dev

---

## 📦 Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/prathmesh-git/event-management-api.git
cd event-management-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root with your PostgreSQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=eventdb
DB_PORT=5432
```

### 4. Create the Database

In PostgreSQL:

```sql
CREATE DATABASE eventdb;
```

Then run:

```sql
-- Inside eventdb
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date_time TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0 AND capacity <= 1000)
);

CREATE TABLE registrations (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  event_id INT REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);
```

### 5. Run the Server

```bash
npm run dev
```

---

## 📬 API Endpoints

### ✅ Create Event

`POST /events`

```json
{
  "title": "DevFest",
  "date_time": "2025-08-20T09:30:00Z",
  "location": "Mumbai",
  "capacity": 200
}
```

---

### 📥 Get Event Details

`GET /events/:id`

---

### 👥 Register for Event

`POST /events/:id/register`

```json
{
  "name": "Prathmesh",
  "email": "prathmesh@example.com"
}
```

---

### ❌ Cancel Registration

`DELETE /events/:eventId/register/:userId`

---

### 📅 List Upcoming Events

`GET /events/upcoming/list`

---

### 📊 Get Event Stats

`GET /events/:id/stats`

```json
{
  "total_registrations": 120,
  "remaining_capacity": 80,
  "percent_full": 60
}
```

---

## 📁 Folder Structure

```
event-management-api/
├── controllers/
│   └── eventController.js
├── models/
│   └── db.js
├── routes/
│   └── eventRoutes.js
├── .env
├── app.js
├── server.js
└── README.md
```

---

## 🧠 Business Logic Rules

- Max capacity of 1000 per event
- Cannot register for past events
- No duplicate registrations
- Proper error codes and messages
- Clean and efficient PostgreSQL queries

---

## 💡 Future Improvements

- Add authentication
- Add admin dashboard
- Add event image uploads
- Pagination and search in listings

---

## 👨‍💻 Author

- **Prathmesh**
- GitHub: [prathmesh-git](https://github.com/prathmesh-git)

---

## 🏁 License

This project is for educational purposes as part of a backend task challenge.
