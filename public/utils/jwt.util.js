"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = __importDefault(require("../config/env.js"));
const SECRET_KEY = env_js_1.default.JWT_SECRET || "amit kumar";
const EXPIRES_IN = "180d"; // 6 months
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, SECRET_KEY || "", { expiresIn: EXPIRES_IN });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET_KEY || "");
    }
    catch (error) {
        return error;
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.util.js.map