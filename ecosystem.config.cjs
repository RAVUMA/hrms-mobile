module.exports = {
  apps: [
    {
      name: 'hj-mobile',
      script: 'npx',
      args: 'vite preview --port 5372 --host --strictPort',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
