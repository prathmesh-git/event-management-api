const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
  }
);

// Load models
const User = require("./user")(sequelize);
const Event = require("./event")(sequelize);
const Registration = require("./registration")(sequelize);

// Associations
User.belongsToMany(Event, { through: Registration });
Event.belongsToMany(User, { through: Registration });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Event,
  Registration,
};
