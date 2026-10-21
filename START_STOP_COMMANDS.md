# DevTinder Command Guide (Scaled Monolith)

## 💻 Local Development (Mac)

### Start
```bash
# 1. Redis + Kafka
brew services start redis
brew services start kafka

# 2. Nginx load balancer on :8080
nginx -c /Users/iambuzz/CODING/Projects/DevTinder/Backend/nginx.conf

# 3. Backend: 3 instances (one terminal each)
cd /Users/iambuzz/CODING/Projects/DevTinder/Backend
HTTP_PORT=3000 GRPC_PORT=4000 npm run dev
HTTP_PORT=3001 GRPC_PORT=4001 npm run dev
HTTP_PORT=3002 GRPC_PORT=4002 npm run dev

# 4. Frontend → http://localhost:5173
cd /Users/iambuzz/CODING/Projects/DevTinder/Frontend
npm run dev
```
Backend runs with `nodemon`, so type `rs` in a terminal to restart that instance. `.env` changes need a restart.

### Stop
```bash
lsof -ti :3000,3001,3002,4000,4001,4002,5173 | xargs kill
nginx -s stop
brew services stop kafka redis
```

---

## ☁️ Production (AWS EC2, t3.micro)

### Connect
```bash
cd ~/Downloads
ssh -i "DevTinder-Mumbai.pem" ubuntu@13.127.85.130
```

### Layout
| What | Where |
| :--- | :--- |
| Code | `~/DevTinder-scaled` (branch `feature/scaled-monolith`) |
| Backend env | `~/DevTinder-scaled/Backend/.env.production` |
| Frontend (served by Nginx) | `/var/www/html` |
| Nginx config | `/etc/nginx/sites-available/default` (upstream → :3000, :3001) |
| PM2 apps | `devtinder-1` (3000/4000), `devtinder-2` (3001/4001) |
| Kafka | `/opt/kafka`, data in `~/kafka-data`, systemd service `kafka` |

Everything (Nginx, Redis, Kafka, PM2) starts automatically on reboot.

### Health check
```bash
pm2 list
systemctl is-active nginx redis-server kafka
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/profile   # 401 = OK
free -h
```

### Logs
```bash
pm2 logs                       # live logs of both instances (Ctrl+C to exit)
pm2 logs devtinder-1 --lines 100
sudo journalctl -u kafka -n 50
sudo tail -n 50 /var/log/nginx/error.log
```

### Deploy a new version
```bash
cd ~/DevTinder-scaled && git pull

# Backend changed
cd Backend && npm ci --omit=dev && pm2 restart devtinder-1 devtinder-2

# Frontend changed
cd ~/DevTinder-scaled/Frontend && npm ci && npm run build && rm -rf node_modules
sudo rm -rf /var/www/html/* && sudo cp -r dist/* /var/www/html/
```

### Restart / stop
```bash
pm2 restart devtinder-1 devtinder-2   # after editing .env.production
pm2 stop devtinder-1 devtinder-2      # take backend down
sudo systemctl restart kafka          # Kafka
sudo systemctl reload nginx           # after editing Nginx config (run `sudo nginx -t` first)
```

### OS updates
```bash
sudo apt-get update && sudo apt-get upgrade -y
[ -f /var/run/reboot-required ] && sudo reboot   # services come back on their own
```
