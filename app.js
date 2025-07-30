const express = require("express");
const bodyParser = require("body-parser");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

app.use(bodyParser.json());
app.use("/events", eventRoutes);

app.get("/", (req, res) => {
  res.send("🎉 Event Management API is running!");
});

module.exports = app;
