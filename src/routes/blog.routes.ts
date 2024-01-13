import { CommonRoutesConfig } from '../common/common.routes';
import BlogController from '../controllers/blog.controller';
import express from 'express';
import { _Blog } from '../models/blog.model';

export class BlogRoutes extends CommonRoutesConfig {
    constructor(app: express.Application) {
        super(app, 'BlogRoutes');

    }
    configureRoutes(): express.Application {
        this.app.get('/blog', async (req: any, res: any) => {
            await BlogController.listBlogs(req, res)
        });

        this.app.get('/blog/:id', async (req: any, res: any) => {
            await BlogController.getBlog(req, res)
        });

        return this.app;
    }
}