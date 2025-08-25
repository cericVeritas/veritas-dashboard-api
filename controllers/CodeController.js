// Properties
import Properties from "../properties";

// Database
import CodeModel from "../models/CodeModel";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

import fs from 'fs';
import path from 'path';

import { nanoid } from 'nanoid';

import got from 'got';
import needle from 'needle';


const CodeController = {


    init: router => {
        const baseUrl = `${Properties.API}/code`;
      
        router.post(baseUrl + "", authorize(["ADMIN"]), CodeController.create);
        router.delete(baseUrl + "/:id", authorize(["ADMIN"]), CodeController.delete);
        router.get(baseUrl + "/:id", authorize([]), CodeController.get);
        router.get(baseUrl + "", authorize(["SUPERADMIN"]), CodeController.list);

        router.get(baseUrl + "/lookup/:codes", authorize(["USER"]), CodeController.getByCodes);
        
        router.post(baseUrl + "/:id", authorize(["ADMIN"]), CodeController.update);
        
    },

    get: async (req, res) => {
        try {
        const result = await CodeModel.get(req.params.id);
        res.json(result);
        } catch (err) {
        const safeErr = ErrorManager.getSafeError(err);
        res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * CodeModel.create
     *   @description CRUD ACTION create
     *
     */
    create: async (req, res) => {
        try {
            let data = req.body;
            console.log(data)
            let now = new Date();
            // let expires = new Date(now.getTime() + 1000 * 3600 * 24 * 30); // 30 days
            let d = {
                updated: new Date(),
                created: now,
                creator: req.user._id,
                organization: req.user.organization,
                type: data.type,
             
            }
            const result = await CodeModel.create(d);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * CodeModel.delete
     *   @description CRUD ACTION delete
     *   @param ObjectId id Id
     *
     */
    delete: async (req, res) => {
        try {
            
            const result = await CodeModel.delete(req.params.id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * CodeModel.list
     *   @description CRUD ACTION list
     *
     */
    list: async (req, res) => {
        try {
            const result = await CodeModel.findByUser(req.user._id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },



    getByCodes: async (req, res) => {

        let codes = req.params.codes.split(',');
        console.log('🔥💥🚀⚡️🎯🧨🛠️🧠codes',codes);
        

        let baseUrl = process.env.LOOKUP_URL + "/" + codes.join('%20');
        console.log('💥🚀⚡️  baseUrl',baseUrl);


        
        // let data = { fire: true };

        const response = await needle('get', baseUrl);
        const data = response.body;
        console.dir(data);

        res.status(200).json({success: true, message: "Codes received", data: data});

        // /getHCPCS/{code}/{zip}/{radius}
        // /getHCPCS/{code}/{zip}
        // /getHCPCS/{code}/{locality}
        // /getHCPCS/{code}


        // try {
        //     const result = await CodeModel.findByCodes(req.params.codes);
        //     res.json(result);
        // } catch (err) {
        //     const safeErr = ErrorManager.getSafeError(err);
        //     res.status(safeErr.status).json(safeErr);
        // }
    },

    /**
     * CodeModel.update
     *   @description CRUD ACTION update
     *   @param ObjectId id Id
     *
     */
    update: async (req, res) => {
        try {
            const result = await CodeModel.update(req.body);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

   
    
};

export default {
    ...CodeController,
};
