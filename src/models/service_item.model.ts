import { DataTypes } from 'sequelize';
import {sequelize} from '../db'
import { _Property } from './property.model';

export const _ServiceItem = sequelize.define('service_item', {
    name: {type: DataTypes.TEXT, primaryKey: true, allowNull: false, unique: true},
    min_price: DataTypes.FLOAT,
    max_price: DataTypes.FLOAT,
    unit: DataTypes.FLOAT,
    unit_type: {
        type: DataTypes.ENUM,
        values: ['SQFT', 'ACRE', 'LOT', 'EACH', 'LFT']
    },
    }, {
    modelName: 'service_item',
    timestamps: false,
    freezeTableName: true
    });
_ServiceItem.belongsToMany(_Property, { through: 'property_service_item', foreignKey: 'service_item_id', timestamps:false},);
_Property.belongsToMany(_ServiceItem, { through: 'property_service_item', foreignKey: 'property_id', timestamps:false});
