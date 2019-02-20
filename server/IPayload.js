"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = 1;
/**
 * @author tengda
 */
exports.payloadToText = (payload) => {
    return JSON.stringify(payload);
};
/**
 * @author tengda
 */
exports.textToPayload = (text) => {
    return JSON.parse(text);
};
/**
 * @author tengda
 */
exports.copyPayload = (payload, data) => {
    return {
        version: exports.VERSION,
        id: payload.id,
        type: payload.type,
        data,
    };
};
//# sourceMappingURL=IPayload.js.map