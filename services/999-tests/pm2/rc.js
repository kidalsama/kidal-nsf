module.exports = {
  apps: [{
    name: 'game-server-foundation-tests',
    script: '.',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: 'rc,foundation:dev 999-tests',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '100M'
  }]
};
