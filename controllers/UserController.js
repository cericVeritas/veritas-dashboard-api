import Properties from "../properties";
import UserModel from "../models/UserModel";
import InviteModel from "../models/InviteModel";
import OrganizationModel from "../models/OrganizationModel";
import fs from "fs";
import mailer from "./../services/mailer";
import Handlebars from "handlebars";

import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

// Dependencies
import randToken from "rand-token";



import properties from '../properties';

import { getUserWithToken } from "../services/userHelpers";

import { signToken } from "../services/jwtHelpers";

const bcrypt = require("bcrypt");
const saltRounds = 10;

const UserController = {
  /**
   * Init routes
   */
  init: router => {
    const baseUrl = `${Properties.API}/user`;
    // router.post(baseUrl + "/:id/changePassword", authorize(["ADMIN"]), UserController.changePassword);
    router.post(baseUrl + "", authorize([]), UserController.create);
    router.delete(baseUrl + "/:id", authorize([]), UserController.delete);
    router.get(baseUrl + "/:id", authorize([]), UserController.get);
    // router.get(baseUrl + "/wa/:wa", authorize([]), UserController.getByWallet);
    router.get(baseUrl + "", authorize([]), UserController.list);
    router.post(baseUrl + "/signup", UserController.signup);
    router.post(baseUrl + "/update", authorize([]), UserController.update);

    router.post(baseUrl + "/exists", UserController.checkUserExists);


    router.get(baseUrl + "/invite/:code", UserController.getInviteByCode);
    
  },


  // CRUD METHODS


  /**
  * UserModel.create
  *   @description CRUD ACTION create
  *
  */
  create: async (req, res) => {
    try {
      const result = await UserModel.create(req.body);
      res.json(result);
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  /**
  * UserModel.delete
  *   @description CRUD ACTION delete
  *   @param ObjectId id Id
  *
  */
  delete: async (req, res) => {
    try {
      const result = await UserModel.delete(req.params.id);
      res.json(result);
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  /**
  * UserModel.get
  *   @description CRUD ACTION get
  *   @param ObjectId id Id resource
  *
  */
  get: async (req, res) => {
    try {
      const result = await UserModel.get(req.params.id);
      res.json(result);
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  checkUserExists: async (req, res) => {
    try {
      
      
      let un = req.body.un;

      let reserved = restrictedUsernames.includes(un);
      
      if(!reserved){
        reserved = await UserModel.getByUsername(un);
      }
      
      
      if(reserved){
        res.json({ exists: true });
      }else{
        res.json({ exists: false });
      }
     
      
      
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  getInviteByCode: async (req, res) => {
    try {
        
        let inviteCode = req.params.code;
        console.log(inviteCode);
        const inviteLookup = await InviteModel.findByCode(inviteCode);
        console.log(inviteLookup);
        // const result = await UserModel.getByWalletLean(req.params.wa);
        let n = new Date();
        res.json(inviteLookup);
        // res.json(inviteLookup);

    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  
  /**
  * UserModel.list
  *   @description CRUD ACTION list
  *
  */
  list: async (req, res) => {
    try {
      const result = await UserModel.list();
      res.json(result);
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },


  /**
  * UserModel.update
  *   @description CRUD ACTION update
  *   @param ObjectId id Id
  *
  */
  update: async (req, res) => {
    try {
        let data = req.body;
        let type = data.type || null;
        if(type){
            delete data.type;
            console.log(type);
            console.log(data.tokenid);
            if(type=="addToken" || type == "removeToken"){
                let tid = data.tokenid;
                delete data.tokenid;

                let u = await UserModel.getByWalletLean(data.walletAddress);
                let pt = [...u.portfolioTokens];

                if(type=="addToken"){
                    if(!inObjectArray(pt, tid)){
                        pt.push(tid);
                    }
                }
                if(type=="removeToken"){

                    let pttemp = [];
                    for(var i=0;i<pt.length;i++){
                        if(pt[i].toHexString() !== tid){
                            pttemp.push(pt[i]);
                        }
                    }
                    pt = [...pttemp];
                }

                data.portfolioTokens = [...pt];

            }else if(type=="hideToken"){

                // console.log(data)

                let tid = data.tokenid;
                delete data.tokenid;

                let u = await UserModel.getByWalletLean(data.walletAddress);
                let ht = [...u.hideTokens];

                // console.log('users',htokens)


                if(!inObjectArray(ht, tid)){
                    ht.push(tid);
                }else{
                    let htemp = [];
                    for(var i=0;i<ht.length;i++){
                        if(ht[i] == tid){

                        }else{
                            htemp.push(ht[i])
                        }
                    }
                    ht = [...htemp]
                }

                data.hideTokens = [...ht];
            }
        }
        console.log('update user data');
        console.log(data);
        const update = await UserModel.update(data);
        res.json(update);

    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  

  changePassword: async (req, res) => {
    try {
      res.json({});
    } catch (err) {
      const safeErr = ErrorManager.getSafeError(err);
      res.status(safeErr.status).json(safeErr);
    }
  },

  /**
  * UserModel.register
  *   @description Register a new User
  *
  */
  signup: async (req, res) => {
      try {
        
          // Validate captcha
          // const VERIFY_URL =
          //     "https://www.google.com/recaptcha/api/siteverify";
          // const SECRET_KEY = properties.GOOGLE_RECAPTCHA_TOKEN;
          //
          // let responseCaptcha = await fetch(VERIFY_URL, {
          //     method: "POST",
          //     headers: {
          //         "Content-Type": "application/x-www-form-urlencoded",
          //     },
          //     body: `secret=${SECRET_KEY}&response=${req.body.recaptchaToken}`,
          // });
          // let recatpchaResult = await responseCaptcha.json();
          //
          // if (recatpchaResult.success !== true) {
          //     Logger.error("Captcha not valid: ", recatpchaResult);
          //     // throw new Errors.INVALID_CAPTCHA();
          // }
          console.log('body 🔥',req.body);

          let code = req.body.ic;
          let inviteLookup = await InviteModel.findByCode(code);
          console.log('invite️‍🔥',code,inviteLookup);

          if(!inviteLookup && code == "init"){
            inviteLookup = {};
            inviteLookup.role = "superadmin";
          }
          
          // Validate inputs
          if (!req.body.email || !req.body.password)
              throw new Errors.INVALID_BODY();

          const userExist = await UserModel.getByEmail(req.body.email);

          if (userExist) {
            console.log('user already exists');
              // Check not validated
              const org = await UserModel.getUnverifiedOrganization(
                  userExist._id
              );
            //   if (org) {
            //       throw new Errors.VALIDATION_REQUIRED();
            //   }

              // Check duplicate
              if (properties.MULTIPLE_USER !== "true") {
                  throw new Errors.EXISTING_USER();
              }
          }

          let myPassword = "";

          await bcrypt
              .hash(req.body.password, saltRounds)
              .then(function (hash) {
                  myPassword = hash;
              });

          let now = new Date();
          // Register
          const user = await UserModel.create({
              email: req.body.email,
            //   username: req.body.email,
              firstname: req.body.firstname,
              lastname: req.body.lastname,
            //   companyURL: req.body.orgUrl,
              password: myPassword,
              roles: [`${inviteLookup.role}`],
              // recaptchaScore: recatpchaResult.score,
              // recaptchaError: recatpchaResult["error-codes"],
          });

          // Create org
          // let orgReturn = null;
          // if(!inviteLookup.organization){
          //   req.body.name = req.body.orgname;
        
          //   if (!req.body.name) {
          //       throw new Errors.MISSING_NAME();
          //   }

          //   req.body._users = [user._id];
          //   req.body._admins = [user._id];

          //   req.body.created = now;
          //   req.body.updated = now;
          //   req.body.updater = user._id;
          //   req.body.owner = user._id;
          //   const resultOrg = await OrganizationModel.create(req.body);
          //   orgReturn = resultOrg;
          // }else{

          //   let org = await OrganizationModel.get(inviteLookup.organization._id);
          //   org._users.push(user._id);
          //   org._admins.push(user._id);
          //   await org.save();
          //   orgReturn = org;
          // }





          

          // THEMED INSTANCE FLOW

        //   req.body._organization = resultOrg._id;

    
        //   if (!req.body._organization) {
        //       throw new Errors.UNAUTHORIZED();
        //   }

          // const org = await OrganizationModel.findByUserAndId(
          //     user._id,
          //     req.body._organization
          // );
          // if (!org) {
          //     throw new Errors.UNAUTHORIZED();
          // }
          //
          // let newTheme = { ...themeDefault };
          // newTheme.organization = req.body._organization;
          // newTheme.createdAt = now;
          // newTheme.updatedAt = now;
          // const theme = await ThemeModel.create(newTheme);

       
        //   map.token = randToken.generate(12);
          
        //   let response = await getUserWithToken(user._doc);
        //   res.json(response);


          

          if (properties.SEND_EMAIL !== "false") {
            console.log('sending email');
              // Send registration email
              let source = fs.readFileSync(
                  __dirname + "/../templates/mail/registration.html",
                  "utf-8"
              );
            //   let template = Handlebars.compile(source);

            //   await mailer.sendMail({
            //       from: `"Veritas" <${properties.EMAIL_FROM}>`,
            //       to: `"${user.mail}" <${user.mail}>`,
            //       subject: `Welcome to Veritas!`,
            //       html: template({
            //           appUrl: properties.APP_URL,
            //           adminUrl: properties.ADMIN_URL,
            //           map: map,
            //           token: resultMap.token,
            //           verificationURL: `${properties.ADMIN_URL}/map/${map.token}`,
            //       }),
            //   });
          }

          const token = signToken({ 
              id: user._id,
              roles: user.roles 
          });

         
          let u = { ...user._doc };
          delete u.password;

          res.status(200).json({ token, user: u });


      } catch (err) {
          const safeErr = ErrorManager.getSafeError(err);
          res.status(safeErr.status).json(safeErr);
      }
  },


};

export default UserController;
