
/**Needed information to make a login request */
exports.SessionData = class {
    /**
     * Create a session data instance
     * @param {String} token Session token
     * @param {String} cookies SGE and XSRF Tokens
     */
    constructor(token, cookies, status = 200) {
        this.token = token;
        this.cookies = cookies;
        this.status = status;
    }
};

