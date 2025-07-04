#  Codeforces Analyzer

[![Made with Quarkus](https://img.shields.io/badge/Made%20with-Quarkus-005CA1?style=for-the-badge&logo=quarkus&logoColor=white)](https://quarkus.io/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![REST Client](https://img.shields.io/badge/API-MicroProfile-blue?style=for-the-badge)](https://github.com/eclipse/microprofile)

> A backend service built with **Quarkus** that connects to the **Codeforces API**, processes user data, and provides real-time analytics on user submissions, ratings, blogs, and problem tags with MongoDB persistence and Redis caching.

---

## ⚙️ Features

✅ Secure SHA-512 API signature generation  
✅ Fetch & cache Codeforces user info and blog data  
✅ Analyze solved problems by tags and difficulty  
✅ Redis-backed response caching  
✅ MongoDB-backed persistent storage  
✅ Clean REST API structure

---

## 🛠️ Tech Stack

- **Framework**: Quarkus (Java)
- **API Client**: MicroProfile REST Client
- **Database**: MongoDB
- **Cache Layer**: Redis

---

## 🔥 Endpoints Overview

| Method | Endpoint                              | Description                           |
|--------|---------------------------------------|---------------------------------------|
| `GET`  | `/user-info/{handle}`                 | Fetch & cache Codeforces user info    |
| `GET`  | `/user-blogs/{handle}`                | Retrieve blog entries                 |
| `GET`  | `/solved-tags/{handle}`               | Tag-based problem analytics           |
| `GET`  | `/solved-count/{handle}/{difficulty}` | Count solved problems by difficulty   |

---

## 🧠 Learning Highlights

- Built secure API integrations using SHA-512 and dynamic signature logic
- Used MicroProfile REST Client for clean external API calls
- Integrated MongoDB with POJOs and automatic upserts
- Implemented Redis caching for performance and reduced API load
- Designed RESTful endpoints to deliver real-time analytics on Codeforces data

---