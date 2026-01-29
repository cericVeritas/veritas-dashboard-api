// Properties
import Properties from "../properties";

// Database
import InviteModel from "../models/InviteModel";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

import transporter from "../services/mailer";



const InviteController = {


   init: router => {
     const baseUrl = `${Properties.API}/invite`;
     router.post(baseUrl + "", authorize(["ADMIN"]), InviteController.create);
     router.delete(baseUrl + "/:id", authorize(["ADMIN"]), InviteController.delete);
     router.get(baseUrl + "/:id", authorize([]), InviteController.get);
     router.get(baseUrl + "", authorize([]), InviteController.list);
     router.post(baseUrl + "/:id", authorize(["ADMIN"]), InviteController.update);
  
   },

   get: async (req, res) => {
     try {
       const result = await InviteModel.get(req.params.id);
       res.json(result);
     } catch (err) {
       const safeErr = ErrorManager.getSafeError(err);
       res.status(safeErr.status).json(safeErr);
     }
   },

    /**
     * InviteModel.create
     *   @description CRUD ACTION create
     *
     */
    create: async (req, res) => {
        try {
            let data = req.body;
            console.log(data)
            let now = new Date();
            // let expires = new Date(now.getTime() + 1000 * 3600 * 24 * 30); // 30 days
            let expires = new Date(now.getTime() + 1000 * 3600); // 1 hour
            let inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            let d = {
                code: inviteCode,
                email: data.email,
                role: data.role,
                type: data.type,
                invitedBy: req.user.id,
                created: now,
                updated: now,
                expires: expires,
                organization: null,
                accountId: data.accountId
            }
            const result = await InviteModel.create(d);
            const mailOptions = {
                from: "ceric@veritasallies.com",
                to: data.email,
                subject: 'You are invited!',
                text: "You have been invited. Use the following code to accept the invitation "
            };
            await transporter.sendMail(mailOptions);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * InviteModel.delete
     *   @description CRUD ACTION delete
     *   @param ObjectId id Id
     *
     */
    delete: async (req, res) => {
        try {
            
            const result = await InviteModel.delete(req.params.id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * InviteModel.list
     *   @description CRUD ACTION list
     *
     */
    list: async (req, res) => {
        try {
            const result = await InviteModel.findByUser(req.user._id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * InviteModel.update
     *   @description CRUD ACTION update
     *   @param ObjectId id Id
     *
     */
    update: async (req, res) => {
        try {
            const result = await InviteModel.update(req.body);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },
};

export default {
    ...InviteController,
};
