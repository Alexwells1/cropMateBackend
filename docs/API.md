# CropMate REST API Reference

**Base URL:** `http://localhost:5000/api/v1`

**Auth:** All `🔒` routes require `Authorization: Bearer <token>` header.

---

## Health Check

### `GET /health`
Returns server status — no auth required.

```json
{ "success": true, "service": "CropMate API", "environment": "development" }
```

---

## Auth Module

### `POST /auth/register`
Register a new farmer account.

**Body:**
```json
{
  "name": "Musa Ibrahim",
  "phone": "+2348012345678",
  "password": "securePass123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": { "_id": "...", "name": "Musa Ibrahim", "phone": "+2348012345678", "createdAt": "..." },
    "token": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### `POST /auth/login`
Login with phone + password.

**Body:** `{ "phone": "+2348012345678", "password": "securePass123" }`

---

### `GET /auth/profile` 🔒
Get the authenticated farmer's profile.

---

## Farms Module

### `POST /farms` 🔒
Create a new farm.

**Body:**
```json
{
  "farmName": "Musa Main Farm",
  "farmSize": 5.0,
  "location": { "latitude": 6.5244, "longitude": 3.3792 },
  "soilType": "Loamy"
}
```
> `soilType` options: `Loamy | Sandy | Clay | Silty | Peaty | Chalky | Unknown`

---

### `GET /farms/user` 🔒
Get all farms belonging to the authenticated user.

---

### `GET /farms/:id` 🔒
Get a specific farm by ID. Access restricted to owner.

---

## Crops Module

### `POST /crops` 🔒
Add a crop to a farm.

**Body:**
```json
{
  "farmId": "FARM_ID",
  "cropName": "Maize",
  "plantingDate": "2026-03-01",
  "fieldArea": 2.0,
  "status": "growing",
  "expectedHarvestDate": "2026-06-15"
}
```
> `status` options: `growing | harvested | failed | dormant`

---

### `GET /crops/farm/:farmId` 🔒
Get all crops for a farm.

---

### `PATCH /crops/:id` 🔒
Update a crop.

**Body (all fields optional):**
```json
{ "status": "harvested", "expectedHarvestDate": "2026-06-20", "fieldArea": 2.5 }
```

---

## Crop Records Module

### `POST /records` 🔒
Log a farming activity.

**Body:**
```json
{
  "cropId": "CROP_ID",
  "activityType": "fertilizer",
  "description": "Applied NPK 15-15-15 at 50kg/ha",
  "quantity": "2 bags",
  "activityDate": "2026-03-15"
}
```
> `activityType` options: `fertilizer | irrigation | pesticide | harvest | planting | weeding | other`

---

### `GET /records/crop/:cropId` 🔒
Get all activity records for a crop.

---

## Disease Detection Module

### `POST /detect-disease` 🔒
Upload a crop image for AI disease detection.

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `image` | File (JPEG/PNG/WebP, max 10MB) | ✅ |
| `cropId` | String | ✅ |

**Response `201`:**
```json
{
  "success": true,
  "message": "Disease detection completed.",
  "data": {
    "detectionId": "...",
    "disease": "Tomato Early Blight",
    "confidence": "91%",
    "isHealthy": false,
    "severity": "medium",
    "treatment": "Apply copper-based fungicide...",
    "preventionAdvice": "Ensure adequate plant spacing...",
    "imageUrl": "https://res.cloudinary.com/...",
    "detectedAt": "2026-03-16T10:30:00.000Z"
  }
}
```

> ⚡ Detection automatically fires an outbreak alert to all farmers within the configured radius.

---

### `GET /detect-disease/farm/:farmId` 🔒
Get detection history for a farm.

---

### `GET /detect-disease/crop/:cropId` 🔒
Get detection history for a specific crop.

---

## Soil Module

### `GET /soil/:farmId` 🔒
Fetch soil nutrient data and receive fertilizer + irrigation recommendations.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "soilData": {
      "ph": 6.4,
      "nitrogen": 0.28,
      "phosphorus": 0.16,
      "potassium": 0.42,
      "organicCarbon": 0.87,
      "moistureLevel": 36,
      "source": "iSDA Africa Soil API"
    },
    "fertilizerRecommendation": "✅ Soil pH is in a healthy range. 🟡 Nitrogen is moderate...",
    "irrigationAdvice": "✅ Soil moisture is adequate. Irrigate every 5–7 days.",
    "weather": {
      "temperature": 29,
      "humidity": 70,
      "rainfall": 0,
      "description": "Partly cloudy"
    }
  }
}
```

---

## Alerts Module

### `GET /alerts` 🔒
Get all community outbreak alerts. Supports `?page=1&limit=20`.

---

## Rotation Module

### `GET /rotation/:farmId` 🔒
Get crop rotation plan based on the farm's last harvested crop.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "recommendation": {
      "previousCrop": "Maize",
      "recommendedNextCrop": "Cowpea",
      "reason": "Cowpea is a nitrogen-fixing legume that restores soil nitrogen depleted by maize..."
    },
    "history": [...]
  }
}
```

---

## Notifications Module

### `GET /notifications` 🔒
Get notifications for the authenticated farmer. Supports `?page=1&limit=20`.

### `PATCH /notifications/read` 🔒
Mark **all** unread notifications as read.

### `PATCH /notifications/:id/read` 🔒
Mark a **single** notification as read.

---

## Error Response Format

All errors share this shape:
```json
{
  "success": false,
  "message": "Human-readable description",
  "errors": [
    { "field": "phone", "message": "Enter a valid international phone number" }
  ]
}
```

## HTTP Status Code Reference

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — token valid but access denied |
| `404` | Not Found |
| `409` | Conflict — e.g. phone already registered |
| `422` | Unprocessable Entity — validation errors |
| `429` | Rate Limit Exceeded |
| `500` | Internal Server Error |
