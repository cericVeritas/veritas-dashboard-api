import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

import Logger from "../classes/Logger";
import { nanoid } from 'nanoid';

const codeModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection();

    
    const codeSchema = new mongoose.Schema({
        
        code: {
          type: String,
          default: null,
          required: true,
        },
        data: {
          type: "Object",
          default: null,
        },

        section: {
            type: String,
            default: null
        },

        subSection: {
            type: String,
            default: null
        },

        description: {
            type: String,
            default: null
        },

        type: {   // cpt, icd10, etc
            type: String,
            default: null
        },

    
        flags: [{
          type: Schema.ObjectId,
          ref: "User"
        }],

        bookmarks: [{
          type: Schema.ObjectId,
          ref: "User"
        }],

        countLookup: {
          type: Number,
          default: 0,
        },

        countRePrice: {
          type: Number,
          default: 0,
        },

        countAudit: {
          type: Number,
          default: 0,
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
        }
       

    });

    codeModel.setModel(mongoose.model("Code", codeSchema));

    return codeSchema;
  },

  /**
   * Set Model
   */
  setModel: model => {
    codeModel.model = model;
  },

  /**
   * Get model
   */
  getModel: () => {
    return codeModel.model;
  },

  // Start queries


  // CRUD METHODS


  async create(item) {
    const obj = new codeModel.model(item);
    return await obj.save();
  },

  async delete(id) {
    return await codeModel.model.findByIdAndRemove(id);
  },

  
  async get(id) {
    return await codeModel.model.findOne({ _id : id });
  },

  /**
  * OrganizationModel.list
  *   @description CRUD ACTION list
  *
  */
  async list() {
    return await codeModel.model.find();
  },

  /**
  * OrganizationModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  async update(item) {
    return await codeModel.model.findOneAndUpdate({ _id: item._id }, item);
  },

//   async findByOrg(id) {
//     return await codeModel.model.find({
//         organization: id
//     }).populate({
//       path: 'updater',   // field with ObjectId that you want to populate
//       select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
//     })
//     .populate({
//       path: 'creator',   // field with ObjectId that you want to populate
//       select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
//     }).lean();
   
//   },

//   async findBySlug(slug) {
//     return await codeModel.model.findOne({ slug: slug });
//   },

//   async findByType(t) {
//         return await codeModel.model.findOne({
//             type: t
//         });
//   },

 



};

export default codeModel;
