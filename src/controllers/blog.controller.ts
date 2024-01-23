import debug from 'debug';
import express from 'express';
import { _Property } from '../models/property.model';
import { _Favorites } from '../models/favorites.model';
import { Op } from 'sequelize';
import { _Blog } from '../models/blog.model';
const log: debug.IDebugger = debug('app:blog-controller');

/**
 * Takes in request from the express server and calls the appropriate services to perform the CRUD
 * actiosn associated with the request (GET, POST, PATCH, etc.). It then responds with the data
 *  requested or success/error messaging
 */

class BlogController {
    async listBlogs(req: express.Request, res: express.Response) {
        const blogs = await _Blog.findAll()
        res.json(blogs);
    }

    async getBlog(req: express.Request, res: express.Response) {
        console.log(req.params)
        const blog = await _Blog.findOne({where: {slug: req.params.id}})
        res.json(blog);
    }


}

export default new BlogController();