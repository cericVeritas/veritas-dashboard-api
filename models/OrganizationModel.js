
// Database
import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

// Logger
import Logger from "../classes/Logger";

import { featuresDefault } from "../utils/data";

const organizationModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection();

    /**
      * Organization
      */
    const organizationSchema = new mongoose.Schema({
        name: {
            type: "String",
            default: null,
        },
        website: {
            type: "String",
            default: null,
        },
        logo: {
            type: "String",
            default: null,
        },
        color: {
            type: "String",
            default: '#333333',
        },
        verifiedEmail: {
            type: "String",
            default: null,
        },
       
        // RELATIONS
        _users: [{
            type: Schema.ObjectId,
            ref: "User"
        }],
        _admins: [{
            type: Schema.ObjectId,
            ref: "User"
        }],

        markupPercent: {
            type: "Number",
            default: 150,
        },
        
        features: {

            whiteLabel: {
                type: "Boolean",
                default: featuresDefault.whiteLabel,
            },
           
            hideBranding: {
                type: "Boolean",
                default: featuresDefault.hideBranding,
            },
            theming: {
                type: "Boolean",
                default: featuresDefault.theming,
            },
            customCSS: {
                type: "Boolean",
                default: featuresDefault.customCSS,
            },
        },
        teamLimit: {
            type: "Number",
            default: 3,
        },
        teamMemberCount: {
            type: "Number"
        },
        updated: {
            type: "Date",
            default: null,
        },
        updater: {
            type: Schema.ObjectId,
            ref: "User"
        },
        created: {
            type: "Date",
            default: null,
        },
        owner: {
            type: Schema.ObjectId,
            ref: "User"
        },
        accountId: {
            type: Schema.ObjectId,
            ref: "Account"
        },


    }, {
        collection: "employerGroup" 
    });

    organizationModel.setModel(mongoose.model("Organization", organizationSchema));

    return organizationSchema;
  },

  /**
   * Set Model
   */
  setModel: model => {
    organizationModel.model = model;
  },

  /**
   * Get model
   */
  getModel: () => {
    return organizationModel.model;
  },

  // Start queries


  // CRUD METHODS


  /**
  * OrganizationModel.create
  *   @description CRUD ACTION create
  *
  */
  async create(item) {
    const obj = new organizationModel.model(item);
    return await obj.save();
  },

  /**
  * OrganizationModel.delete
  *   @description CRUD ACTION delete
  *   @param ObjectId id Id
  *
  */
  async delete(id) {
    return await organizationModel.model.findByIdAndDelete(id);
  },

  /**
  * OrganizationModel.get
  *   @description CRUD ACTION get
  *   @param ObjectId id Id resource
  *
  */
  async get(id) {
    return await organizationModel.model.findOne({ _id : id });
  },

  async getTeam(id) {
    return await organizationModel.model.findOne({ _id : id });
  },

  /**
  * OrganizationModel.list
  *   @description CRUD ACTION list
  *
  */
  async list() {
    return await organizationModel.model.find();
  },

  async getOrgByAccountId(id) {
    return await organizationModel.model.find({ accountId : id });
  },

  /**
  * OrganizationModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  async update(item) {
    return await organizationModel.model.findOneAndUpdate({ _id: item.id }, {name: item.name}, {'new': true});
  },

  async findByUser(idUser) {
        return await organizationModel.model.find({
            _users: idUser,
        });
  },

  async findByUserAndId(idUser, idOrg) {
    return await organizationModel.model.findOne({
        _id: idOrg,
        _users: idUser,
    });
  },



};

export default organizationModel;
