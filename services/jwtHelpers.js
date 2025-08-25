import jsonwebtoken from 'jsonwebtoken';
import properties from '../properties.js';

export const signToken = (payload) => {
  return jsonwebtoken.sign(payload, properties.TOKEN_SECRET, { 
    expiresIn: properties.TOKEN_EXPIRATION_TIME 
  });
};

export const verifyToken = (token) => {
  return jsonwebtoken.verify(token, properties.TOKEN_SECRET);
};