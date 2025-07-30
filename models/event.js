const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define("Event", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 1000,
      },
    },
  });
