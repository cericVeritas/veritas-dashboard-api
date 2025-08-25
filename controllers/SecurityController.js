// Properties
import properties from "../properties";

// Security
import jsonwebtoken from "jsonwebtoken";
import UserModel from "../models/UserModel";
import OrganizationModel from "../models/OrganizationModel";
// Errors
import ErrorManager from "../classes/ErrorManager";
import Errors from "../classes/Errors";

import fs from "fs";
import fetch from "node-fetch";
// import Handlebars from "handlebars";
// import mailer from "./../services/mailer";
import Logger from "../classes/Logger";

import { signToken, verifyToken } from "../services/jwtHelpers";
const bcrypt = require("bcrypt");
const saltRounds = 10;


const securityControllers = {
    /**
     * Init routes
     */
    init: (router) => {
        const baseUrl = `${properties.API}`;
        // router.get(baseUrl + "/convertDb", securityControllers.convertDb);
        
        // router.get(properties.API + "/nonce", securityControllers.getNonce);
        // router.post(properties.API + "/nonce/validate", securityControllers.validateSign);
        
        router.post(baseUrl + "/login", securityControllers.login);
        router.post(baseUrl + "/verifyToken", securityControllers.verifyJWT);
        // router.post(
        //     baseUrl + "/verifyCaptcha",
        //     securityControllers.verifyCaptcha
        // );
        // router.post(baseUrl + "/setPassword", securityControllers.setPassword);
        // router.post(
        //     baseUrl + "/recoverPassword",
        //     securityControllers.recoverPassword
        // );
        // router.post(
        //     baseUrl + "/resetPassword",
        //     securityControllers.resetPassword
        // );
    },

 
    

    // validateSign: async (req, res) => {
    //     let d = req.body;
    //     let msg = d.message;
    //     let sig = d.signature;
    //     let wa = d.wa;

    //     // console.log('wa   💼 ', wa);
    
    //     // let m = walletSignMessage.replace('[wa]',d.wa).replace('[nonce]', d.nonce);
        
    //     let mhash = null;
    //     let ra = null;
        
    //     if(sig.length > 1200){
    //         ra = wa;
    //     }else{
    //         mhash = ethers.utils.hashMessage(msg);
    //         ra = ethers.utils.recoverAddress(mhash, sig);
    //     }

    //     // console.log(mhash, ra);
    //     const addressRegex = /^(0x[a-fA-F0-9]{40}|[A-Za-z1-9]{32,44}|[Tt][A-Za-z1-9]{33}|[A-Za-z0-9-_]{48,64})$/;
    //     const isValidAddress = (a) => addressRegex.test(a);
        
    //     let r = {};
    //     if (isValidAddress(ra)) {
          
    //       let token = jsonwebtoken.sign(
    //           {
    //             ra,
    //           },
    //           properties.TOKEN_SECRET,
    //           {
    //               expiresIn: properties.TOKEN_EXPIRATION_TIME,
    //           }
    //       );
    
    //     //   console.log('jwt on signing',token);
          
    //       r = {
    //         success: true,
    //         jwt: token
    //       }
          
    
    //     } else {
    //       r.success = false;
    //     }
      
      
    //     res.json(r);
    // },



    /**
     * Login function
     *
     */
    login: async (req, res) => {
        try {
            // Get parameters from post request
            let params = req.body;
            console.log(params);

            // Retrieve user by email/username
            let userd = null;
            if(params.email.indexOf('@') > -1){
                userd = await UserModel.getByEmail(params.email);
            }else{
                userd = await UserModel.getByUsername(params.email);
            }

            let user = userd ? { ...userd._doc } : null;
            
            console.log(user);
            if (!user) {
                throw new Errors.INVALID_LOGIN();
            }

            if(!params.org){
                const orgs = await OrganizationModel.findByUser(user._id);
                user.organization = orgs[0];
            }else{
                user.organization = await OrganizationModel.get(params.org);
            }

            // check hashed password
            let passwordValid = bcrypt.compareSync(
                params.password,
                user.password
            );

            if (user && passwordValid) {
                const token = signToken({ 
                    id: user._id,
                    roles: user.roles 
                });
                // let u = { ...user._doc };
                delete user.password;
                res.status(200).json({ token, user: user });
            } else {
                // Error login
                throw new Errors.INVALID_LOGIN();
            }
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * Verify JWT Token function
     *
     */
    verifyJWT: async (req, res) => {
        try {
            let token =
                req.headers.authorization &&
                req.headers.authorization.replace("Bearer ", "");

            console.log(token);

            if (token) {
                let decoded = null;
                let user = null;
                try {
                    decoded = verifyToken(token);
                    // id, iat, exp
                  
                    if(decoded.id && decoded.id !== null){
                        let time = Date.now()/1000;
                        
                        if(time < decoded.exp){
                            user = await UserModel.get(decoded.id);
                        }
                        
                    }else{
                        throw new Errors.INVALID_TOKEN();
                    }
                } catch (err) {
                    Logger.error(err);
                }

                if(user){
                    const orgs = await OrganizationModel.findByUser(user._id);
                    // user.organization = orgs[0];
                    let u = { ...user._doc, organization: orgs[0] };
                    res.json({ user: u });
                }else{
                    return res.json({
                        success: false,
                        user: null,
                        mesage: "Failed to authenticate token",
                    });
                }
           
            } else {
                throw new Errors.NO_TOKEN();
            }
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(400).json(safeErr);
        }
    },

    /**
     * Verify GoogleCaptcha
     *
     */
    verifyCaptcha: async (req, res) => {
        try {
            const VERIFY_URL =
                "https://www.google.com/recaptcha/api/siteverify";
            const SECRET_KEY = "6LeFoccZAAAAAHcdMYjn617HwfEG6nao4zZrve7J";

            return fetch(VERIFY_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `secret=${SECRET_KEY}&response=${req.body.token}`,
            })
                .then((response) => response.json())
                .then((data) => {
                    res.send(data);
                });
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(400).json(safeErr);
        }
    },

    /**
     * Send email to set password
     *
     */
    // setPassword: async (req, res) => {
    //     try {
    //         const instance = await VideoInstanceModel.getByTokenWithOrg(
    //             req.body.token
    //         );
    //
    //         let user = await UserModel.get(instance._organization._admins[0]);
    //
    //         if (!user) {
    //             throw new Errors.USER_NOT_FOUND();
    //         }
    //
    //         if (!!user.password) {
    //             return res.json({
    //                 success: true,
    //                 isPasswordSet: true,
    //             });
    //         }
    //
    //         let token = jsonwebtoken.sign(
    //             {
    //                 _id: user._id,
    //                 mail: user.mail,
    //                 password: user.password,
    //             },
    //             properties.TOKEN_SECRET,
    //             {
    //                 expiresIn: properties.TOKEN_EXPIRATION_TIME,
    //             }
    //         );
    //
    //         // Send recover pwd mail email
    //         let source = fs.readFileSync(
    //             __dirname + "/../templates/mail/setPassword.html",
    //             "utf-8"
    //         );
    //         let template = Handlebars.compile(source);
    //
    //         await mailer.sendMail({
    //             from: `"Zipcan" <${properties.EMAIL_FROM}>`,
    //             to: `"${user.mail}" <${user.mail}>`,
    //             subject: `Set your password!`,
    //             html: template({
    //                 recoverLink: `${properties.ADMIN_URL}/passwordReset?token=${token}`,
    //             }),
    //         });
    //
    //         res.json({
    //             success: true,
    //         });
    //     } catch (err) {
    //         const safeErr = ErrorManager.getSafeError(err);
    //         res.status(400).json(safeErr);
    //     }
    // },
    //
    // /**
    //  * Send email reset password
    //  *
    //  */
    // recoverPassword: async (req, res) => {
    //     try {
    //         // Retrieve user
    //         let user = await UserModel.getByEmail(req.body.mail);
    //         if (!user) {
    //             throw new Errors.USER_NOT_FOUND();
    //         }
    //
    //         let token = jsonwebtoken.sign(
    //             {
    //                 _id: user._id,
    //                 mail: user.mail,
    //                 password: user.password,
    //             },
    //             properties.TOKEN_SECRET,
    //             {
    //                 expiresIn: properties.TOKEN_EXPIRATION_TIME,
    //             }
    //         );
    //
    //         // Send recover pwd mail email
    //         let source = fs.readFileSync(
    //             __dirname + "/../templates/mail/recoverPassword.html",
    //             "utf-8"
    //         );
    //         let template = Handlebars.compile(source);
    //
    //         await mailer.sendMail({
    //             from: `"Zipcan" <${properties.EMAIL_FROM}>`,
    //             to: `"${req.body.mail}" <${req.body.mail}>`,
    //             subject: `Recover your password!`,
    //             html: template({
    //                 recoverLink: `${properties.ADMIN_URL}/passwordReset?token=${token}`,
    //             }),
    //         });
    //
    //         res.json({
    //             success: true,
    //         });
    //     } catch (err) {
    //         const safeErr = ErrorManager.getSafeError(err);
    //         res.status(400).json(safeErr);
    //     }
    // },
    //
    // /**
    //  * Change password for current user
    //  *
    //  */
    // resetPassword: async (req, res) => {
    //     try {
    //         // Decode token
    //         let token = jsonwebtoken.decode(
    //             req.body.token,
    //             properties.TOKEN_SECRET
    //         );
    //
    //         if (!token) {
    //             throw new Errors.TOKEN_NOT_VALID();
    //         }
    //
    //         // Retrieve user
    //         let user = await UserModel.getByEmailAndPassword(
    //             token.mail,
    //             token.password
    //         );
    //
    //         if (!user) {
    //             throw new Errors.TOKEN_NOT_VALID();
    //         }
    //
    //         let passwordNew = await bcrypt.hash(req.body.password, saltRounds);
    //
    //         await UserModel.updatePassword(token._id, passwordNew);
    //         res.json({
    //             success: true,
    //         });
    //     } catch (err) {
    //         const safeErr = ErrorManager.getSafeError(err);
    //         res.status(400).json(safeErr);
    //     }
    // },
};

export default securityControllers;
