"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(require("../application/Application"));
// run
(async () => {
    try {
        await Application_1.default.run();
    }
    catch (e) {
        // noinspection TsLint
        console.error(e);
        process.exit(1);
    }
})();
//# sourceMappingURL=Bootstrap.js.map