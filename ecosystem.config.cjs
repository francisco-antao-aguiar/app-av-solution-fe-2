module.exports = {
  apps: [
    {
      name: 'angular-hours-tracker',
      script: 'npx',
      args: 'ng serve --host 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true
    }
  ]
}
