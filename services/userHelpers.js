import OrganizationModel from "../models/OrganizationModel";
import properties from "../properties";
import jsonwebtoken from "jsonwebtoken";

export const emailre = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+.)+[^<>()[\].,;:\s@"]{2,})$/i;
export const phonere = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/i;
export const intlphonere = /^\+(?:[0-9] ?){6,14}[0-9]$/;

export async function getUserWithToken(user) {
    // Create token
    let response = { ...user };
    const orgs = await OrganizationModel.findByUser(response._id);
    response.organization = orgs[0];
    //
    response.password = undefined;
    
    console.log('=== TOKEN CREATION DEBUG ===');
    console.log('Original user object:', user);
    console.log('User roles:', user.roles);
    console.log('Response object being signed:', response);
    console.log('Response roles:', response.roles);
    console.log('Signing token with secret:', properties.TOKEN_SECRET);
    console.log('Token expiration:', properties.TOKEN_EXPIRATION_TIME);
    
    response.token = jsonwebtoken.sign(response, properties.TOKEN_SECRET, {
        expiresIn: properties.TOKEN_EXPIRATION_TIME,
    });

    return response;
}
