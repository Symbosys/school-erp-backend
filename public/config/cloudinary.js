"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = exports.deleteFromCloudinary = exports.uploadMultipleToCloudinary = exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const env_1 = __importDefault(require("./env"));
// Validate required environment variables
if (!env_1.default.cloud_name || !env_1.default.cloud_api_key || !env_1.default.cloud_api_secret) {
    throw new Error("Missing required Cloudinary environment variables: CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET");
}
cloudinary_1.v2.config({
    cloud_name: env_1.default.cloud_name,
    api_key: env_1.default.cloud_api_key,
    api_secret: env_1.default.cloud_api_secret,
});
exports.default = cloudinary_1.v2;
// Single file upload function
const uploadToCloudinary = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder }, (error, result) => {
            if (error) {
                return reject(new Error("Failed to upload image to Cloudinary: " + error.message));
            }
            if (!result?.secure_url || !result.public_id) {
                return reject(new Error("Failed to retrieve public_id or URL from Cloudinary response"));
            }
            resolve({
                public_id: result.public_id,
                secure_url: result.secure_url,
            });
        });
        const stream = stream_1.Readable.from(fileBuffer);
        stream.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
// Multi-file upload function
const uploadMultipleToCloudinary = async (fileBuffers, folder) => {
    return Promise.all(fileBuffers.map((buffer) => (0, exports.uploadToCloudinary)(buffer, folder)));
};
exports.uploadMultipleToCloudinary = uploadMultipleToCloudinary;
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary_1.v2.uploader.destroy(publicId);
    }
    catch (error) {
        throw new Error(`Failed to delete image with public_id ${publicId} from Cloudinary`);
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
const extractPublicId = (url) => {
    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
        const match = url.match(regex);
        return (match && match[1]) || null;
    }
    catch (error) {
        return null;
    }
};
exports.extractPublicId = extractPublicId;
//# sourceMappingURL=cloudinary.js.map