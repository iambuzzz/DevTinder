# DevTinder: Scaled version locally kaise chalayein

Scaled version mein ek hi `Backend` code ke **3 copies** chalti hain. Unke saath **Nginx** (load balancer), **Redis** (sessions + presence), **Kafka** (messages) aur **Frontend** chahiye.

```
Browser (5173) ──► Nginx :8080 ──► Backend :3000 / :3001 / :3002   (gRPC :4000 / :4001 / :4002)
                                        │
                              Redis :6379 + Kafka :9092 + MongoDB Atlas
```

## Step 0: Ek baar ka setup (naye laptop pe)

```bash
brew install redis kafka nginx
npm install -g nodemon        # Backend ka "npm run dev" isi pe chalta hai
```

Naye laptop pe **MongoDB Atlas → Network Access** mein us laptop ka IP add karna mat bhoolna.

**Code ka state:** ye folder already scaled version pe hai, branch `feature/true-microservices`. Uska `Backend/` folder hi scaled monolith hai, to `git checkout main` mat karna. Committed scaled version branch `feature/scaled-monolith` pe bhi hai. Dono mein farak sirf 2 CORS lines ka hai.

## Step 1: Redis aur Kafka start karo

```bash
brew services start redis
brew services start kafka
```

Check karo, 10-20 second rukne ke baad:

```bash
redis-cli ping                                          # PONG aana chahiye
kafka-topics --bootstrap-server localhost:9092 --list   # error nahi aana chahiye
```

## Step 2: Kafka topic 3 partitions ke saath banao (sirf ek baar)

```bash
kafka-topics --bootstrap-server localhost:9092 --create \
  --topic chat-messages --partitions 3 --replication-factor 1
```

Ye kyun: teeno servers ek hi consumer group (`chat-worker-group`) mein hain. Agar Kafka khud topic banaye to sirf **1 partition** banta hai, aur tab teeno mein se **sirf ek** worker kaam karega. App phir bhi chalega, lekin load teeno mein nahi batega. 3 partitions dene se teeno workers mein kaam baant jaata hai.

## Step 3: Backend install aur Nginx start

```bash
cd DevTinder/Backend
npm install
nginx -t -c "$(pwd)/nginx.conf"     # config check: "syntax is ok"
nginx -c "$(pwd)/nginx.conf"        # Nginx :8080 pe chalu
```

`nginx -c` ko **poora path** chahiye, isliye `$(pwd)` lagaya hai. Ye command `Backend` folder ke andar se hi chalana.

## Step 4: 3 Backend servers, 3 alag terminals mein

Teeno `DevTinder/Backend` folder se:

```bash
HTTP_PORT=3000 GRPC_PORT=4000 npm run dev    # Terminal 1
HTTP_PORT=3001 GRPC_PORT=4001 npm run dev    # Terminal 2
HTTP_PORT=3002 GRPC_PORT=4002 npm run dev    # Terminal 3
```

Har terminal mein ye lines dikhni chahiye: `MongoDB connected`, `Redis Session Service connected`, `gRPC Server listening on port 400X`, `Kafka Producer connected`, `Kafka Chat Worker connected`.

## Step 5: Frontend

```bash
cd DevTinder/Frontend
npm install
npm run dev        # http://localhost:5173
```

Frontend ki API aur socket already `localhost:8080` (Nginx) pe point karte hain (`Frontend/src/utils/constants.js`), to kuch change nahi karna.

## Step 6: Test karo ki cross-server chat chal raha hai

1. Do alag browsers kholo, jaise Chrome aur Chrome Incognito, ya Chrome aur Safari. Dono mein **do alag users** se login karo. Dono users connected hone chahiye, yaani request accept ho chuki ho.
2. Backend terminals mein `USER CONNECTED ... Server: HTTP:300X` dekho. Dono users **alag servers** pe hone chahiye. Same server pe aa gaye to ek browser refresh karo, `least_conn` usse doosre server pe bhej dega.
3. Ek user se message bhejo. Logs mein ye flow dikhega:
   - `[KAFKA] MESSAGE PRODUCED`: sender ke server pe.
   - `[KAFKA WORKER] Processing message`: jis bhi worker ko message mila.
   - `📥 gRPC RECEIVED: DeliverMessage`: receiver ke server pe.
4. Presence check karne ke liye ek browser band karo. Logs mein `[REDIS PUB/SUB] PRESENCE EVENT: ... USER_OFFLINE` aayega, aur doosre user ki screen pe dot grey ho jaayega.
5. Redis mein online users dekhne ke liye: `redis-cli keys "session:*"`

Interview mein demo dikhana ho to yahi flow sabse achha hai.

## Sab band karna

```bash
lsof -ti :3000,3001,3002,4000,4001,4002 | xargs kill -9
nginx -s stop
brew services stop kafka
brew services stop redis
```

## Common problems

| Problem | Fix |
|---|---|
| `nodemon: command not found` | `npm install -g nodemon` |
| `MongoServerSelectionError` / timeout | Atlas mein laptop ka IP whitelist karo |
| `ECONNREFUSED 127.0.0.1:6379` | `brew services start redis` |
| `KafkaJSConnectionError` / `ECONNREFUSED :9092` | Kafka start hone mein time leta hai, 20 sec ruko aur server restart karo (terminal mein `rs`). Phir bhi na chale to log dekho: `$(brew --prefix)/var/log/kafka/` |
| `This server does not host this topic-partition` (shuru mein) | Topic nahi bana tha. Step 2 chalao |
| `bind() to 0.0.0.0:8080 failed` | Nginx pehle se chal raha hai: `nginx -s stop`, phir dobara start |
| `EADDRINUSE :3000` | Purana process chal raha hai: upar wala `lsof ... kill` |
| Message jaata hai lekin doosre ko nahi milta | Dono users connected (request accepted) hain? Worker logs mein `gRPC DeliverMessage ... failed` dekho |
| Login ke baad turant logout | Frontend `http://localhost:5173` se hi kholo, kyunki CORS whitelist mein yahi hai |
