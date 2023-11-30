import express from 'express';
import bodyParser from 'body-parser';
import { Sequelize, Model, DataTypes, where, Op } from 'sequelize';
import { FLOAT, INTEGER } from 'sequelize';
import { _Property } from './models/property.model';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Determine the environment and load the appropriate .env file
const envFile = process.env.NODE_ENV === 'production' ? 'prod.env' : 'local.env';
dotenv.config({ path: envFile });

// Rest of your imports and application code

const app = express();
const port = 4000;

const sequelize = new Sequelize(process.env.POSTGRESS_URL, {
  host: 'db',
  dialect: 'postgres'
});


// Define Property model


// Sync models with database
sequelize.sync();

// Middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const corsOptions = {
  origin: process.env.CORS_ORIGIN, // Use the environment variable
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
};
app.use(cors(corsOptions)); // Use CORS with options

// CRUD routes for Property model
app.get('/properties', async (req: any, res: any) => {
  try {
    console.log('query', req.query);
    
    const seachTerm = req.query.searchTerm;
    const city: string[] =  req.query.city && String(req.query.city)?.toUpperCase().split(',');
    const zip: string[] = req.query.zip && String(req.query.zip)?.split(',');
    const propertyClasses = req.query.propertyClass && String(req.query.propertyClass)?.split(',');
    const priceMax = req.query.price;
    const sort = req.query.sort && String(req.query.sort)?.split(',');

    const sqftMax = req.query.sqft
    const lot_sizeMax = req.query.lotSize;
    
    const limit = req.query.limit;
    const offset = req.query.offset;

    const properties = await _Property.findAll({
      attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'features', 'year_built', 'garage', 'stories', 'coords', 'images'],
      where: {
        address: { [Op.ne]: null },
        parcel_id: { [Op.ne]: null },
        ...(seachTerm && {
          [Op.or]: {
            address: { [Op.like]: '%' + seachTerm + '%' },
            parcel_id: { [Op.like]: '%' + seachTerm + '%'},
          }
        }),
        ...(city?.length > 0 && {
            city: { [Op.in]: city },
        }),
        ...(zip?.length > 0 && {
            zip: { [Op.in]: zip },
        }),
        ...(propertyClasses?.length > 0 && {
            property_class: { [Op.in]: propertyClasses },
        }),
        ...(priceMax && {
          price: { [Op.lte]: priceMax },
        }),
        ...(sqftMax && {
          square_feet: { [Op.gte]: sqftMax },
        }),
        ...(lot_sizeMax && {
          lot_size: { [Op.gte]: lot_sizeMax },
        }),
      },
      order: sort && [
        [sort[0], sort[1]]
      ],
      limit: limit,
      offset: offset
    });
    
    res.json(properties);
  } catch (error) {
    res.status(500).send('Error retrieving properties.');
  }
});

app.get('/properties/:id', async (req: any, res: any) => {
  try {
    
    const property = await _Property.findByPk(req.params.id, {
      attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'features', 'year_built', 'garage', 'stories', 'coords', 'images'],
    });

    if (property) {
      res.json(property);
    } else {
      res.status(404).send('Property not found.');
    }
  } catch (error) {
    res.status(500).send('Error retrieving the property.');
  }
});

// create an endpoint /properties/zip that returns a list of all unique zip codes in the Property table
app.get('/zip', async (req: any, res: any) => {
  try {
    const properties = await _Property.findAll({
      attributes: ['zip'],
      group: ['zip'],
      where: {
        zip: { [Op.ne]: null }
      }
    });
    // turn the result into an array of strings
    const zipCodes = properties.map((property: any) => property.zip);
    res.json(zipCodes);
  } catch (error) {
    res.status(500).send('Error retrieving properties.');
  }
});

app.post('/properties', async (req: any, res: any) => {
  try {
    const property = await _Property.create(req.body);
    res.json(property);
  } catch (error) {
    res.status(500).send('Error creating the property.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});


process.on('SIGINT', async () => {
  await sequelize.close();
  console.log('Database connection closed.');
  process.exit();
});
