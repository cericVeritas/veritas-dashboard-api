// Import Mongoose
import mongoose from "mongoose";
// Logging
import Logger from "./Logger";
// Properties
import properties from "../properties.js";

import OrganizationModel from "../models/OrganizationModel";
import UserModel from "../models/UserModel";
import InviteModel from "../models/InviteModel";
import FileModel from "../models/FileModel";
import CodeModel from "../models/CodeModel";
// import CoreModel from "../models/CoreModel";




class Database {
    constructor() {
        this.dbConnection = null;
    }

    /**
     * Init database
     */
    async init() {
        await this.authenticate();
        Logger.info("db connected at: " + properties.DB_URL);
        Logger.info(">>>>>>>>>>>>>>>>>>>>>>>>>>>");

        UserModel.init();
        InviteModel.init();
        OrganizationModel.init();
        FileModel.init();
        CodeModel.init();
        Logger.info("Models initialized.");


        // let now = new Date();
        // let expires = new Date(now.getTime() + 1000 * 3600); // 1 hour
        // let d = {
        //     code: "init",
        //     email: "jbskis@gmail.com",
        //     role: "superadmin",
        //     type: "organization",
        //     invitedBy: null,
        //     created: now,
        //     updated: now,
        //     expires: expires,
        //     organization: null
        // }
        // const result = InviteModel.create(d);

    }

    /**
     * Start database connection
     */

   
    async authenticate() {
        Logger.info("Authenticating to the databases...");
        try {

            // Connect
            this.dbConnection = mongoose.connect(properties.DB_URL);

            // this.dbConnection = await mongoose.connect(properties.DB_URL, {
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true,
            // });

            Logger.info("Connected successfully to MongoDB");

            // if (mongoose.connection.readyState === 0) {
                
            //     console.log("Connecting to MongoDB...");

            //     this.dbConnection = await mongoose.connect(properties.DB_URL, {
            //         useNewUrlParser: true,
            //         useUnifiedTopology: true,
                   
            //     });
            //     // await mongoose.connect(url, {
            //     //     useNewUrlParser: true,
            //     //     useUnifiedTopology: true,
            //     //     poolSize: 10 // Adjust the pool size as needed
            //     // });
            //     console.log("Connected successfully to MongoDB");
            // }

        } catch (err) {
            Logger.error(`Failed connection to the DB: ${err.message}`);
            Logger.error(err);
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await this.authenticate();
        }
    }

    /**
     * Get connection db
     */
    getConnection() {
        return this.dbConnection;
    }
}

export default new Database();
