// Properties
import Properties from "../properties";

// Database
import AccountModel from "../models/AccountModel";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

const AccountController = {


   init: router => {
     const baseUrl = `${Properties.API}/account`;
     router.get(baseUrl + "/all", authorize(["ADMIN"]), AccountController.getAccounts);
     router.post(baseUrl + "/updateMarkUp", authorize(["ADMIN"]), AccountController.updateMarkUp);
   },

    getAccounts: async (req, res) => {
        try {
            const accountArr = req.query["accountIdArray[]"];
            const result = await AccountModel.getUserAccount(accountArr);
            console.log(result)
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    updateMarkUp: async (req, res) => {
        try {
            const { accountId, markup } = req.body;
            const result = await AccountModel.updateMarkUp({ id: accountId, markUp: parseFloat(markup) });
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

};

export default {
    ...AccountController,
};
