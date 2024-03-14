// Create a model for a join table between the property and service item tables. The join table should have the following columns:

import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db';
import {_Property} from './property.model';
import {_ServiceItem} from './service_item.model';

export const _PropertyServiceItem = sequelize.define('property_service_item', {
    id: {type: DataTypes.TEXT, primaryKey: true, allowNull: false, unique: true},
    property_id: {type: DataTypes.TEXT, references: {
        model: _Property, 
        key: 'id'
    }, allowNull: false},
    service_item_id:
    {type: DataTypes.TEXT, references: {
        model: _ServiceItem, 
        key: 'name',
    }, allowNull: false}
    }, {
    modelName: 'property_service_item',
    timestamps: false,
    freezeTableName: true
    });

  _PropertyServiceItem.belongsTo(_Property, {foreignKey: 'property_id'});
  _PropertyServiceItem.belongsTo(_ServiceItem, {foreignKey: 'service_item_id'});
