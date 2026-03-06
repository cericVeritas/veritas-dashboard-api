
// Database
import Database from "../classes/database_veritas";
import mongoose, { Schema } from "mongoose";

// Logger
import Logger from "../classes/Logger";

import { featuresDefault } from "../utils/data";

const accountModel = {
  /**
   * Init  schema
   */
  init() {
    const db = Database.getConnection();

    /**
      * Organization
      */
    const accountSchema = new mongoose.Schema({
        name: {
            type: "String",
            default: null,
        },
        settings: {
            markUp: {
                type: "Double",
                default: 1.5,
            },
        },

    });

    accountModel.setModel(mongoose.model("Account", accountSchema));

    return accountSchema;
  },

  /**
   * Set Model
   */
  setModel: model => {
    accountModel.model = model;
  },

  /**
   * Get model
   */
  getModel: () => {
    return accountModel.model;
  },

  // Start queries


  // CRUD METHODS


  /**
  * accountModel.create
  *   @description CRUD ACTION create
  *
  */
  async create(item) {
    const obj = new accountModel.model(item);
    return await obj.save();
  },

  /**
  * accountModel.delete
  *   @description CRUD ACTION delete
  *   @param ObjectId id Id
  *
  */
  async delete(id) {
    return await accountModel.model.findByIdAndDelete(id);
  },

  async getUserAccount(idArray) {
    return await accountModel.model.find({
      _id: {
        $in: idArray
      }
    });
  },

  /**
  * accountModel.get
  *   @description CRUD ACTION get
  *   @param ObjectId id Id resource
  *
  */
  async get(id) {
    return await accountModel.model.findOne({ _id : id });
  },

  async getTeam(id) {
    return await accountModel.model.findOne({ _id : id });
  },

  /**
  * accountModel.list
  *   @description CRUD ACTION list
  *
  */
  async list() {
    return await accountModel.model.find();
  },

  /**
  * accountModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  async update(item) {
    return await accountModel.model.findOneAndUpdate({ _id: item.id }, {name: item.name}, {'new': true});
  },

  async updateMarkUp(item) {
    return await accountModel.model.findOneAndUpdate({ _id: item.id }, {settings: {...item.settings, markUp: item.markUp}}, {'new': true});
  }



};

export default accountModel;
