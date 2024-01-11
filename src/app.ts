import express from 'express';
import bodyParser from 'body-parser';
import { Sequelize, Model, DataTypes, where, Op } from 'sequelize';
import { FLOAT, INTEGER } from 'sequelize';
import { _Property } from './models/property.model';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { _Blog } from './models/blog.model';
import path from 'path'
import {pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto'
import { _User, getRedactedUser, RedactedUser, _Favorites} from './models/user.model';
import passport  from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import {createClient} from 'redis';
import RedisStore from 'connect-redis';
import {v4 as uuidv4} from 'uuid';

dotenv.config();
// Rest of your imports and application code

declare module 'express-session' {
  export interface SessionData {
    user: { [key: string]: any };
  }
}

const app = express();
const port = process.env.PORT;

const redisClient = createClient({
  url: 'redis://cache:6379'
});

redisClient.connect().then(() => {
  console.log('Redis connected');
}).catch((err) => {
  console.log('Redis connection error', err);
});

const sequelize = new Sequelize(process.env.NODE_ENV === 'production' ? process.env.PROD_POSTGRESS_URL : process.env.POSTGRESS_URL, {
  dialect: 'postgres'
});

// Sync models with database
sequelize.authenticate()
sequelize.sync({ alter: true });
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true')
  next();
});

// Middleware for parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: 'your_secret',
  resave: false,
  rolling: true,
  saveUninitialized: false,
  cookie: { secure: 'auto', maxAge: 1000 * 60 * 10, httpOnly: false}
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function verify(username, password, done) {
  _User.findOne({ where: { username: username } }).then(user => {
    if (!user) { return done(null, false); }
    pbkdf2(password,  user.get('salt') as Buffer, 310000, 32, 'sha256', function(err, hashedPassword) {
      if (err) { return done(err); }
      if (!timingSafeEqual(user.get('hashed_password') as Buffer, hashedPassword)) {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      return done(null, user.get('redacted'));
    });
  });
}));

passport.serializeUser(function(user : any, done) {
    return done(null,user.id);
});

passport.deserializeUser(function(user, done) {

  _User.findOne({ where: { id: user } }).then(user => {
   return done(null, getRedactedUser(user)) 
  });
});

app.post ("/login", passport.authenticate('local', {
  failureRedirect: "/home",
}), function(req, res) {
  if(req.user) {  
    
    res.status(200).json(req.user);
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/logout', function(req, res){
  req.logout((err) => {
    if(err) {
      console.log("Error logging out", err);
      return res.status(500).json({message: 'Error logging out'});
    }
    res.status(200).json({message: 'success'});
  });
});

app.get('/user', function(req, res){
  if(req.user) {
    
    res.status(200).json(req.user);
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/register', function(req, res, next) {
  // if a user with the same username already exists, return an error
  _User.findOne({ where: { username: req.body.username } }).then(existingUser => {
    if(existingUser) {
        res.status(400).send('User already exists');
    } else {
    // otherwise, create a new user with the provided username and password
      var salt = randomBytes(16);
      pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return next(err); }
        _User.create({
          id: uuidv4(),
          email: req.body.email,
          phone: req.body.phone,
          username: req.body.username,
          hashed_password: hashedPassword,
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          company: req.body.company,
          salt: salt
        }).then(user => {
          req.login(user, function(err) {
            if (err) { return next(err); }
            res.status(200).json(getRedactedUser(user));
          });
        });
      });
    }
  });
});

// CRUD routes for Property model
app.get('/properties', async (req: any, res: any) => {
  try {
    
    const seachTerm = req.query.searchTerm;
    const city: string[] =  req.query.city && String(req.query.city)?.toUpperCase().split(',');
    const zip: string[] = req.query.zip && String(req.query.zip)?.split(',');
    const propertyClasses = req.query.propertyClass && String(req.query.propertyClass)?.split(',');
    const priceMax = req.query.price;
    const sort = req.query.sort && String(req.query.sort)?.split(',');

    const sqftMax = req.query.sqft
    const lot_sizeMax = req.query.lotSize;
    const isFeatured = req.query.featured;
    
    const limit = req.query.limit;
    const offset = req.query.offset;

    const properties = await _Property.findAll({
      attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'featured', 'year_built', 'garage', 'stories', 'coords', 'images'],
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
        ...(isFeatured && {
          featured: { [Op.eq]: isFeatured },
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
      attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'featured', 'year_built', 'garage', 'stories', 'coords', 'images', 'next_showtime', 'interior_repairs', 'exterior_repairs'],
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

app.post('/user/save-property', async (req: any, res: any) => {
  try {
    
    const property = await _Property.findByPk(req.body.propertyId);
    
    if (property) {
      const userprope = await _Favorites.create({
        user_id: req.body.userId,
        property_id: property.dataValues.id
      })
      res.json(userprope);
    } else {
      res.status(404).send('User or property not found.');
    }
  } catch (error) {
    res.status(500).send('Error saving the property.');
  }
});

app.post('/user/remove-saved-property', async (req: any, res: any) => {
  try {
    const property = await _Property.findByPk(req.body.propertyId);
    if (property) {      
      const userprop = await _Favorites.destroy({
        where: {
          userId: req.body.userId,
          propertyId: property.dataValues.id
        }
      })
      res.json(userprop);
    } else {
      res.status(404).send('User or property not found.');
    }
  } catch (error) {
    res.status(500).send('Error saving the property.');
  }
});

app.get('/user/saved-properties', async (req: any, res: any) => {
  try {
    
    if (req.query.userId) {
      const propertyids = await _Favorites.findAll({
        attributes: ['property_id'],
        where: {
          user_id: req.query.userId
        }
      });

      
      const properties = await _Property.findAll({
        attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'featured', 'year_built', 'garage', 'stories', 'coords', 'images'],
        where: {
          id: { [Op.in]: propertyids.map((property: any) => property.property_id) }
        }
      });
      res.json(properties);
    } else {
      res.status(200).send([]);
    }
  } catch (error) {
    console.log("error", error);
    
    res.status(500).send('Error retrieving saved properties.');
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

app.get('/blog', async (req: any, res: any) => {
  try {
    const blogs = await _Blog.findAll()
    res.json(blogs);
  } catch (error) {
    res.status(500).send('Error fetching blogs');
  }
});

app.get('/blog/:id', async (req: any, res: any) => {
  try {
    const blog = await _Blog.findByPk(req.params.id)
    res.json(blog);
  } catch (error) {
    res.status(500).send('Error fetching blogs');
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
