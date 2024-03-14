import { DataTypes } from 'sequelize';
import {sequelize} from '../db';
import { _Favorites } from './favorites.model';
import { _ServiceItem } from './service_item.model';

export const _Property = sequelize.define( 'properties', {
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
  bedrooms: DataTypes.FLOAT,
  bathrooms: DataTypes.FLOAT,
  lot_size: DataTypes.FLOAT,
  featured: DataTypes.TEXT,
  year_built: DataTypes.STRING,
  garage: DataTypes.TEXT,
  stories: DataTypes.INTEGER,
  coords: DataTypes.JSON,
  images: DataTypes.JSON,
  exterior_repairs: DataTypes.JSON,
  interior_repairs: DataTypes.JSON,
  next_showtime: DataTypes.DATE,
  repair_cost_min: DataTypes.FLOAT,
  repair_cost_max: DataTypes.FLOAT,

}, { modelName: 'properties', timestamps: false, freezeTableName: true});
_Property.sync({alter: true});