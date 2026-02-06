"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoticeSchema = exports.createNoticeSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Creating Notice
 * Handles FormData inputs where booleans/JSON might be strings
 */
exports.createNoticeSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid School ID"),
    title: zod_1.z.string().min(1, "Title is required").max(255, "Title is too long"),
    content: zod_1.z.string().min(1, "Content is required"),
    type: zod_1.z.enum(["GENERAL", "EVENT", "HOLIDAY", "EXAM", "EMERGENCY"]).default("GENERAL"),
    priority: zod_1.z.enum(["NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    // Preprocess to handle string "true"/"false" from FormData
    forStudents: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().default(false)),
    forParents: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().default(false)),
    forTeachers: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().default(false)),
    // Handle stringified JSON for targetClassIds
    targetClassIds: zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return [];
            }
        }
        return val;
    }, zod_1.z.array(zod_1.z.string()).optional()),
    postedBy: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Updating Notice
 */
exports.updateNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().max(255).optional(),
    content: zod_1.z.string().optional(),
    type: zod_1.z.enum(["GENERAL", "EVENT", "HOLIDAY", "EXAM", "EMERGENCY"]).optional(),
    priority: zod_1.z.enum(["NORMAL", "HIGH", "URGENT"]).optional(),
    forStudents: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().optional()),
    forParents: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().optional()),
    forTeachers: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().optional()),
    targetClassIds: zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return undefined;
            }
        }
        return val;
    }, zod_1.z.array(zod_1.z.string()).optional()),
    isActive: zod_1.z.preprocess((val) => val === 'true' || val === true, zod_1.z.boolean().optional()),
});
//# sourceMappingURL=notice.validation.js.map