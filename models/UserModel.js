
// Database
import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

import OrganizationModel from "./OrganizationModel";

// Logger
import Logger from "../classes/Logger";

var ip = require('ip');

const userModel = {
    /**
     * Init  schema
     */
    init() {
        const db = Database.getConnection();

        /**
         * User
         */
        const userSchema = new mongoose.Schema({
        
            username: {
                type: "String",
                default: function() {
                    return 'user_' + Math.random().toString(36).substr(2, 9);
                }
            },
            
            email: {
                type: "String",
                required: true,
                unique: true, // 🔐 Ensures email must be unique
                lowercase: true,
                trim: true
            },
            password: {
                type: "String",
                required: true
            },
            firstname: {
                type: "String",
                default: '',
            },
            lastname: {
                type: "String",
                default: '',
            },
            title: {
                type: "String",
                default: '',
            },
            bio: {
                type: "String",
                default: '',
            },
            location: {
                type: "String"
            },
            avatarFile: {
                type: "String",
                default: null
            },
            // not sure if this will be primary role source, for superadmin probably.
            roles: {
                type: [String],
                enum: ['user', 'admin', 'superadmin'], // These are the roles available
                default: ['user']
            },

            theme: {
                type: "String",
                default: "dark",
            },
            
            ips: [],
            browser: {},
            
            created: {
                type: "Date",
                default: null,
            },
            updated: {
                type: "Date",
                default: null,
            },

            isVerified: {
                type: Boolean,
                default: false,  // Default is not verified
            },
            verificationToken: {
                type: String,  // Store the verification token
                default: null,
            },
            verificationTokenExpiration: {
                type: Date, // Store the expiration time for the token
                default: null,
            },

            acceptedCookiesAt: {
                type: "Date",
                default: null,
            },
            accountId: [{
                type: Schema.ObjectId,
                ref: "Account"
            }]

        });

        userModel.setModel(mongoose.model("User", userSchema));
        // generatedModel.createAdminUser();

        return userSchema;
    },

    /**
     * Set Model
     */
    setModel: model => {
        userModel.model = model;
    },

    /**
     * Get model
     */
    getModel: () => {
        return userModel.model;
    },

        // // User schema methods
        // userSchema.methods.generateVerificationToken = function () {
        //     // Create a unique verification token
        //     const token = crypto.randomBytes(20).toString('hex');
        //     this.verificationToken = token;
        //     // Set token expiration to 1 hour
        //     this.verificationTokenExpiration = Date.now() + 3600000; // 1 hour
        //     return token;
        //   };

    /**
     * UserModel.create
     *   @description CRUD ACTION create
     *
     */
    async create(item) {
        let now = new Date();
        item.created = now;
        item.updated = now;
        const obj = new userModel.model(item);
        return await obj.save();
    },

    /**
     * UserModel.delete
     *   @description CRUD ACTION delete
     *   @param ObjectId id Id
     *
     */
    async delete(id) {
        return await userModel.model.findByIdAndRemove(id);
    },

    /**
     * UserModel.get
     *   @description CRUD ACTION get
     *   @param ObjectId id Id resource
     *
     */
    async get(id) {
        return await userModel.model.findOne({ _id : id }).select("-password");
    },

    

    async getByUsername(v) {
        return await userModel.model.findOne({ username : v });
    },

    /**
     * UserModel.list
     *   @description CRUD ACTION list
     *
     */
    async list() {
        return await userModel.model.find().select("-password");
    },

    async listLean() {
        return await userModel.model.find().select("username firstname lastname email avatarFile created");
    },

    /**
     * UserModel.update
     *   @description CRUD ACTION update
     *   @param ObjectId id Id
     *
     */
    async update(item) {
        delete item.password;

        return await userModel.model.findOneAndUpdate({ _id: item._id }, item);
    },




    // Start custom queries User

    /**
     * Get User by username e password
     */
    getByUsernameAndPassword: async (username, password) => {
        // CUSTOMIZE THIS FUNCTION
        // if you want to change login method

        let user = await userModel.model
        .findOne({
            username: username,
            password: password
        })
        .lean();
        if (user) user.password = undefined;
        return user;
    },

    async getByEmail(mail) {
        console.log(mail);
        return await userModel.model.findOne({ email: mail });
    },

  
    async getByEmailAndPassword(email, password) {

        let user = await userModel.model
            .findOne({
                email: email,
                password: password,
            })
            .lean();
        return user;
    },

    async getUnverifiedOrganization(id) {
        return await OrganizationModel.model.findOne({
            _admins: id,
            verifiedEmail: null,
        });
    },

    /**
     * UserModel.getUnverifiedOrganization
     *   @description getUnverifiedOrganization
     *   @param ObjectId id id
     *
     */
    async getOrganization(id) {
        return await userModel.getModel().findOne({
            _admins: id,
        });
    },

 
    /**
     * Update Password From Old Pwd
     */
    updatePasswordFromOldPwd: async (idUser, passwordOld, passwordNew) => {
        let user = await userModel.model.findOneAndUpdate(
            { _id: idUser, password: passwordOld },
            {
                password: passwordNew,
            }
        );
        return user;
    },

    /**
     * Update Password
     */
    updatePassword: async (idUser, password) => {
        let user = await userModel.model.findOneAndUpdate(
            { _id: idUser },
            {
                password: password,
            }
        );
        return user;
    },

};

export default userModel;
