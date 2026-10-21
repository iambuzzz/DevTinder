# DevTinder Scaled Version: Windows pe kaise chalayein

Windows pe `brew` nahi hota (wo sirf Mac/Linux ka hai). Isliye **Redis, Kafka aur Nginx Docker mein** chalenge, aur **3 Backend servers + Frontend normal terminals** mein.

```
Browser (5173) ──► Nginx :8080 (Docker) ──► Backend :3000 / :3001 / :3002 (PowerShell)
                                                   │
                                  Redis :6379 (Docker) + Kafka :9092 (Docker) + MongoDB Atlas
```

Saari commands **PowerShell** ke liye hain.

---

## Step 0: Ek baar ka setup

1. **Node.js 22 LTS** install karo: https://nodejs.org. Check: `node -v`
2. **Docker Desktop** install karo: https://www.docker.com/products/docker-desktop
   - Install ke time **WSL 2** option ON rakho. Restart maangega to restart karo.
   - Docker Desktop kholo aur neeche "Engine running" (green) hone tak ruko.
   - Check: `docker --version`
3. **nodemon** global install karo:
   ```powershell
   npm install -g nodemon
   ```
   Agar error aaye **"running scripts is disabled on this system"**, to ye chalao aur PowerShell band karke dobara kholo:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```
4. **MongoDB Atlas → Network Access** mein is laptop ka IP add karo.

**Code ka state:** folder already scaled version pe hai. `git checkout main` mat karna.

---

## Step 1: Redis + Kafka + Nginx start karo (Docker)

```powershell
cd DevTinder\windows-setup
docker compose up -d
```

Pehli baar images download hongi (2-5 min). Check:
```powershell
docker ps
```
Teen containers dikhne chahiye: `devtinder-redis`, `devtinder-kafka`, `devtinder-nginx`.

Redis check:
```powershell
docker exec -it devtinder-redis redis-cli ping      # PONG
```

## Step 2: Kafka topic 3 partitions ke saath banao (sirf ek baar)

Kafka start hone ke 15-20 sec baad:
```powershell
docker exec -it devtinder-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic chat-messages --partitions 3 --replication-factor 1
```
"Created topic chat-messages" aana chahiye. Ye kyun: teeno servers ek hi consumer group mein hain. 3 partitions honge tabhi teeno workers mein messages batenge.

## Step 3: Backend install

```powershell
cd DevTinder\Backend
npm install
```

## Step 4: 3 Backend servers, 3 alag PowerShell windows mein

Windows pe `HTTP_PORT=3000 npm run dev` wala syntax **nahi chalta**. PowerShell mein aise likho:

**Terminal 1:**
```powershell
cd DevTinder\Backend
$env:HTTP_PORT=3000; $env:GRPC_PORT=4000; npm run dev
```

**Terminal 2:**
```powershell
cd DevTinder\Backend
$env:HTTP_PORT=3001; $env:GRPC_PORT=4001; npm run dev
```

**Terminal 3:**
```powershell
cd DevTinder\Backend
$env:HTTP_PORT=3002; $env:GRPC_PORT=4002; npm run dev
```

Har terminal mein dikhna chahiye: `MongoDB connected`, `Redis Session Service connected`, `gRPC Server listening on port 400X`, `Kafka Producer connected`, `Kafka Chat Worker connected`.

> Command Prompt (cmd) use kar rahe ho to: `set HTTP_PORT=3000&& set GRPC_PORT=4000&& npm run dev`

Windows Firewall popup aaye ("Allow Node.js to communicate") to **Allow** karo.

## Step 5: Frontend

```powershell
cd DevTinder\Frontend
npm install
npm run dev
```
Browser mein **http://localhost:5173** kholo. Frontend already `localhost:8080` (Nginx) se baat karta hai, kuch change nahi karna.

## Step 6: Test

1. Do browsers kholo (Chrome + Chrome Incognito, ya Chrome + Edge), aur do alag users se login karo jo connected hain (request accepted).
2. Backend terminals mein `USER CONNECTED ... Server: HTTP:300X` dekho. Dono alag servers pe hone chahiye. Same pe aa gaye to ek browser refresh karo.
3. Message bhejo. Logs mein ye flow dikhega:
   - `[KAFKA] MESSAGE PRODUCED`: sender ke server pe.
   - `[KAFKA WORKER] Processing`: jis worker ko message mila.
   - `📥 gRPC RECEIVED: DeliverMessage`: receiver ke server pe.
4. Ek browser band karo. Logs mein `PRESENCE EVENT ... USER_OFFLINE` aayega, aur doosre user ka dot grey ho jaayega.
5. Online users dekhne ke liye: `docker exec -it devtinder-redis redis-cli keys "session:*"`

---

## Sab band karna

1. Har Backend/Frontend terminal mein **Ctrl + C**.
2. Docker band karo:
   ```powershell
   cd DevTinder\windows-setup
   docker compose down
   ```
3. Koi port atka reh gaya ho:
   ```powershell
   npx kill-port 3000 3001 3002 4000 4001 4002
   ```

Agli baar start karna ho to bas Step 1 (`docker compose up -d`), Step 4 aur Step 5. Topic dobara banane ki zaroorat nahi, jab tak `docker compose down -v` na kiya ho. `down -v` data bhi mita deta hai.

---

## Common problems

| Problem | Fix |
|---|---|
| `brew : The term 'brew' is not recognized` | Windows pe brew nahi hota, yahi Docker wala tarika use karo |
| `'HTTP_PORT' is not recognized` | PowerShell syntax use karo: `$env:HTTP_PORT=3000; ...` |
| `running scripts is disabled on this system` | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `nodemon : not recognized` | `npm install -g nodemon`, phir naya terminal kholo |
| `docker : not recognized` / `cannot connect to the Docker daemon` | Docker Desktop kholo aur "Engine running" hone tak ruko |
| `MongoServerSelectionError` / timeout | Atlas mein is laptop ka IP whitelist karo |
| `ECONNREFUSED 127.0.0.1:6379` | `docker ps` mein redis container chal raha hai? Nahi to `docker compose up -d` |
| `KafkaJSConnectionError` / `ECONNREFUSED :9092` | Kafka ko 20 sec do, phir backend terminal mein `rs` likh ke restart karo. Log dekhne ke liye: `docker logs devtinder-kafka` |
| `This server does not host this topic-partition` | Topic nahi bana. Step 2 chalao |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` | Koi aur 8080 use kar raha hai. Wo app band karo |
| Browser mein `502 Bad Gateway` (localhost:8080) | Backend servers abhi start nahi hue ya crash ho gaye. Teeno terminals check karo |
| `EADDRINUSE :3000` | `npx kill-port 3000` |
| `npm install` mein bcrypt error | `npm install` dobara chalao. Phir bhi aaye to Node 22 LTS (64-bit) confirm karo |
| Login ke baad turant logout | `http://localhost:5173` se hi kholo |

---

## Alternative: WSL (Linux on Windows)

Docker nahi chahiye to WSL mein Ubuntu install karo (`wsl --install`). Ubuntu terminal ke andar Mac jaise hi Linux commands chalti hain (`sudo apt install redis-server nginx`, Kafka download karke). Lekin ye lamba hai. Docker wala tarika aasaan hai.
