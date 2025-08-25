import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

import Logger from "../classes/Logger";


const inviteModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection();

    
    const inviteSchema = new mongoose.Schema({
        code: {
            type: "String"
        },
        email: {
            type: "String",
            default: null,
            required: true,
        },
        invitedBy: {
            type: Schema.ObjectId,
            ref: "User"
        },
        type: {
            type: String,
            enum: ['user','organization'],
            default: 'user'
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'superadmin'], // These are the roles available
            default: 'user'
        },
        organization: {
            type: Schema.ObjectId,
            ref: "Organization"
        },
        acceptedAt: {
            type: "Date",
            default: null,
        },
        acceptedBy: {
            type: Schema.ObjectId,
            ref: "User"
        },
        created: {
            type: "Date",
            default: null,
        },
        expires: {
            type: "Date",
            default: null,
        },

        updated: {
            type: "Date",
            default: null,
        },

    });

    inviteModel.setModel(mongoose.model("Invite", inviteSchema));
    return inviteSchema;

  },

  /**
   * Set Model
   */
  setModel: model => {
    inviteModel.model = model;
  },

  /**
   * Get model
   */
  getModel: () => {
    return inviteModel.model;
  },

  // Start queries


  // CRUD METHODS


  async create(item) {
    const obj = new inviteModel.model(item);
    return await obj.save();
  },

  async delete(id) {
    return await inviteModel.model.findByIdAndRemove(id);
  },

  
  async get(id) {
    return await inviteModel.model.findOne({ _id : id });
  },

  /**
  * OrganizationModel.list
  *   @description CRUD ACTION list
  *
  */
  async list() {
    return await inviteModel.model.find();
  },

  async getByOrg(orgId) {
    return await inviteModel.model.find({ organization: orgId });
  },

  async getByType(type) {
    return await inviteModel.model.find({ type: type });
  },

  /**
  * OrganizationModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  async update(item) {
    return await inviteModel.model.findOneAndUpdate({ _id: item._id }, item);
  },

  async findByCode(c) {
        return await inviteModel.model.findOne({
            code: c
        }).populate('organization');
  },

 



};

export default inviteModel;
