"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(require("../application/Application"));
// run
exports.default = (async () => {
    try {
        await Application_1.default.run(process.argv);
    }
    catch (e) {
        // noinspection TsLint
        console.error(e);
        process.exit(1);
    }
    return Application_1.default.S;
})();
//# sourceMappingURL=Bootstrap.js.map