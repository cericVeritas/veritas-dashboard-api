// Properties
import Properties from "../properties";

// Database
import OrganizationModel from "../models/OrganizationModel";
import InviteModel from "../models/InviteModel";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

const OrganizationController = {


   init: router => {
     const baseUrl = `${Properties.API}/organization`;
     router.post(baseUrl + "", authorize(["ADMIN"]), OrganizationController.create);
     router.delete(baseUrl + "/:id", authorize(["ADMIN"]), OrganizationController.delete);
     router.get(baseUrl + "", authorize(["ADMIN"]), OrganizationController.list);
     router.get(baseUrl + "/all", authorize(["ADMIN"]), OrganizationController.getOrgs);
     router.get(baseUrl + "/invites", authorize(["ADMIN"]), OrganizationController.getOrgInvites);
     router.get(baseUrl + "/team/:id", authorize(["ADMIN"]), OrganizationController.getTeam);
     router.get(baseUrl + "/team/invites/:id", authorize(["ADMIN"]), OrganizationController.getTeamInvites);
     router.get(baseUrl + "/:id", authorize([]), OrganizationController.get);
     router.post(baseUrl + "/:id", authorize(["ADMIN"]), OrganizationController.update);
   },

   get: async (req, res) => {
     try {
       const result = await OrganizationModel.get(req.params.id);
       res.json(result);
     } catch (err) {
       const safeErr = ErrorManager.getSafeError(err);
       res.status(safeErr.status).json(safeErr);
     }
   },

    /**
     * OrganizationModel.create
     *   @description CRUD ACTION create
     *
     */
    create: async (req, res) => {
        try {
            if (!req.body.name) {
                throw new Errors.MISSING_NAME();
            }

            req.body._users = [req.user._id];
            req.body._admins = [req.user._id];
            const result = await OrganizationModel.create(req.body);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * OrganizationModel.delete
     *   @description CRUD ACTION delete
     *   @param ObjectId id Id
     *
     */
    delete: async (req, res) => {
        try {
            const org = await OrganizationModel.get(req.params.id);

            if (!org) {
                throw new Errors.MISSING_OBJECT();
            }

            if (org._admins.indexOf(req.user._id) == -1) {
                throw new Errors.UNAUTHORIZED();
            }

            const result = await OrganizationModel.delete(req.params.id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * OrganizationModel.list
     *   @description CRUD ACTION list
     *
     */
    list: async (req, res) => {
        try {
            const result = await OrganizationModel.findByUser(req.user._id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    getOrgs: async (req, res) => {
        try {
            const result = await OrganizationModel.list();
            console.log(result)
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    getOrgInvites: async (req, res) => {
        try {
            const result = await InviteModel.getByType('organization');
            console.log(result)
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    getTeam: async (req, res) => {
        try {
            console.log('getTeam called with params:', req.params);
            console.log('getTeam called with URL:', req.url);
            console.log('getTeam called with path:', req.path);
            
            // Check if ID is valid
            if (!req.params.id || req.params.id === 'undefined') {
                const safeErr = ErrorManager.getSafeError(
                    new Errors.MISSING_OBJECT()
                );
                return res.status(safeErr.status).json(safeErr);
            }
            
            const organization = await OrganizationModel.get(req.params.id);
            
            if (!organization) {
                throw new Errors.MISSING_OBJECT();
            }

            console.log(organization);
            // Populate users with full info and admins with just IDs
            const populatedOrg = await OrganizationModel.model
                .findOne({ _id: req.params.id })
                .populate('_users', 'username firstname lastname email avatarFile created roles isVerified')
                .populate('_admins', '_id')
                .lean();

            const response = {
                users: populatedOrg._users || [], // Full user info
                admins: populatedOrg._admins ? populatedOrg._admins.map(admin => admin._id) : [] // Just admin IDs
            };

            console.log(response)

            res.json(response);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    getTeamInvites: async (req, res) => {
        try {
            console.log('getTeamInvites called with params:', req.params);
            console.log('getTeamInvites called with URL:', req.url);
            
            // Check if ID is valid
            // if (!req.params.id || req.params.id === 'undefined') {
            //     const safeErr = ErrorManager.getSafeError(
            //         new Errors.MISSING_OBJECT()
            //     );
            //     return res.status(safeErr.status).json(safeErr);
            // }
            
            const result = await InviteModel.getByOrg(req.params.id);
            console.log('🔥team invites',req.params.id,result);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * OrganizationModel.update
     *   @description CRUD ACTION update
     *   @param ObjectId id Id
     *
     */
    update: async (req, res) => {
        try {
            const org = await OrganizationModel.get(req.params.id);

            if (!org) {
                throw new Errors.MISSING_OBJECT();
            }

            if (org._admins.indexOf(req.user._id) == -1) {
                throw new Errors.UNAUTHORIZED();
            }

            const result = await OrganizationModel.update(req.body);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },
};

export default {
    ...OrganizationController,
};
