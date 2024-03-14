import { Sequelize, Model, DataTypes, where, Op } from 'sequelize';
import { FLOAT, INTEGER } from 'sequelize';

import {sequelize} from '../db';
import { _Property } from './property.model';

export const _Favorites = sequelize.define('favorites',  { user_id: {
  type: DataTypes.TEXT,
},
property_id: {
  type: DataTypes.TEXT,
  references: {
    model: _Property, 
    key: 'id'
  }
}
}, { underscored: true, modelName: 'favorites', timestamps: false, freezeTableName: true });
_Favorites.belongsTo(_Property, {foreignKey: 'property_id'});
_Property.hasMany(_Favorites, {foreignKey: 'property_id'});
_Favorites.sync();



