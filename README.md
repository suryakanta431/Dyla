# DYLA Ticketing System - Problem 1

This repository contains a high-concurrency ticketing system built to solve the 50,000 request / 60-second load problem. It completely eliminates race conditions and handles the "retry-storm" of rejected users without crashing the server.

## The Architecture 

* **The Problem:** A standard relational database (like Postgres) bottlenecks under 50,000 concurrent requests. Connection pools exhaust, and inherent race conditions cause the system to oversell inventory before crashing.
* **The Invariant (Redis & Lua):** To enforce a strict limit of 100 tickets, inventory allocation was migrated to a single-threaded Redis Lua script. Every transaction runs atomically, meaning exactly 100 tickets are secured with zero race conditions and zero overselling.
* **The Retry-Storm (SSE):** Real-world infrastructure collapses when 49,900 rejected clients continuously retry their requests. To solve this, the server utilizes a Server-Sent Events (SSE) broadcast. The exact millisecond ticket #100 is locked, a global "Sold Out" state is pushed to the queue, terminating all pending client connections at the edge and dropping server load to zero.

## Tech Stack
* **Backend:** Node.js (Express)
* **Database/Cache:** Redis
* **Load Testing Client:** Go (Golang)

## Prerequisites
To run this project locally, you will need:
* [Node.js](https://nodejs.org/) installed.
* [Go](https://go.dev/) installed.
* A local instance of [Redis](https://redis.io/) running on port `6379`.

## How to Run the Project

**1. Start the Backend Server**
Navigate to the `server` directory, install the dependencies, and start the Express server.
```bash
cd server
npm install
node index.js
