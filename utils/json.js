'use strict';
const fs = require('fs'),
    path = require('path');

/** 
 * Searches for the JSON file
 * @param {String} route Ruta del archivo
 * @returns {object} Archivo
 */
exports.load = (dir, route) => {
    const FILE_PATH = path.resolve(dir, route);
    if (fs.existsSync(FILE_PATH)) {
        return JSON.parse(fs.readFileSync(FILE_PATH));
    } else {
        return null;
    }
}