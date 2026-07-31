// Properties
import Properties from "../properties";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import ErrorManager from "../classes/ErrorManager";

import needle from "needle";

const GLOBAL_CONTRACTS_URL =
    "https://veritasallies.net/opensearch/getGlobalContracts";

const ContractController = {
    init: router => {
        const baseUrl = `${Properties.API}/contract`;

        router.post(
            baseUrl + "/getGlobalContracts",
            authorize(["USER"]),
            ContractController.getGlobalContracts
        );
    },

    getGlobalContracts: async (req, res) => {
        try {
            const requestPrefix = typeof req.body?.prefix === "string"
                ? req.body.prefix.trim()
                : "";
            const prefix = requestPrefix || "*";
            const offset = req.body?.offset === undefined
                ? 0
                : Number(req.body.offset);

            if (!Number.isInteger(offset) || offset < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Contract offset must be a non-negative integer",
                });
            }

            const response = await needle(
                "post",
                GLOBAL_CONTRACTS_URL,
                { prefix, offset },
                { json: true }
            );

            return res.status(response.statusCode).json(response.body);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            return res.status(safeErr.status).json(safeErr);
        }
    },
};

export default {
    ...ContractController,
};
