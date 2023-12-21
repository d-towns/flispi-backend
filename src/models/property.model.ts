import { Sequelize, Model, DataTypes, where, Op } from 'sequelize';
import { FLOAT, INTEGER } from 'sequelize';

import {sequelize} from '../db';

export class _Property extends Model { }
_Property.init({
  id: {
    type: DataTypes.TEXT,
    primaryKey: true
  },
  parcel_id: DataTypes.TEXT,
  address: DataTypes.TEXT,
  city: DataTypes.TEXT,
  zip: DataTypes.TEXT,
  property_class: DataTypes.TEXT,
  price: DataTypes.INTEGER,
  square_feet: DataTypes.INTEGER,
  bedrooms: DataTypes.INTEGER,
  bathrooms: DataTypes.INTEGER,
  lot_size: DataTypes.FLOAT,
  featured: DataTypes.TEXT,
  year_built: DataTypes.STRING,
  garage: DataTypes.TEXT,
  stories: DataTypes.INTEGER,
  coords: DataTypes.JSON,
  images: DataTypes.JSON,
  exterior_repairs: DataTypes.JSON,
  interior_repairs: DataTypes.JSON,
  next_showtime: DataTypes.TIME,
}, { sequelize, modelName: 'properties', timestamps: false, freezeTableName: true});