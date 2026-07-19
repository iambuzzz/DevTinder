# DevTinder Microservices Command Guide

This project has been scaled into a distributed microservices architecture. Below are the exact commands you need to start and stop all parts of the system.

## 🛑 How to STOP Everything Completely

Run these commands in your terminal to completely shut down the system:

```bash
# 1. Kill any running backend node servers on ports 3000-3002 and gRPC ports 4000-4002
lsof -ti :3000,3001,3002,4000,4001,4002 | xargs kill -9

# 2. Stop Nginx Load Balancer
nginx -s stop

# 3. Stop Redis
brew services stop redis

# 4. Stop Kafka
brew services stop kafka
```

---

## 🚀 How to START Everything (Step-by-Step)

### Step 1: Start Background Databases & Message Brokers
Open a terminal in any directory and run:
```bash
# Start Redis (Used for session storage and Pub/Sub)
brew services start redis

# Start Kafka (Used for durable chat message queues)
brew services start kafka
```

### Step 2: Start the Nginx Load Balancer
Open a terminal, go to the Backend folder, and start Nginx:
```bash
cd /Users/iambuzz/CODING/Projects/DevTinder/Backend
nginx -c /Users/iambuzz/CODING/Projects/DevTinder/Backend/nginx.conf
```

### Step 3: Start the Backend Microservices (Open 3 separate terminals)
You need to run 3 instances of the backend to test the load balancer and distributed system.

**Terminal 1:**
```bash
cd /Users/iambuzz/CODING/Projects/DevTinder/Backend
HTTP_PORT=3000 GRPC_PORT=4000 npm run dev
```

**Terminal 2:**
```bash
cd /Users/iambuzz/CODING/Projects/DevTinder/Backend
HTTP_PORT=3001 GRPC_PORT=4001 npm run dev
```

**Terminal 3:**
```bash
cd /Users/iambuzz/CODING/Projects/DevTinder/Backend
HTTP_PORT=3002 GRPC_PORT=4002 npm run dev
```

### Step 4: Start the Frontend
Open a new terminal, go to the Frontend folder, and run:
```bash
cd /Users/iambuzz/CODING/Projects/DevTinder/Frontend
npm run dev
```

---

**Note:** The backend servers are now running using `nodemon` behind the scenes, so you can easily type `rs` in their respective terminals to restart them individually without shutting everything down!
