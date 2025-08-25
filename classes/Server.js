// Express
import express from "express";
import http from "http";
import { createServer } from "http";
import bodyParser from "body-parser";
import fileUpload from 'express-fileupload';

import fs from "fs";


import process from "process";



// Logging
import Logger from "./Logger";

// Properties
import properties from "../properties.js";

// Security
import cors from "cors";
import helmet from "helmet";


// Controllers
import SecurityController from "../controllers/SecurityController";

// Database
import Database from "./database_veritas.js";

import UserController from "../controllers/UserController";
import OrganizationController from "../controllers/OrganizationController";
import InviteController from "../controllers/InviteController";
import FileController from "../controllers/FileController";
import CodeController from "../controllers/CodeController";
// import CoreController from "../controllers/CoreController";


// import {
//     startListen
// } from "../services/dataHelpers";


const { exec } = require('child_process');

var cron = require('node-cron');
// const mongoSanitize = require('express-mongo-sanitize');

const axios = require('axios');

class Server {
    constructor() {
        this.app = express();
    }

    /**
     * Start the server
     * @returns {Promise<void>}
     */
    async init() {
        let nowinit = new Date();
        Logger.info(
            "\r\n\r\n----------- Starting Veritas -------------------\r\n"
        );
        Logger.info(
            "Starting " +
                nowinit.toDateString() +
                " " +
                nowinit.toTimeString() +
                " on " +
                properties.PORT +
                " PORT "
        );

        // Start Init Database
        Database.init();
        // End Init Database
        Logger.info(
            "\r\n\r\n-----------------------------------\r\n\r\nDatabases initiated.\r\n\r\n-----------------------------------\r\n"
        );
        // Add parser
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        // ADD FILE UPLOAD MIDDLEWARE
        this.app.use(fileUpload({
          createParentPath: true,
          limits: { fileSize: 50 * 1024 * 1024 },
        }));
        
        this.app.use((req, res, next) => {
            if (req.method != "OPTIONS") {
                Logger.express(`${req.method} - ${req.url.substr(0, 120)}`);
            }
            next();
        });

        // this.app.use(require('express-status-monitor')());


        // this.app.use(require('express-status-monitor')({
        //     path: '/status',
        //     chartVisibility: {
        //       cpu: true,
        //       mem: true,
        //       load: true,
        //       rps: true,
        //       statusCodes: true,
        //       responseTime: true,
        //     },
            
        //     // Set colors for charts
        //     chartColors: {
        //       cpu: '#00FF41',
        //       mem: '#00FF41',
        //       load: '#00FF41',
        //       rps: '#00FF41',
        //       responseTime: '#00FF41',
        //       statusCodes: {
        //         '2xx': '#00FF41',
        //         '3xx': '#3FB6A9',
        //         '4xx': '#FFC952',
        //         '5xx': '#FF312E',
        //       },
        //     },
        // }));






        // Security
        this.app.use(helmet({
            frameguard: false,
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'self'"]
                }
            }
        }));
        // this.app.use(helmet.frameguard({ action: "SAMEORIGIN" }));

        let hosts = properties.CORS_ORIGIN.split(",");
        var corsOptions = {
            origin: hosts.length > 1 ? hosts : properties.CORS_ORIGIN,
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
            allowedHeaders:
                "Origin, X-Requested-With, Content-Type, Accept, Cache-Control, *",
        };
        Logger.info("Limiting CORS origins to: " + properties.CORS_ORIGIN);

        this.app.use(cors(corsOptions));
        // this.app.use(mongoSanitize());

      
        // Start App Server
        // const server = http.Server(this.app);
        const server = createServer(this.app);

        // server.setTimeout(12000);

        const logfile = 'logs/log.txt';


     

        await server.listen(process.env.PORT);

        server.on('timeout', (socket) => {
            console.log('🧠  timeout occurred');
            // console.log('Remote Address:', socket.remoteAddress);
            // console.log('Remote Port:', socket.remotePort);
            // console.log('Request Headers:', socket.headers);
            // console.log('Request URL:', socket.url);
            // console.log('Request Method:', socket.method);
            socket.destroy();
        });

   
        Logger.info("Server started on port " + properties.PORT);
        
        // need defined api pro plan for this socket server
        // await definedSocketServer();

        // Import controllers
        const router = express.Router();
        SecurityController.init(router);

        // Public folder
        // Sandbox

        // this.app.use(express.static("public"));
        if (properties.ENABLE_SANDBOX == "true") {
            Logger.info("Enable Sandbox");
            this.app.use(express.static("public"));
        } else {
            router.get("/", function (req, res) {
                res.send();
            });
        }

        // Start Init Controllers
        UserController.init(router);
        OrganizationController.init(router);
        InviteController.init(router);
        FileController.init(router);
        CodeController.init(router);
        Logger.info('init sequence complete')

        // Widget.init(router);
        this.app.use("/", router);

        // WidgetTracker.init(router);

    
        cron.schedule('*/10 * * * * *', () => {
            // maintainCore();
            console.log('maintainCore');
        });

        // cron.schedule('*/20 * * * * *', () => {
        //     processNewPairs();
        // });


       

        setInterval(() => {

            const memoryUsage = process.memoryUsage();
            const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // Convert to MB
            const memoryLimit = 500; // Set memory limit in MB
          
            console.log(`🧠 ${heapUsed.toFixed(2)} MB`);
            
            if (heapUsed > memoryLimit) {

              console.log(`🧠🧠 🧨🧨 💣💣 Memory limit exceeded. Restarting server...`);

              exec('pm2 restart app', (error, stdout, stderr) => {
                if (error) {
                  console.error(`Error restarting server: ${error.message}`);
                  return;
                }

              });
            }

        }, 10000);


        ///////////////////////////////


        process.on('uncaughtException', (err, origin) => {
            let now = new Date();
            let data = '';
            data = `---- ur\nDate: ${now}\nunCaught Exception: ${err}\n${err.stack}\n` +

            fs.appendFile(logfile, data, (err) => {
              if (err) {
                console.log(err);
              }
              else {
                // Get the file contents after the append operation
                // console.log("\nFile Contents of file after append:",
                //   fs.readFileSync(logfile, "utf8"));
              }
            });
        });


        process.on('unhandledRejection', async (err, origin) => {
            let now = new Date();

            let oerror;
            try {
                oerror = await origin;
            } catch (err) {
                oerror = err;
            }

            let data = '';

            if(origin !== undefined){
                data = `---- ur\nDate: ${now}\nunhandledRejection: ${err}\n${err.stack}\n` +
                `Exception origin: ${oerror}`;

                origin.then((result) => {
                  // Handle the resolved value of the Promise
                //   console.log(result);
                }).catch((error) => {
                  // Handle any errors that occurred during the Promise execution
                //   console.error(error);
                });
            }else{
                data = `---- ur\nDate: ${now}\nunhandledRejection: ${err}\n${err.stack}\n` ;
            }

            fs.appendFile(logfile, data, (err) => {
              if (err) {
                // console.log(err);
              }
              else {
                // Get the file contents after the append operation
                // console.log("\nFile Contents of file after append:",
                //   fs.readFileSync(logfile, "utf8"));
              }
            });
        });
        
        process.on('unhandledRejection', (reason, promise) => {
          console.error('Unhandled rejection:', reason);
          console.error(promise);
        });


    }

    
}


export default new Server();
