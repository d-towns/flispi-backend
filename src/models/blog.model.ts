import { Model, DataTypes } from 'sequelize';

import {sequelize} from '../db';

export class _Blog extends Model { }
_Blog.init({
  id: {
    type: DataTypes.TEXT,
    primaryKey: true
  },
  title: DataTypes.TEXT,
  subtitle: DataTypes.TEXT,
  body: DataTypes.TEXT,
  created_at: DataTypes.DATE,
  author: DataTypes.TEXT,
  slug: DataTypes.TEXT,
  author_image: DataTypes.TEXT,
  tag: DataTypes.TEXT
}, { sequelize, modelName: 'blog', timestamps: false, freezeTableName: true});

_Blog.sync();