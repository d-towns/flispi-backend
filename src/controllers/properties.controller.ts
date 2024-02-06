import debug from 'debug';
import express from 'express';
import { _Property } from '../models/property.model';
import { _Favorites } from '../models/favorites.model';
import { Op } from 'sequelize';
const log: debug.IDebugger = debug('app:properties-controller');

/**
 * Takes in request from the express server and calls the appropriate services to perform the CRUD
 * actiosn associated with the request (GET, POST, PATCH, etc.). It then responds with the data
 *  requested or success/error messaging
 */

class PropertiesController {
    async listProperties(req: express.Request, res: express.Response) {
        const seachTerm = req.query.searchTerm && String(req.query.searchTerm).toUpperCase()
        const city: string[] =  req.query.city && String(req.query.city)?.toUpperCase().split(',');
        const zip: string[] = req.query.zip && String(req.query.zip)?.split(',');
        const propertyClasses = req.query.propertyClass && String(req.query.propertyClass)?.split(',');
        const priceMax = req.query.price;
        const sort = req.query.sort && String(req.query.sort)?.split(',');
    
        const sqftMax = req.query.sqft
        const lot_sizeMax = req.query.lotSize;

        const isFeatured = req.query.featured;
        
        const limit :any = req.query.limit;
        const offset : any = req.query.offset;


        const {count, rows} = await _Property.findAndCountAll({
            attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'featured', 'year_built', 'garage', 'stories', 'coords', 'next_showtime', 'images'],
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
        res.status(200).json(
            {
                properties: rows,
                metadata: {
                    total: count,
                    limit: limit,
                    offset: offset
                }
            }
        );
    }

    async getPropertyById(req: express.Request, res: express.Response) {
        console.log(req.params);
        if(!req.params.propertyId) {
            res.status(400).send(new Error(`Inavlid ID supplied`));
            return;
        }
        const property = await _Property.findByPk(req.params.propertyId, {
            attributes: ['parcel_id', 'id', 'address', 'city', 'zip', 'property_class', 'price', 'price', 'square_feet', 'bedrooms', 'bathrooms', 'lot_size', 'featured', 'year_built', 'garage', 'stories', 'coords', 'images', 'next_showtime', 'interior_repairs', 'exterior_repairs'],
          });
      
          if (property) {
            res.json(property);
          } else {
            res.status(404).send('Property not found.');
          }
    }

    async getFavorites(req: express.Request, res: express.Response) {
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
            console.log("error", error);
            
            res.status(500).send('Error retrieving saved properties.');
          }
    }

    async getSavedProperty(req: express.Request, res: express.Response) {
        try {
            if(!req.query.propertyId || !req.query.userId) {
                res.status(400).send(new Error(`Inavlid ID supplied`));
                return;
            }
            console.log(req.query);
            const property = await _Favorites.findOne({
              where: {
                  user_id: req.query.userId,
                  property_id: req.query.propertyId
              }
            })
            if (!property) {
                res.send({success: false});
                return;
            } else {
                res.json({success: true});
            }
          } catch (error) {
            res.status(500).send('Error retrieving saved property.');
          }
    }

    async saveProperty(req: express.Request, res: express.Response) {
        try {
            if(!req.body.propertyId || !req.body.userId) {
                res.status(400).send(new Error(`Inavlid ID supplied`));
                return;
            }
            await _Favorites.create({
              user_id: req.body.userId,
              property_id: req.body.propertyId
              })
            res.json({success: true });
          } catch (error) {
            res.status(500).send('Error saving the property.');
          }
    }
    
    async removeSavedProperty(req: express.Request, res: express.Response) {
        try {
            if(!req.body.propertyId || !req.body.userId) {
                res.status(400).send(new Error(`Inavlid ID supplied`));
                return;
            }
            await _Favorites.destroy({
              where: {
                  user_id: req.body.userId,
                  property_id: req.body.propertyId
              }
            })
            res.json({success: true });
          } catch (error) {
            res.status(500).send('Error saving the property.');
          }
    }

    async getZipCodes(req: express.Request, res: express.Response) {
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

export default new PropertiesController();