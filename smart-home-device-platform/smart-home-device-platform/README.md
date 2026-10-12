# Smart Home Device Management Platform

Solution for **Round 2: Low-Level Design (30 marks)** and **Round 3: High-Level System Design (25 marks)**.

This reference implementation provides REST APIs for registering devices, checking status, sending commands, viewing activity, updating device status/heartbeat, and removing devices. It uses Node.js, Express, and MongoDB.

## 1. Requirements
- Node.js 18 or later
- MongoDB running locally or a MongoDB connection string

## 2. Run the project
```bash
npm install
cp .env.example .env
# Edit .env if your MongoDB connection string differs
npm start
```
The API runs at `http://localhost:3000`. Health check: `GET /health`.

## 3. REST API reference
Base URL: `/api/v1/devices`

| Task | Method | URI | Success | Typical errors |
|---|---|---|---|---|
| Register device | POST | `/api/v1/devices` | 201 Created | 400 invalid body |
| List devices | GET | `/api/v1/devices` | 200 OK | 500 server error |
| Get device status | GET | `/api/v1/devices/{id}/status` | 200 OK | 400 invalid ID, 404 missing device |
| Control device | POST | `/api/v1/devices/{id}/commands` | 202 Accepted | 400 invalid command, 404 missing device, 409 offline device |
| Get device activity | GET | `/api/v1/devices/{id}/activity?limit=50` | 200 OK | 400 invalid ID, 404 missing device |
| Update status/heartbeat | PATCH | `/api/v1/devices/{id}/status` | 200 OK | 400 invalid status, 404 missing device |
| Remove device | DELETE | `/api/v1/devices/{id}` | 200 OK | 400 invalid ID, 404 missing device |

### Example requests
Register a device:
```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H 'Content-Type: application/json' \
  -d '{"name":"Living Room Light","type":"light","room":"Living Room"}'
```

Mark it online (replace `DEVICE_ID` with the returned ID):
```bash
curl -X PATCH http://localhost:3000/api/v1/devices/DEVICE_ID/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"online","state":{"power":"off","brightness":50}}'
```

Send a command:
```bash
curl -X POST http://localhost:3000/api/v1/devices/DEVICE_ID/commands \
  -H 'Content-Type: application/json' \
  -d '{"command":"turn_on"}'
```

Get status/activity or remove the device:
```bash
curl http://localhost:3000/api/v1/devices/DEVICE_ID/status
curl 'http://localhost:3000/api/v1/devices/DEVICE_ID/activity?limit=20'
curl -X DELETE http://localhost:3000/api/v1/devices/DEVICE_ID
```

Allowed device types: `light`, `thermostat`, `fan`, `lock`, `sensor`, `other`.
Allowed commands: `turn_on`, `turn_off`, `set_temperature`, `set_brightness`, `lock`, `unlock`.

## 4. Important implementation note
For a concise working challenge solution, a control request records the desired state in MongoDB and returns `202 Accepted`. A production system should publish the command to an MQTT/Kafka message broker, deliver it through a device gateway, and update reported state only after the device acknowledges the command. The proposed production architecture is documented in `docs/HIGH_LEVEL_DESIGN.md`.

## 5. Project layout
```text
src/
  middleware/errors.js       Common HTTP error handling
  models/Device.js           Device schema and status index
  models/Activity.js         Activity history schema and indexes
  routes/devices.js          REST endpoints
  services/activityService.js Activity audit writer
  server.js                  Express app and MongoDB startup
docs/
  LOW_LEVEL_DESIGN.md
  HIGH_LEVEL_DESIGN.md
```
