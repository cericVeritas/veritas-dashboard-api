// Properties
import Properties from "../properties";

// Database
import FileModel from "../models/FileModel";

// Security
import { authorize } from "../security/SecurityManager";

// Errors
import Errors from "../classes/Errors";
import ErrorManager from "../classes/ErrorManager";

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fileUpload from 'express-fileupload';
import bodyParser from 'body-parser';
import { X12parser } from 'x12-parser';
import { createReadStream } from 'node:fs';
import { nanoid } from 'nanoid';
import { parseX12File, addGeoX12, processX12 } from '../services/fileHelpers';
import needle from 'needle';

const FileController = {


    init: router => {
        const baseUrl = `${Properties.API}/file`;
        router.post(baseUrl + "/upload", authorize(["USER"]), FileController.upload);
        router.post(baseUrl + "", authorize(["ADMIN"]), FileController.create);
        router.delete(baseUrl + "/:id", authorize(["ADMIN"]), FileController.delete);
        router.get(baseUrl + "/:id", authorize([]), FileController.get);
        router.get(baseUrl + "", authorize(["SUPERADMIN"]), FileController.list);
        router.get(baseUrl + "/org/:id", authorize(["USER"]), FileController.getByOrg);
        router.get(baseUrl + "/slug/:slug", authorize(["USER"]), FileController.getBySlug);
        
        router.post(baseUrl + "/query", authorize(["USER"]), FileController.query);
        router.post(baseUrl + "/process", authorize(["USER"]), FileController.process);
        router.post(baseUrl + "/:id", authorize(["ADMIN"]), FileController.update);
        
    },

    get: async (req, res) => {
        try {
        const result = await FileModel.get(req.params.id);
        res.json(result);
        } catch (err) {
        const safeErr = ErrorManager.getSafeError(err);
        res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * FileModel.create
     *   @description CRUD ACTION create
     *
     */
    create: async (req, res) => {
        try {
            let data = req.body;
            console.log(data)
            let now = new Date();
            // let expires = new Date(now.getTime() + 1000 * 3600 * 24 * 30); // 30 days
            let d = {
                updated: new Date(),
                created: now,
                creator: req.user._id,
                organization: req.user.organization,
                type: data.type,
             
            }
            const result = await FileModel.create(d);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * FileModel.delete
     *   @description CRUD ACTION delete
     *   @param ObjectId id Id
     *
     */
    delete: async (req, res) => {
        try {
            
            const result = await FileModel.delete(req.params.id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * FileModel.list
     *   @description CRUD ACTION list
     *
     */
    list: async (req, res) => {
        try {
            const result = await FileModel.findByUser(req.user._id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    getByOrg: async (req, res) => {
        try {
            const result = await FileModel.findByOrg(req.params.id);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    getBySlug: async (req, res) => {
        try {
            const result = await FileModel.findBySlug(req.params.slug);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    query: async (req, res) => {
        try {
            console.log('query',req.body, 'user',req.user);
            let q = req.body.search;
            let org = req.body.org;
            let query = {
                organization: org,
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { rawFile: { $regex: q, $options: 'i' } },
                    { status: { $regex: q, $options: 'i' } },
                 
                ]
            }
            const result = await FileModel.query(query);
            console.log('result',result.length);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * FileModel.update
     *   @description CRUD ACTION update
     *   @param ObjectId id Id
     *
     */
    update: async (req, res) => {
        try {
            const result = await FileModel.update(req.body);
            res.json(result);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    process: async (req, res) => {
        try {
            
            let user = req.user;
            let ptype = req.body.type;
            let slug = req.body.slug;
            const result = await FileModel.findBySlug(slug);
            let x12 = result.rawFile;
            console.log('x12',x12);
            let repriceData = await processX12(x12, ptype);

            if(!repriceData){
                console.log(`⚠️ ${ptype} error!`);
                res.status(400).json({
                    success: false,
                    error: 'Reprice failed'
                });
                return null;
            }

            let now = new Date();

            const newFile = {
                name: `${result.name.replace(/\.x12/g, '')}_reprice_${result.versions.length + 1}.x12`,
                size: result.size,
                rawFile: repriceData.raw,
                data: repriceData, // Store the parsed data
                status: ptype == "reprice" ? "repriced" : "audited",
                versionName: `${ptype}_${result.versions.length + 1}`,
                isParent: false,
                parent: result._id,
                created: now,
                updated: now,
                uploaded: now,
                creator: user.id,
                updater: user.id,
                organization: result.organization._id,
                slug: nanoid(),
            };

            const fileCreated = await FileModel.create(newFile);

            // Update the parent file with new version and status
            const updateData = {
                _id: result._id,
                versions: [...result.versions, fileCreated._id],
                updated: now,
                status: ptype == "reprice" ? "repriced" : "audited"
            };

            let resultUpdated = await FileModel.update(updateData);
            console.log('resultUpdated',resultUpdated);
            

            
            res.json(fileCreated);
        } catch (err) {
            const safeErr = ErrorManager.getSafeError(err);
            res.status(safeErr.status).json(safeErr);
        }
    },

    /**
     * File upload endpoint
     * Handles file uploads and stores them locally in /files directory
     */
    upload: async (req, res) => {
        console.log('=== UPLOAD FUNCTION CALLED ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        let org = req.body.org;
        let lastModified = req.body.lastModified;
        let user = req.user;

        let uploadedFilePath = null; // Track the file path for cleanup

        try {
            // Check if file exists in request
            if (!req.files || !req.files.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                });
            }

            const uploadedFile = req.files.file;
            
            // Validate file
            if (!uploadedFile.name || uploadedFile.size === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid file'
                });
            }

            // Create files directory if it doesn't exist
            const filesDir = path.join(process.cwd(), 'files');
            if (!fs.existsSync(filesDir)) {
                fs.mkdirSync(filesDir, { recursive: true });
            }

            // Generate unique filename to prevent conflicts
            const fileExtension = path.extname(uploadedFile.name);
            const fileName = `${Date.now()}_${uuidv4()}${fileExtension}`;
            const filePath = path.join(filesDir, fileName);
            uploadedFilePath = filePath; // Track for cleanup

            // Move file to destination
            await uploadedFile.mv(filePath);

            // Extract file metadata
            const fileStats = fs.statSync(filePath);
            
            // Parse file data if needed (for text files, images, etc.)
            let fileData = null;
            let parsedData = null;
            
            try {
                // Read file content for processing
                if (uploadedFile.mimetype.startsWith('text/') ||
                    fileExtension === '.x12' ||
                    uploadedFile.mimetype === 'application/json' ||
                    uploadedFile.mimetype === 'application/xml') {
                    fileData = fs.readFileSync(filePath, 'utf8');
                    
                    // Parse based on file type
                    if (uploadedFile.mimetype === 'application/json') {
                        parsedData = JSON.parse(fileData);
                    } else if (uploadedFile.mimetype === 'application/xml') {
                        // Basic XML parsing - you might want to use a proper XML parser
                        parsedData = { type: 'xml', content: fileData };
                    } else if (fileExtension === '.x12' || uploadedFile.name.toLowerCase().includes('x12')) {
                       
                        try {
                            

                            const x12Data = parseX12File(fileData);

                            let addGeo = await addGeoX12(x12Data);
                            // console.log(addGeo);
                            
                            parsedData = {
                                type: 'x12',
                                file: addGeo,
                                raw: fileData
                            };

                        
                            
                        } catch (x12Error) {
                            console.error('X12 parsing error:', x12Error);
                            parsedData = { 
                                type: 'x12_error', 
                                error: x12Error.message,
                                raw: fileData 
                            };
                        }
                    } else {
                        parsedData = { type: 'text', content: fileData };
                    }
                } else if (uploadedFile.mimetype.startsWith('image/')) {
                    // For images, you might want to process them differently
                    parsedData = { 
                        type: 'image', 
                        dimensions: 'to_be_processed',
                        size: fileStats.size 
                    };
                } else {
                    // For other file types
                    parsedData = { 
                        type: 'binary', 
                        size: fileStats.size 
                    };
                }
            } catch (parseError) {
                console.log('File parsing error:', parseError.message);
                parsedData = { 
                    type: 'unparseable', 
                    error: parseError.message 
                };
            }

            let rebased = parsedData.file.claims[0].pricing !== undefined;

            // Create FileModel record
            let now = new Date();
            const newFile = {
                name: uploadedFile.name,
                size: fileStats.size,
                rawFile: fileData,
                data: parsedData, // Store the parsed data
                status: rebased ? 'repriced' : 'uploaded',
                created: lastModified ? lastModified : now,
                updated: now,
                uploaded: now,
                creator: user.id,
                updater: user.id,
                organization: org,
                slug: nanoid(),
            };

            const result = await FileModel.create(newFile);
            // console.log('FileModel created:', result);

            // Delete the local file after successful database creation
            try {
                fs.unlinkSync(filePath);
                console.log('Local file deleted:', filePath);
            } catch (deleteError) {
                console.error('Error deleting local file:', deleteError);
                // Don't fail the request if file deletion fails
            }

            // Return success response with file metadata
            const response = {
                success: true,
                file: { 
                    ...result._doc,
                    parsedData: parsedData // Include parsed data in response
                }
            };

            console.log('File uploaded and processed successfully');
            return res.json(response);

        } catch (error) {
            console.error('File upload error:', error);
            
            // Clean up local file if it exists and there was an error
            if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
                try {
                    fs.unlinkSync(uploadedFilePath);
                    console.log('Cleaned up local file after error:', uploadedFilePath);
                } catch (deleteError) {
                    console.error('Error deleting local file during cleanup:', deleteError);
                }
            }
            
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: 'File upload failed',
                    details: error.message
                });
            }
        }
    }
    
};

export default {
    ...FileController,
};
