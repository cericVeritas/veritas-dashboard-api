import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

import Logger from "../classes/Logger";
import { nanoid } from 'nanoid';


// repriced amount then svaings on hcp return
const fileModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection();

    
    const fileSchema = new mongoose.Schema({
        
    
        name: {
          type: String,
          default: null,
        },
        size: {
          type: Number,
          default: 0,
        },
        rawFile: {
          type: String,
          default: null,
        },
        data: {
          type: "Object",
          default: null,
        },
        slug: {
          type: String,
          default: null,
          required: true,
          unique: true,
        },
        isParent: {
          type: Boolean,
          default: true,
        },
        parent: {
          type: Schema.ObjectId,
          ref: "File",
          default: null
        },
        versionName: {
          type: String,
          default: null,
        },

        
        status: {
          type: String,
          enum: ['uploaded','audited', 'repriced', 'verified'], // These are the only statuses available
          default: 'uploaded'
        },

        audit: {
          type: Object,
          default: null,
        },
        

        flags: [{
          type: Schema.ObjectId,
          ref: "User"
        }],

        bookmarks: [{
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
        uploaded: {
          type: "Date",
          default: null,
        },

        
        organization: {
          type: Schema.ObjectId,
            ref: "Organization"
        },
        provider: {
          type: String,
          default: null,
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

        claims: [{
          type: Schema.ObjectId,
          ref: "Claim",
          default: []
        }],

        envelopes: [{
          type: Object,
          default: null
        }],

        // versions: [{
        //   type: Schema.ObjectId,
        //   ref: "Note",
        //   default: []
        // }],



    });

    fileModel.setModel(mongoose.model("File", fileSchema));

    return fileSchema;
  },

  /**
   * Set Model
   */
  setModel: model => {
    fileModel.model = model;
  },

  /**
   * Get model
   */
  getModel: () => {
    return fileModel.model;
  },

  // Start queries


  // CRUD METHODS


  async create(item) {
    const obj = new fileModel.model(item);
    return await obj.save();
  },

  async delete(id) {
    return await fileModel.model.findByIdAndRemove(id);
  },

  
  async get(id) {
    return await fileModel.model.findOne({ _id : id });
  },

  /**
  * OrganizationModel.list
  *   @description CRUD ACTION list
  *
  */
  async list() {
    return await fileModel.model.find();
  },

  /**
  * OrganizationModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  async update(item) {
    return await fileModel.model.findOneAndUpdate({ _id: item._id }, item);
  },

  async findByQuery(q) {
    return await fileModel.model.find({
        organization: id,
        isParent: true
    }).populate({
      path: 'updater',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'versions',   // field with ObjectId that you want to populate
      select: '_id name size status versionName data rawFile created updated uploaded creator updater organization slug'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'creator',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    }).lean();
   
  },

  async findByOrg(id) {
    return await fileModel.model.find({
        organization: id,
        isParent: true
    }).populate({
      path: 'updater',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'versions',   // field with ObjectId that you want to populate
      select: '_id name size status versionName data rawFile created updated uploaded creator updater organization slug'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'creator',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    }).lean();
   
  },

  async findBySlug(slug) {
    return await fileModel.model.findOne({ slug: slug }).populate({
      path: 'updater',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'versions',   // field with ObjectId that you want to populate
      select: '_id name size status versionName data rawFile created updated uploaded creator updater organization slug'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'creator',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    }).lean();
  },

  async query(q) {
    console.log('query',q);
    return await fileModel.model.find(q).populate({
      path: 'updater',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'versions',   // field with ObjectId that you want to populate
      select: '_id name size status versionName data rawFile created updated uploaded creator updater organization slug'  // fields you want to select (space-separated)
    })
    .populate({
      path: 'creator',   // field with ObjectId that you want to populate
      select: '_id firstname lastname email title bio location roles username avatarFile'  // fields you want to select (space-separated)
    }).lean();
    
  },

  async findByType(t) {
    return await fileModel.model.findOne({
        type: t
    });
  },

 



};

export default fileModel;
