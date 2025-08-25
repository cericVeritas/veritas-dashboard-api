import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

import Logger from "../classes/Logger";
import { nanoid } from 'nanoid';

const claimModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection();

    
    const claimSchema = new mongoose.Schema({
        
        claimId: {
            type: String,
            default: null,
        },
        from: {
          type: String,
          default: null,
        },
        to: {
            type: String,
            default: null,
        },

        provider: {
            type: Object,
            default: null,
        },

        
        patient: {
          type: Object,
          default: null,
        },
        

        member: {
            type: Object,
            default: null,
        },
       

        flags: [{
          type: Schema.ObjectId,
          ref: "User"
        }],

      

        // emails, comments, etc
        

        updated: {
          type: "Date",
          default: null,
        },
        updater: {
          type: Schema.ObjectId,
          ref: "User"
        },
        creator: {
          type: Schema.ObjectId,
          ref: "User"
        },
        created: {
          type: "Date",
          default: null,
        },
        

        
        organization: {
          type: Schema.ObjectId,
            ref: "Organization"
        },

        
        // provider: {
        //   type: Schema.ObjectId,
        //     ref: "Provider"
        // },

        location: {
          type: String,
          default: null,
        },
        

        zipcode: {
          type: String,
          default: null,
        },

        versions: [{
          type: Schema.ObjectId,
          ref: "File",
          default: []
        }],

        

        notes: {
          type: Array,
          default: [],
        },

        codes: [{
          type: Schema.ObjectId,
          ref: "Code",
          default: []
        }],

      


    });

    claimModel.setModel(mongoose.model("Claim", claimSchema));

    return claimSchema;
  },

  /**
   * Set Model
   */
  setModel: model => {
    claimModel.model = model;
  },

  /**
   * Get model
   */
  getModel: () => {
    return claimModel.model;
  },

  // Start queries


  // CRUD METHODS


  async create(item) {
    const obj = new claimModel.model(item);
    return await obj.save();
  },

  async delete(id) {
    return await claimModel.model.findByIdAndRemove(id);
  },

  
  async get(id) {
    return await claimModel.model.findOne({ _id : id });
  },

  /**
  * OrganizationModel.list
  *   @description CRUD ACTION list
  *
  */
  async list() {
    return await claimModel.model.find();
  },

  /**
  * OrganizationModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  async update(item) {
    return await claimModel.model.findOneAndUpdate({ _id: item._id }, item);
  },

  async findByOrg(id) {
    return await claimModel.model.find({
        organization: id
    }).populate({
      path: 'updater',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'creator',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    }).lean();
   
  },

  async findBySlug(slug) {
    return await claimModel.model.findOne({ slug: slug });
  },

  async findByType(t) {
    return await claimModel.model.findOne({
        type: t
    });
  },

};

export default claimModel;
