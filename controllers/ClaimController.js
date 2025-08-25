// Properties
import Properties from "../properties";

// Database
import ClaimModel from "../models/ClaimModel";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

import fs from 'fs';
import path from 'path';

import { nanoid } from 'nanoid';

import needle from 'needle';

const ClaimController = {

    init: router => {
        const baseUrl = `${Properties.API}/claim`;
      
        router.post(baseUrl + "", authorize(["ADMIN"]), ClaimController.create);
        router.delete(baseUrl + "/:id", authorize(["ADMIN"]), ClaimController.delete);
        router.get(baseUrl + "/:id", authorize([]), ClaimController.get);
        router.get(baseUrl + "", authorize(["SUPERADMIN"]), ClaimController.list);
    
        router.post(baseUrl + "/:id", authorize(["ADMIN"]), ClaimController.update);
        
    },

    get: async (req, res) => {
        try {
        const result = await ClaimModel.get(req.params.id);
        res.json(result);
        } catch (err) {
        const safeErr = ErrorManager.getSafeError(err);
        res.status(safeErr.status).json(safeErr);
        }
    },


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
            const result = await ClaimModel.create(d);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

 
    delete: async (req, res) => {
        try {
            
            const result = await ClaimModel.delete(req.params.id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

 
    list: async (req, res) => {
        try {
            const result = await ClaimModel.findByUser(req.user._id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    
    update: async (req, res) => {
        try {
            const result = await ClaimModel.update(req.body);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

   
    
};

export default {
    ...ClaimController,
};
