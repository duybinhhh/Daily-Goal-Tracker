# Architecture Documentation

## 1. Công nghệ sử dụng (Tech Stack)
* **Backend:** Node.js (Express/Fastify) với **Prisma ORM**.
* **Database:** **PostgreSQL**.
* **Frontend:** React, React Router, **Zustand** (State Management), Axios (HTTP Client).
* **Authentication:** **JWT** (Access Token + Refresh Token Flow), mã hóa mật khẩu bằng **bcrypt**.

## 2. Mô hình Dữ liệu (Prisma Schema Concepts)

Dựa trên yêu cầu hệ thống, cơ sở dữ liệu bao gồm các bảng cốt lõi sau:

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String // Đã hash bằng bcrypt
  name         String?
  timezone     String    @default("UTC")
  goals        Goal[]
  createdAt    DateTime  @default(now())
}

model Goal {
  id           String    @id @default(uuid())
  title        String
  description  String?
  targetCount  Int       @default(1)
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  logs         GoalLog[]
  streak       Streak?
  createdAt    DateTime  @default(now())
}

model GoalLog {
  id           String    @id @default(uuid())
  goalId       String
  goal         Goal      @relation(fields: [goalId], references: [id], onDelete: Cascade)
  completedAt  DateTime  @default(now()) // Ghi nhận thời gian hoàn thành cụ thể
}

model Streak {
  id           String    @id @default(uuid())
  goalId       String    @unique
  goal         Goal      @relation(fields: [goalId], references: [id], onDelete: Cascade)
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastUpdated  DateTime
}

model Notification {
  id           String    @id @default(uuid())
  userId       String
  content      String
  isRead       Boolean   @default(false)
  remindAt     DateTime
}