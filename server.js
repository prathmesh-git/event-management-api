require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

// Sync Sequelize models before starting the server
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("🧠 Sequelize models synced");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to sync Sequelize models:", err.message);
  });
