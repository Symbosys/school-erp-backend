"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResultsSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Generating Results
 */
exports.generateResultsSchema = zod_1.z.object({
    examId: zod_1.z.string().uuid("Invalid exam ID"),
});
//# sourceMappingURL=result.validation.js.map