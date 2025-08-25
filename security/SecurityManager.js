// Dependencies
import jsonwebtoken from "jsonwebtoken";
import cors from "cors";
import helmet from "helmet";
// Properties
import Properties from "../properties";
// Errors
import ErrorManager from "../classes/ErrorManager";
import Errors from "../classes/Errors";
import UserModel from "../models/UserModel";

/**
 * Middleware JWT
 * @param {string, array} roles Authorized role, null for all
 */
export const authorize = (roles = []) => {
    // Roles param can be a single role string (e.g. Role.User or 'User')
    // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
    if (typeof roles === "string") {
        roles = [roles];
    }

    return [
        // Authenticate JWT token and attach user to request object (req.user)
        async (req, res, next) => {
            let token =
                req.headers.authorization &&
                req.headers.authorization.replace("Bearer ", "");

           
            if (!token) {
                const safeErr = ErrorManager.getSafeError(
                    new Errors.INVALID_AUTH_HEADER()
                );
                res.status(safeErr.status).json(safeErr);
            } else {
                let decodedUser = null;

                try {
                    console.log('TOKEN_SECRET:', Properties.TOKEN_SECRET);
                    console.log('Current time:', Math.floor(Date.now() / 1000));
                    
                    // Decode the token without verification first to see the payload
                    const decodedWithoutVerification = jsonwebtoken.decode(token);
                    console.log('Token payload (without verification):', decodedWithoutVerification);
                    
                    decodedUser = jsonwebtoken.verify(
                        token,
                        Properties.TOKEN_SECRET
                    );
                    console.log('decodedUser:', decodedUser);
                    
                    // Check if user has required roles
                    if (decodedUser && hasRole(roles, decodedUser)) {
                        req.user = decodedUser;
                        next();
                    } else {
                        const safeErr = ErrorManager.getSafeError(
                            new Errors.UNAUTHORIZED()
                        );
                        return res.status(safeErr.status).json(safeErr);
                    }
                   
                } catch (err) {
                    console.log('JWT verification error:', err.message);
                    console.log('Error name:', err.name);
                    console.log('Full error object:', err);
                    
                    // Handle all JWT errors with a normalized response
                    return res.status(401).json({
                        error: 'invalid token',
                        message: 'Token verification failed',
                        status: 401
                    });
                }
            }
        },
    ];
};

export const initSecurity = (app) => {
    app.use(helmet());
    app.use(cors());
};

// ---------------- UTILS FUNCTIONS ---------------- //

/**
 * Check if user has role (case-insensitive)
 * @param {*} roles String or array of roles to check
 * @param {*} user Current logged user
 */
var hasRole = function (roles, user) {
    console.log('=== ROLE CHECK DEBUG ===');
    console.log('Required roles:', roles);
    console.log('User object:', user);
    console.log('User roles:', user.roles);
    
    // If no roles required, allow access
    if (roles == undefined || roles.length == 0) {
        console.log('No roles required - allowing access');
        return true;
    }
    
    // If user not defined, deny access
    if (!user) {
        console.log('No user - denying access');
        return false;
    }
    
    // Ensure user.roles exists and is an array
    const userRoles = user.roles && Array.isArray(user.roles) ? user.roles : [];
    console.log('Processed user roles:', userRoles);
    
    // Convert roles to lowercase for case-insensitive comparison
    const requiredRoles = roles.map(role => role.toLowerCase());
    const userRolesLower = userRoles.map(role => role.toLowerCase());
    console.log('Required roles (lowercase):', requiredRoles);
    console.log('User roles (lowercase):', userRolesLower);
    
    // SUPERADMIN bypass - always allow access
    if (userRolesLower.includes('superadmin')) {
        console.log('Superadmin access granted - bypassing all checks');
        return true;
    }
    
    // Check for PUBLIC access
    if (requiredRoles.includes('public')) {
        console.log('Public access granted');
        return true;
    }
    
    // Check for ADMIN access (case-insensitive)
    if (userRolesLower.includes('admin')) {
        console.log('Admin access granted');
        return true;
    }
    
    // Check if user has any of the required roles
    for (let requiredRole of requiredRoles) {
        for (let userRole of userRolesLower) {
            if (requiredRole === userRole) {
                console.log(`Role match found: ${requiredRole}`);
                return true;
            }
        }
    }
    
    console.log('No role match - access denied');
    return false;
};

/**
 * Find value in array
 * @param {*} array1
 * @param {*} array2
 */
var findOne = function (array1, array2) {
    for (var i in array1) {
        for (var j in array2) {
            if (array1[i] == array2[j]) return true;
        }
    }

    return false;
};
