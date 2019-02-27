"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author tengda
 */
class LudmilaError extends Error {
    /**
     *
     */
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.default = LudmilaError;
//# sourceMappingURL=LudmilaError.js.map