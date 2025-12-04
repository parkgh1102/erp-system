module.exports = {
  apps: [{
    name: 'erp-backend',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3001
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
