"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCode = void 0;
var statusCode;
(function (statusCode) {
    // status code start with 200
    statusCode[statusCode["OK"] = 200] = "OK";
    statusCode[statusCode["Created"] = 201] = "Created";
    statusCode[statusCode["No_Content"] = 204] = "No_Content";
    // status code start with 400
    statusCode[statusCode["Bad_Request"] = 400] = "Bad_Request";
    statusCode[statusCode["Unauthorized"] = 401] = "Unauthorized";
    statusCode[statusCode["Payment_Required"] = 402] = "Payment_Required";
    statusCode[statusCode["Forbidden"] = 403] = "Forbidden";
    statusCode[statusCode["Not_Found"] = 404] = "Not_Found";
    statusCode[statusCode["Conflict"] = 409] = "Conflict";
    statusCode[statusCode["Too_Many_Requests"] = 429] = "Too_Many_Requests";
    // status code start with 500
    statusCode[statusCode["Internal_Server_Error"] = 500] = "Internal_Server_Error";
})(statusCode || (exports.statusCode = statusCode = {}));
//# sourceMappingURL=types.js.map