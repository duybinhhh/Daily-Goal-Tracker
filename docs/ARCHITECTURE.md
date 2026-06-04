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
*   `src/pages/`: Các trang màn hình chính (`DashboardPage`, `GoalsPage`, `Stats`, `SettingsPage`, `LoginPage`, `GoalFormPage`, `TimelinePage`).
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
3.  **Ghi nhận mục tiêu, Hoàn tác & Tính Streak**:
    *   Khi người dùng check-in mục tiêu, frontend gọi `POST /api/goals/:id/complete`.
    *   Backend ghi nhận log trong bảng `GoalLog`, đồng thời gọi `Streak Engine` để tính toán chuỗi ngày liên tục và lưu trữ vào bảng `Streak` (tránh việc tính toán quét bảng tốn tài nguyên).
    *   **Cơ chế hoàn tác (Undo) & Ẩn mục tiêu đã hoàn thành:** Trên Dashboard, nếu mục tiêu đạt chỉ tiêu hoàn thành trong ngày, hệ thống sẽ kích hoạt bộ đếm ngược 5 giây (`disappearingGoals` state) kèm nút **Undo** trên thẻ mục tiêu [GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx) trước khi ẩn nó đi. Nếu người dùng chọn hoàn tác hoặc bấm xóa log check-in (gọi API `DELETE /api/goals/logs/:logId`), backend sẽ xóa bản ghi khỏi `GoalLog`, giảm tiến độ mục tiêu, phục hồi trạng thái hoạt động và chạy hàm tính toán lại streak (`recalculateStreak`).
    *   **Thuật toán Recalculate Streak:** Hàm `recalculateStreak` sẽ quét toàn bộ các log còn lại của thói quen đó, chuyển đổi thời gian check-in về ngày địa phương (`timezone` của User), nhóm theo ngày để tìm ra các ngày đạt chỉ tiêu, sau đó duyệt từ đầu đến cuối để tính toán lại chính xác `current_streak` và `longest_streak`.
4.  **Bảng thống kê và Heatmap (Premium Statistics Dashboard)**:
    *   Trang thống kê gọi API `GET /api/stats/dashboard` và `GET /api/stats/history` (với phạm vi 182 ngày để hiển thị 26 tuần thói quen).
    *   Căn chỉnh ngày bắt đầu của lịch hoạt động về Chủ Nhật để tạo lưới ô lịch hoàn hảo (7 dòng x 26 cột). Màu sắc các ô được điều khiển linh hoạt qua các lớp màu chủ đề `bg-primary`, `bg-primary/20`, v.v. thích ứng tự động với Light/Dark theme.
    *   Biểu đồ xu hướng hiệu năng nhóm tiến độ 70 ngày gần nhất thành 10 tuần, hiển thị cột CSS trực quan với hiệu ứng hover tooltip.
    *   Sử dụng CSS `conic-gradient` tạo biểu đồ tròn Donut động biểu diễn tỉ lệ phân loại thói quen của người dùng.
    *   Các hành động như tải file báo cáo CSV (`Export CSV`) và làm mới nhanh dữ liệu được tích hợp trực tiếp trên thanh tiêu đề sticky chuẩn hóa.
5.  **Trục thời gian hoạt động (Activity Timeline)**:
    *   Trang Timeline (`TimelinePage.tsx`) tự động tính toán ngày bắt đầu và kết thúc của tháng đang chọn để gọi API `GET /api/stats/history?from=&to=` lấy toàn bộ lịch sử log.
    *   Calendar Grid hiển thị các chấm xanh nếu ngày đó có ít nhất 1 log, và hiển thị ngôi sao lấp lánh nếu có từ 3 logs trở lên (cột mốc đột phá).
    *   Nhấp chọn một ngày bất kỳ trên lưới để lọc nhanh danh sách feed hoạt động bên phải, hoặc bấm lại để hủy lọc (xem toàn bộ log trong tháng).
    *   **Xóa Log check-in:** Mỗi bản ghi trong feed hoạt động hiển thị một nút Delete. Khi click và xác nhận, hệ thống gọi API `DELETE /api/goals/logs/:logId` để xóa hoàn toàn check-in đó khỏi cơ sở dữ liệu và tự động cập nhật lại các biểu đồ/chỉ số liên quan.
    *   Tính năng xuất báo cáo định dạng CSV cho phép trích xuất trực tiếp toàn bộ log hoàn thành của tháng hiện tại ra file bảng tính qua cơ chế URI mã hóa.
6.  **Danh sách mục tiêu chi tiết (My Goals)**:
    *   Trang Goals (`GoalsPage.tsx`) kết nối với kho dữ liệu thói quen qua `useGoals` hook.
    *   Hỗ trợ tương tác tạm dừng/hoạt động lại thông qua API cập nhật trạng thái mục tiêu (`PUT /api/goals/:id` truyền tham số `status`).
    *   Thực hiện tính toán tỷ lệ hoàn thành trung bình của các mục tiêu hoạt động ở Client-side và biểu diễn bằng vòng tròn SVG động cùng các danh hiệu khích lệ năng suất.