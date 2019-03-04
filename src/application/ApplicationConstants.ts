export const applicationBanner = `
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
============================================================`

export const log4jsConfig = {
  appenders: {
    console: {
      type: "console",
      level: "trace",
      maxLevel: "error",
      layout: {
        type: "pattern",
        pattern: "%d{yyyy-MM-dd hh:mm:ss.SSS} %[%5p%] --- [%8z] %m --- %[%c%]",
      },
    },
  },
  categories: {
    default: {
      appenders: [
        "console",
      ],
      level: "all",
    },
  },
}