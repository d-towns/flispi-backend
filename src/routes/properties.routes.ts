import {CommonRoutesConfig} from '../common/common.routes';
import PropertiesController from '../controllers/properties.controller';
import express from 'express';

/**
 * Defines the Routes that will be exposed to users of this API. These Routes will set the ability to
 * maniuplate, add or remove data from the 'Properties'. the routes supported are currently only read only
 * (bulk and individual product reading)
 */

export class PropertiesRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'PropertiesRoutes');
        
    }

    configureRoutes(): express.Application {
        this.app.route('/properties')
        .get(
          PropertiesController.listPropertiesValidations(),
          async (req, res) => {
            await PropertiesController.listProperties(req, res);
          }
        );

    this.app.route(`/property/:propertyId`)
        .get( async (req: express.Request, res: express.Response) => {
            await PropertiesController.getPropertyById(req, res)
        })
    
    this.app.route(`/properties/save-property`)
        .post( async (req: express.Request, res: express.Response) => {
            await PropertiesController.saveProperty(req, res)
        })

    this.app.route(`/properties/remove-saved-property`)
        .post( async (req: express.Request, res: express.Response) => {
            await PropertiesController.removeSavedProperty(req, res)
        })
    
    this.app.route(`/properties/saved-properties`)
        .get( async (req: express.Request, res: express.Response) => {
            await PropertiesController.getFavorites(req, res)
        })
    
    this.app.route(`/properties/saved-property`)
        .get( async (req: express.Request, res: express.Response) => {
            await PropertiesController.getSavedProperty(req, res)
        })

    this.app.route(`/properties/zipcodes`)
        .get( async (req: express.Request, res: express.Response) => {
            await PropertiesController.getZipCodes(req, res)
        })


    return this.app;
    }


}