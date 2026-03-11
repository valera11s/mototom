module.exports = {
  apps: [
    {
      name: 'mototom-api',
      script: 'server/index.js',
      cwd: '/var/www/mototom-clean',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      time: true,
      error_file: '/var/log/mototom/api-error.log',
      out_file: '/var/log/mototom/api-out.log',
      merge_logs: true,
    },
  ],
};
