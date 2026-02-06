"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadCustom = exports.Upload = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
/**
 * 🔹 CENTRALIZED BYTE CONVERTER
 */
const toBytes = (size, unit) => {
    if (unit === "kb")
        return size * 1024;
    if (unit === "mb")
        return size * 1024 * 1024;
    throw new Error("Invalid unit. Use 'kb' or 'mb'");
};
/**
 * 🔹 CENTRALIZED MULTER CREATOR
 */
const createUpload = (size = 2, unit = "mb") => (0, multer_1.default)({
    storage,
    limits: {
        fileSize: toBytes(size, unit),
    },
    fileFilter: (_, file, cb) => {
        allowedMimeTypes.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
    },
});
/**
 * ✅ DEFAULT EXPORT (DOES NOT BREAK ANYTHING)
 * Existing code keeps working → 2MB
 */
exports.Upload = createUpload();
/**
 * ✅ SAME SYSTEM, CUSTOM SIZE
 */
const UploadCustom = (size, unit) => createUpload(size, unit);
exports.UploadCustom = UploadCustom;
//# sourceMappingURL=multer.middleware.js.map