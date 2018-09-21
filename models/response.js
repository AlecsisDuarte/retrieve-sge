exports.ResponseMessage = class {
    constructor(message, status = 200, error = null) {
        this.status = status;
        this.message = message;
        this.error = error;
    }

    getMessage() {
        return `${this.status} - ${this.message}`;
    }
}