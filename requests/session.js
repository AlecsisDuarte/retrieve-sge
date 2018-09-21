'use strict';
const axios = require('axios'),
    jsdom = require('jsdom'),
    {
        JSDOM
    } = jsdom,
    {
        ResponseMessage
    } = require('../models/response'),
    {
        SessionData
    } = require('../models/session'),
    Json = require('../utils/json'),
    routes = Json.load(__dirname, "./values/routes.json"),
    elements = Json.load(__dirname, './values/login/elements.json'),
    cookieNames = Json.load(__dirname, './values/login/cookies.json'),
    xsrfRegex = /XSRF-TOKEN=((\w|\%)+)/i,
    sgeRegex = /sgemexicali=((\w|\%)+)/i,
    colors = require('colors');

    /**
     * Obtiene la información de la sesión como cookies y tokens 
     * @returns {SessionData} Información de la sesión
     */
exports.sessionInitializer = async () => {
    console.log(colors.yellow(' Getting Session Information'));
    let request = axios.create({
        baseURL: routes.baseURL,
        withCredentials: true
    });
    try {
        console.log(colors.gray(' - Requesting login page'));
        const alumnoRes = await request.get(routes.studentLogin);
        if (alumnoRes.status === 200) {
            const alumnoDOM = new JSDOM(alumnoRes.data);
            console.log(colors.gray(' - Getting the token'));
            const token = alumnoDOM.window.document.querySelector(`input[name='${elements.token}']`);
            if (token) {
                const xsrfToken = xsrfRegex.exec(alumnoRes.headers['set-cookie'][0])[1];
                const sgeToken = sgeRegex.exec(alumnoRes.headers['set-cookie'][1])[1];
                console.log(colors.gray(' - Searching for cookies'));
                const cookies = `${cookieNames.XSRF_TOKEN}=${xsrfToken};${cookieNames.SGE_TOKEN}=${sgeToken}`;
                if (cookies) {
                    return new SessionData(token.value, cookies);
                } else {
                    return new SessionData(token.value, null, 400);
                }
            } else {
                return new SessionData(null, null, 400);
            }
        } else {
            return new SessionData(null, null, 400);
        }
    } catch (error) {
        return error;
    }
}