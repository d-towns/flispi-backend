import {CommonRoutesConfig} from '../common/common.routes';
import propertiesController from '../controllers/properties.controller';
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
        this.app.route(`/properties`)
        .get( async (req: express.Request, res: express.Response) => {
            await propertiesController.listProperties(req, res)
        })

    this.app.route(`/property/:propertyId`)
        .get( async (req: express.Request, res: express.Response) => {
            await propertiesController.getPropertyById(req, res)
        })
    
    this.app.route(`/properties/save-property`)
        .post( async (req: express.Request, res: express.Response) => {
            await propertiesController.saveProperty(req, res)
        })

    this.app.route(`/properties/remove-saved-property`)
        .post( async (req: express.Request, res: express.Response) => {
            await propertiesController.removeSavedProperty(req, res)
        })
    
    this.app.route(`/properties/saved-properties`)
        .get( async (req: express.Request, res: express.Response) => {
            await propertiesController.getFavorites(req, res)
        })
    
    this.app.route(`/properties/saved-property`)
        .get( async (req: express.Request, res: express.Response) => {
            await propertiesController.getSavedProperty(req, res)
        })

    this.app.route(`/properties/zipcodes`)
        .get( async (req: express.Request, res: express.Response) => {
            await propertiesController.getZipCodes(req, res)
        })


    return this.app;
    }


}