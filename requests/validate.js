'use strict';
const axios = require('axios'),
    Json = require('../utils/json'),
    queryString = require('querystring'),
    {
        ResponseMessage
    } = require('../models/response'),
    routes = Json.load(__dirname, "./values/routes.json"),
    elements = Json.load(__dirname, './values/login/elements.json'),
    responses = Json.load(__dirname, './values/login/responses.json'),
    colors = require('colors'),
    sessionReq = require('./session');

/** @member {SessionData} sessionData Información de la session */
let sessionData = null;

/** 
 * Valida si el numero de control existe 
 * @param {Number} controlNumber Número de control 
 * @returns {Promise<ResponseMessage>} Respuesta
 */
exports.validateControlNumber = async controlNumber => {

    if (sessionData === null) {
        sessionData = await sessionReq.sessionInitializer();
        if (sessionData.status) {
            if (sessionData.status === 200) {
                return this.validateControlNumber(controlNumber);
            } else if (!sessionData.token) {
                return new ResponseMessage("Token not found", 400, "Error at retrieving a new token");
            } else {
                return new ResponseMessage("Cookies not found", 400, "Error at retrieving new cookies");
            }
        } else {
            return new ResponseMessage("Error at retrieving session data", 400, sessionData);
        }
    } else {
        let request = axios.create({
            baseURL: routes.baseURL,
            withCredentials: true
        });
        request.defaults.headers.post.Cookie = sessionData.cookies;
        try {
            console.log(colors.yellow(' Validating Control Number'));
            const response = await request.post(routes.authorizeStudent,
                queryString.stringify({
                    [elements.controlNumber]: controlNumber,
                    [elements.password]: '0000000',
                    [elements.token]: sessionData.token
                }));
            if (response.data.includes(responses.INVALID_CONTROL_NUMBER)) {
                return new ResponseMessage('Invalid Control Number', 400);
            } else {
                return new ResponseMessage('Valid Control Number');
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 500 && error.response.data.includes(responses.SYSTEM_ERROR)) {
                    console.log(colors.yellow('Invalid Cookies'));
                    sessionData = null;
                    return this.validateControlNumber(controlNumber);
                } else {
                    return new ResponseMessage(error.message, error.response.status, error.stack);
                }
            } else {
                return new ResponseMessage(error.message, 500, error.stack);
            }
        }
    }
};