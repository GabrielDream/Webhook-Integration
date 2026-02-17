🔌 Webhook Integration Demo

Full integration demo showing secure webhook processing with signature validation and idempotent persistence.

This project demonstrates:

JWT Authentication

HMAC signature validation (GitHub standard)

Webhook idempotency (PROCESSING / PROCESSED / FAILED lifecycle)

Persistent event ledger (PostgreSQL + Prisma)

Administrative dashboard listing latest webhook events

Separation between edge failures and internal processing failures

🧱 Architecture

The backend is built on top of a custom "Vanilla Nest-like Template" including:

Express 5

Prisma (PostgreSQL)

JWT + RBAC

Structured middlewares

Error & success handlers

Automated tests (Jest + Supertest)

The frontend is a lightweight administrative interface to visualize webhook events.

🚀 How It Works

GitHub sends a webhook event

Signature is validated via HMAC

Payload is normalized

Idempotency lock is acquired

Event is marked PROCESSED or FAILED

Dashboard retrieves events via authenticated route

📦 Stack

Node.js · Express · Prisma · PostgreSQL · JWT · HMAC · Jest

🎯 Purpose

Technical demonstration of real-world webhook handling patterns for integration and backend engineering roles.