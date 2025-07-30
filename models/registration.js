const { DataTypes } = require("sequelize");

module.exports = (sequelize) =>
  sequelize.define(
    "Registration",
    {},
    {
      timestamps: false,
    }
  );
