const Sequelize = require("sequelize");

export const sequelize = new Sequelize(process.env.POSTGRESS_URL, {
    dialect: 'postgres'
  });