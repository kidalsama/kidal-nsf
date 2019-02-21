"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Application_1 = __importDefault(require("../application/Application"));
// banner
// noinspection TsLint
console.log(`
============================================================
                      _ooOoo_
                     o8888888o
                     88" . "88
                     (| -_- |)
                     O\\  =  /O
                  ____/\`---'\\____
                .'  \\\\|     |//  \`.
               /  \\\\|||  :  |||//  \\
              /  _||||| -:- |||||-  \\
              |   | \\\\\\  -  /// |   |
              | \\_|  ''\\---/''  |   |
              \\  .-\\__  \`-\`  ___/-. /
            ___\`. .'  /--.--\\  \`. . __
         ."" '<  \`.___\\_<|>_/___.'  >'"".
        | | :  \`- \\\`.;\`\\ _ /\`;.\`/ - \` : | |
        \\  \\ \`-.   \\_ __\\ /__ _/   .-\` /  /
   ======\`-.____\`-.___\\_____/___.-\`____.-'======
                      \`=---='
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 佛祖保佑       永无BUG
============================================================`);
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