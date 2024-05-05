const jwt = require('jsonwebtoken');
const{ACCESS_TOKEN_SECRET,REFRESH_TOKEN_SECRET}= require('../config/index');
const RefreshToken = require('../models/token');
class JWTService{
    //sign access token
    static signAccessToken(payload , expiryTime){
        return jwt.sign(payload ,ACCESS_TOKEN_SECRET, {expiresIn: expiryTime});
    }
    //Sign Refresh Token
    static signRefreshToken(payload,expiryTime){
        return jwt.sign(payload ,REFRESH_TOKEN_SECRET, {expiresIn: expiryTime} );
    }
    //Verify  Access Token
    static verifyAccessToken(token){
        return jwt.verify(token, ACCESS_TOKEN_SECRET)
    }
    //Verify  Refresh Token
    static verifyRefreshToken(token){
        return jwt.verify(token, REFRESH_TOKEN_SECRET)
    }
    //Store  the refresh token in DB and send it to user
    static async storeRefreshToken(token , userId){
        try {
            const newToken = new RefreshToken({
                token: token,
                userId: userId
            });
            //store in DataBase
            await newToken.save();

        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = JWTService;