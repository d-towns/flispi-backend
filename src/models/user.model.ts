import { Sequelize, Model, DataTypes, where, Op } from 'sequelize';
import { FLOAT, INTEGER } from 'sequelize';

import {sequelize} from '../db';
import { _Property } from './property.model';

export class _User extends Model {}

export type RedactedUser = {
  id: string,
  username: string,
  email: string,
  phone: string,
  full_name: string,
  first_name: string,
  last_name: string,
  company: string,
  created_at: Date,
}

export const getRedactedUser = (user:_User) : RedactedUser => {
  
 return {
  id: user.dataValues.id,
  username: user.dataValues.username,
  email: user.dataValues.email,
  phone: user.dataValues.phone,
  full_name: user.dataValues.full_name,
  first_name: user.dataValues.first_name,
  last_name: user.dataValues.last_name,
  company: user.dataValues.company,
  created_at: user.dataValues.createdAt,
 }
}

_User.init({
    id: {
        type: DataTypes.TEXT,
        primaryKey: true
      },
    username: DataTypes.TEXT,
    first_name: DataTypes.TEXT,
    last_name: DataTypes.TEXT,
    company: DataTypes.TEXT,
    hashed_password: DataTypes.BLOB,
    salt: DataTypes.TEXT,
    email: DataTypes.TEXT,
    phone: DataTypes.TEXT,
    full_name: DataTypes.TEXT,
}, { sequelize, underscored: true, modelName: 'users', timestamps: true, freezeTableName: true, getterMethods: {
  redacted() {
    return getRedactedUser(this);
  }
},
})



export const _UserProperties = sequelize.define('user_properties',  { user_id: {
  type: DataTypes.TEXT,
  references: {
    model: _User, 
    key: 'id'
  }
},
property_id: {
  type: DataTypes.TEXT,
  references: {
    model: _Property, 
    key: 'id'
  }
}
}, { underscored: true, modelName: 'user_properties', timestamps: true, freezeTableName: true });
_User.belongsToMany(_Property, { through: _UserProperties });
_Property.belongsToMany(_User, { through: _UserProperties });

_UserProperties.sync({alter : true});


