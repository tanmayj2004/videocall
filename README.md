# Zenwora Realtime Chat + Video Call

This project is a full-stack starter for:

- user registration and login
- one-to-one chat between logged-in users
- one-to-one video calling with WebRTC
- realtime updates with Socket.IO

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Storage: in-memory sample data for testing
- Realtime: Socket.IO
- Auth: JWT
- Video: WebRTC for peer-to-peer media, Socket.IO for signaling

## Project Structure

```text
Zenwora/
  backend/
  frontend/
```

## 1. Install dependencies

Open two terminals.

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## 2. Create environment file

Create `backend/.env`

```env
PORT=5000
JWT_SECRET=change_this_secret
CLIENT_URL=http://localhost:3000
```

## 3. Run the app

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## 4. Open the app

Open:

```text
http://localhost:3000
```

Use the sample users below in two browser windows or two devices.

## Sample login users

- `aarav@example.com` / `password123`
- `priya@example.com` / `password123`
- `rahul@example.com` / `password123`

## How it works

### Chat flow

1. User logs in and gets a JWT token.
2. Frontend connects to Socket.IO with that token.
3. Users can select another logged-in user and send messages.
4. Messages are stored in the server memory and emitted in realtime.

### Video call flow

1. Caller clicks `Start call`.
2. Frontend gets local media with `getUserMedia`.
3. Offer, answer, and ICE candidates are exchanged through Socket.IO.
4. Media flows directly between browsers through WebRTC.

## What you need to do next

- install Node.js locally if not installed
- create the `backend/.env` file
- run both apps
- login with two sample users and test chat/call

## Important production notes

- add TURN servers for reliable calls across networks
- use HTTPS in production
- set `CLIENT_URL` in `backend/.env` or your Render environment to your deployed frontend URL, for example `https://videocall-tau-eight.vercel.app`
- replace in-memory storage with a real database before production
- validate and rate-limit APIs
- add message read status, presence, and notifications
