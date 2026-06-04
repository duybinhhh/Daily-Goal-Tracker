# Architecture Documentation

## 1. Công nghệ sử dụng (Tech Stack)
* **Backend:** Node.js (Express) với **Prisma ORM** kết hợp adapter PostgreSQL.
* **Database:** **PostgreSQL** (hỗ trợ cascade deletion và chỉ mục tối ưu).
* **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + React Router v6.
* **State Management:** **Zustand** (quản lý trạng thái xác thực và mục tiêu).
* **HTTP Client:** **Axios** với request/response Interceptor tự động xử lý và xoay vòng JWT tokens.
* **Authentication:** **JWT** (Access Token 15 phút + Refresh Token 7 ngày), mã hóa mật khẩu bằng **bcryptjs**.

---

## 2. Mô hình Dữ liệu thực tế (Prisma Schema)

Cơ sở dữ liệu PostgreSQL thực tế được định nghĩa trong `prisma/schema.prisma` bao gồm các bảng sau:

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password_hash String
  name          String
  timezone      String         @default("UTC")
  created_at    DateTime       @default(now())
  updated_at    DateTime       @updatedAt
  goals         Goal[]
  logs          GoalLog[]
  notifications Notification[]
}

model Goal {
  id            String     @id @default(uuid())
  user_id       String
  user          User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  title         String
  description   String?
  category      String
  target_count  Int        @default(1)
  current_count Int        @default(0)
  frequency     String     @default("daily") // daily, weekly, monthly
  status        String     @default("active") // active, paused, completed
  due_date      DateTime?
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
  logs          GoalLog[]
  streaks       Streak[]

  @@index([user_id])
}

model GoalLog {
  id           String   @id @default(uuid())
  goal_id      String
  goal         Goal     @relation(fields: [goal_id], references: [id], onDelete: Cascade)
  user_id      String
  user         User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  completed_at DateTime @default(now())
  note         String?
  created_at   DateTime @default(now())

  @@index([goal_id])
  @@index([user_id])
}

model Streak {
  id                String    @id @default(uuid())
  user_id           String
  goal_id           String
  goal              Goal      @relation(fields: [goal_id], references: [id], onDelete: Cascade)
  current_streak    Int       @default(0)
  longest_streak    Int       @default(0)
  last_completed_at DateTime?

  @@index([user_id])
  @@index([goal_id])
}

model Notification {
  id         String   @id @default(uuid())
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  type       String   @default("info") // welcome, info, streak_alert
  message    String
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())

  @@index([user_id])
}
```

---

## 3. Cấu trúc thư mục & Luồng hoạt động (Data Flow)

### 3.1 Cấu trúc thư mục chính (Key Directory)
*   `src/components/`: Chứa các component dùng chung (ví dụ: `Sidebar`, `GoalCard`, các UI components như `Button`, `Input`, `Card`, `ProgressBar`).
*   `src/pages/`: Các trang màn hình chính (`DashboardPage`, `Stats`, `SettingsPage`, `LoginPage`, `GoalFormPage`).
*   `src/store/`: Zustand stores quản lý trạng thái client-side (`authStore`, `goalStore`).
*   `src/services/api.ts`: Cấu hình Axios instance kèm cơ chế bắt lỗi 401 tự động refresh session.
*   `server/db.ts`: Lớp wrapper Prisma Client giả lập mô hình dữ liệu cũ và đóng gói các API tương tác DB.

### 3.2 Luồng xử lý dữ liệu cốt lõi (Core Flows)
1.  **Xác thực & Bảo mật (Auth & Guards)**:
    *   `App.tsx` sử dụng định tuyến `HashRouter`. Các tuyến đường chức năng được bao bọc trong `<ProtectedRoute>` kiểm tra `isAuthenticated`.
    *   Trạng thái đăng nhập được lưu trữ tập trung ở `authStore`.
2.  **Cài đặt & Tùy biến giao diện (Settings & Theme)**:
    *   Trang cài đặt cập nhật thông tin cá nhân lên API `PUT /api/auth/profile` để trả về token mới.
    *   Người dùng chuyển đổi theme giữa Dark/Light Mode. Theme được lưu vào `localStorage` và kích hoạt bằng cách thêm/bớt class `light`/`dark` trên thẻ `html`.
    *   Glass Opacity được kiểm soát bằng cách gán giá trị trượt trực tiếp vào biến CSS `--glass-opacity` giúp cập nhật độ trong suốt tức thì.
3.  **Ghi nhận mục tiêu & Tính Streak**:
    *   Khi người dùng check-in mục tiêu, frontend gọi `POST /api/goals/:id/complete`.
    *   Backend ghi nhận log trong bảng `GoalLog`, đồng thời gọi `Streak Engine` để tính toán chuỗi ngày liên tục và lưu trữ vào bảng `Streak` (tránh việc tính toán quét bảng tốn tài nguyên).
4.  **Bảng thống kê và Heatmap**:
    *   Trang thống kê gọi API `GET /api/stats/dashboard` và `GET /api/stats/history`.
    *   Màu sắc của các ô heatmap trong Activity Calendar grid được hiển thị linh hoạt theo các lớp CSS `.heatmap-cell-0` đến `.heatmap-cell-3` sử dụng hàm `color-mix` để tự tương thích với cả 2 giao diện sáng/tối.