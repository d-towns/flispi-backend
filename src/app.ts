import express from 'express';
import bodyParser from 'body-parser';
import { _Property } from './models/property.model';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { _Blog } from './models/blog.model';
import { _Favorites } from './models/favorites.model';
import { sequelize } from './db';
import { CommonRoutesConfig } from './common/common.routes';
import { PropertiesRoutes } from './routes/properties.routes';
import { BlogRoutes } from './routes/blog.routes';
import { _ServiceItem } from './models/service_item.model';
import { _PropertyServiceItem } from './models/property_service_item';
dotenv.config();

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

const app = express();

const port = process.env.PORT;
const routes: Array<CommonRoutesConfig> = [];


// Sync models with database
sequelize.authenticate()
_ServiceItem.sync();
_PropertyServiceItem.sync();

app.use(cors(
  {
    origin: process.env.CORS_ORIGIN,
    credentials: true
  }
));

// Middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
routes.push(new PropertiesRoutes(app));
routes.push(new BlogRoutes(app));

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});


process.on('SIGINT', async () => {
  await sequelize.close();
  console.log('Database connection closed.');
  process.exit();
});
