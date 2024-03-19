import debug from 'debug';
import express, { Request, Response } from 'express';
import { _Property } from '../models/property.model';
import { _Favorites } from '../models/favorites.model';
import { Op } from 'sequelize';
import { query, validationResult } from 'express-validator';
import { _ServiceItem } from '../models/service_item.model';
const log: debug.IDebugger = debug('app:properties-controller');

/**
 * Takes in request from the express server and calls the appropriate services to perform the CRUD
 * actions associated with the request (GET, POST, PATCH, etc.). It then responds with the data
 *  requested or success/error messaging
 */

const PROPERTY_CLASSES = ['Res Imp', 'Res Vac Lot', 'Com Imp', 'Com Vac Lot', 'Ind Imp', 'Ind Vac Lot']

class PropertiesController {

  static listPropertiesValidations() {
    return [
      // Define validation rules
      query('price').optional().isNumeric().withMessage('Price must be numeric'),
      query('sqft').optional().isNumeric().withMessage('Square feet must be numeric'),
      query('featured').optional().isIn(['true', 'false']).withMessage('Featured must be true or false'),
      query('limit').optional().isNumeric().withMessage('Limit must be numeric'),
      query('offset').optional().isNumeric().withMessage('Offset must be numeric'),
      query('searchTerm').optional().isString().withMessage('Search term must be a string'),
      query('city').optional().isString().withMessage('City must be a string'),
      query('zip').optional().isString().withMessage('Zip must be a string'),
      query('propertyClass').optional().isString().withMessage('Property class must be a string').custom((value) => {
        const propertyClasses = value.split(',');
        for (const propertyClass of propertyClasses) {
          if (!PROPERTY_CLASSES.includes(propertyClass)) {
            throw new Error(`Invalid property class: ${propertyClass}`);
          }
        }
        return true;
      }),
      query('sort').optional().isString().withMessage('Sort must be a string'),
      query('bedrooms').optional().isNumeric().withMessage('Bedrooms must be numeric'),
    ];
  }

  static async listProperties(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { city, zip, price, sqft, featured,
       bedrooms, bathrooms, lotSize } = req.query;

    const searchTerm = req.query.searchTerm ? String(req.query.searchTerm).toUpperCase() : undefined

    const propertyClass = req.query.propertyClass ? (req.query.propertyClass as string).split(',') : undefined;
    const sort = req.query.sort && String(req.query.sort)?.split(',');

    const limit = Number(req.query.limit) || 30;
    const offset = Number(req.query.offset) || 0;

    try {

      const queryConditions = {
        address: { [Op.ne]: null },
        parcel_id: { [Op.ne]: null },
        ...(searchTerm && {
          [Op.or]: {
            address: { [Op.like]: `%${searchTerm}%` },
            parcel_id: { [Op.like]: `%${searchTerm}%` },
          },
        }),
        ...(city && { city: { [Op.in]: city } }),
        ...(zip && { zip: { [Op.in]: zip } }),
        ...(propertyClass && { property_class: { [Op.in]: propertyClass } }),
        ...(price && { price: { [Op.lte]: price } }),
        ...(sqft && { square_feet: { [Op.gte]: sqft } }),
        ...(lotSize && { lot_size: { [Op.gte]: lotSize } }),
        ...(featured && { featured: { [Op.eq]: featured } }),
        ...(bedrooms && { bedrooms: { [Op.gte]: bedrooms } }),
        ...(bathrooms && { bathrooms: { [Op.gte]: bathrooms } }),
      };

      const { count, rows } = await _Property.findAndCountAll({
        where: queryConditions,
        order: sort ? [[sort[0], sort[1]]] : undefined,
        limit: limit,
        offset: offset,
      });

      res.status(200).json({
        properties: rows,
        metadata: { total: count, limit, offset },
      });
    } catch (error) {
      console.error('Failed to list properties:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getPropertyById(req: express.Request, res: express.Response) {
    if (!req.params.propertyId) {
      res.status(400).send(new Error(`Inavlid ID supplied`));
      return;
    }
    const property = await _Property.findByPk(req.params.propertyId, {
      include: [
        {
          model: _ServiceItem,
          attributes: {
            exclude: ['property_service_item']
          },
        }
      ],
    });

    if (property) {
      res.json(property);
    } else {
      res.status(404).send('Property not found.');
    }
  }

  static async getFavorites(req: express.Request, res: express.Response) {
    try {

      if (req.query.userId) {
        const propertyids = await _Favorites.findAll({
          attributes: ['property_id'],
          where: {
            user_id: req.query.userId
          }
        });

        const properties = await _Property.findAll({
          where: {
            id: { [Op.in]: propertyids.map((property: any) => property.property_id) }
          }
        });
        res.json({
          properties: properties,
          metadata: {
            total: properties.length
          }
        });
      } else {
        res.status(200).send([]);
      }
    } catch (error) {
      res.status(500).send('Error retrieving saved properties.');
    }
  }

  static async getSavedProperty(req: express.Request, res: express.Response) {
    try {
      if (!req.query.propertyId || !req.query.userId) {
        res.status(400).send(new Error(`Inavlid ID supplied`));
        return;
      }
      const property = await _Favorites.findOne({
        where: {
          user_id: req.query.userId,
          property_id: req.query.propertyId
        }
      })
      if (!property) {
        res.send({ success: false });
        return;
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      res.status(500).send('Error retrieving saved property.');
    }
  }

  static async saveProperty(req: express.Request, res: express.Response) {
    try {
      if (!req.body.propertyId || !req.body.userId) {
        res.status(400).send(new Error(`Inavlid ID supplied`));
        return;
      }
      await _Favorites.create({
        user_id: req.body.userId,
        property_id: req.body.propertyId
      })
      res.json({ success: true });
    } catch (error) {
      res.status(500).send('Error saving the property.');
    }
  }

  static async removeSavedProperty(req: express.Request, res: express.Response) {
    try {
      if (!req.body.propertyId || !req.body.userId) {
        res.status(400).send(new Error(`Inavlid ID supplied`));
        return;
      }
      await _Favorites.destroy({
        where: {
          user_id: req.body.userId,
          property_id: req.body.propertyId
        }
      })
      res.json({ success: true });
    } catch (error) {
      res.status(500).send('Error saving the property.');
    }
  }

  static async getZipCodes(req: express.Request, res: express.Response) {
    try {
      const properties = await _Property.findAll({
        attributes: ['zip'],
        group: ['zip'],
        where: {
          zip: { [Op.ne]: null }
        }
      });
      const zipCodes = properties.map((property: any) => property.zip);
      res.json(zipCodes);
    } catch (error) {
      res.status(500).send('Error retrieving properties.');
    }
  }
}

export default PropertiesController