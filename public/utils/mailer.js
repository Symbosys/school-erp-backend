"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = __importDefault(require("../config/env.js"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: env_js_1.default.USER_EMAIL,
        pass: env_js_1.default.EMAIL_APP_PASSWORD
    }
});
async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: env_js_1.default.USER_EMAIL,
        to,
        subject,
        text
    };
    await transporter.sendMail(mailOptions);
}
//# sourceMappingURL=mailer.js.map