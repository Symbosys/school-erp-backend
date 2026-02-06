"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateOtp = () => {
    const otp = crypto_1.default.randomInt(1000, 10000).toString();
    return otp;
};
exports.generateOtp = generateOtp;
//# sourceMappingURL=otp.js.map