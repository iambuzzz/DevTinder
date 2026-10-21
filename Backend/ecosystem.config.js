// PM2 config: EC2 (t3.micro, 1GB RAM) par 2 instances, Nginx inke beech load balance karta hai
//   pm2 start ecosystem.config.js && pm2 save
const INSTANCES = 2;

module.exports = {
  apps: Array.from({ length: INSTANCES }, (_, i) => ({
    name: `devtinder-${i + 1}`,
    cwd: __dirname,
    script: "src/app.js",
    env: {
      NODE_ENV: "production",
      HTTP_PORT: 3000 + i,
      GRPC_PORT: 4000 + i,
    },
    max_memory_restart: "250M",
  })),
};
