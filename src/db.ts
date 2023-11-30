const Sequelize = require("sequelize");

export const sequelize = new Sequelize(process.env.POSTGRESS_URL, {
    host: 'db',
    dialect: 'postgres'
  });