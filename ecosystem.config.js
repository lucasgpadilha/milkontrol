module.exports = {
  apps: [
    {
      name: "milkontrol",
      script: "node_modules/.bin/next",
      args: "start --port 3005",
      cwd: "/home/opc/projects/milkontrol",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
