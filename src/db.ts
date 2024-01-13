import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
dotenv.config({path: '../.env'});

export const sequelize = new Sequelize(process.env.NODE_ENV === 'production' ? process.env.PROD_POSTGRESS_URL : process.env.POSTGRESS_URL, {
    dialect: 'postgres'
});