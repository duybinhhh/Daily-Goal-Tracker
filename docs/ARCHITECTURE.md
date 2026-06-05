# Architecture Documentation

## 1. Công nghệ sử dụng (Tech Stack)
* **Backend:** Node.js (Express) với **Prisma ORM** kết hợp adapter PostgreSQL.
* **Database:** **PostgreSQL** (hỗ trợ cascade deletion và chỉ mục tối ưu).
* **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + React Router v6.
* **State Management:** **Zustand** (quản lý trạng thái xác thực và mục tiêu).
* **HTTP Client:** **Axios** với request/response Interceptor tự động xử lý và xoay vòng JWT tokens.
* **Authentication:** **JWT** (Access Token 15 phút + Refresh Token 7 ngày), mã hóa mật khẩu bằng **bcryptjs**.
* **Offline Caching & Queue:** **IndexedDB** (trình duyệt lưu đệm dữ liệu mục tiêu/chỉ số và hàng đợi đồng bộ offline).
* **PWA Engine:** **Service Worker** (`sw.js` cache giao diện shell tĩnh) + **Web App Manifest** (`manifest.json` cho phép cài đặt lên màn hình chính).

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
7. Chế độ Ngoại tuyến & Đồng bộ hóa sau (Offline Mode & Sync):
    *   **Khởi chạy offline:** Khi mất mạng, Service Worker (`sw.js`) đánh chặn yêu cầu và phục hồi app shell tĩnh từ Cache Storage. Zustand store (`goalStore.ts`) tự động bắt lỗi mạng và khôi phục dữ liệu thói quen/dashboard từ cache IndexedDB (`metadata` store).
    *   **Ghi nhận thói quen offline:** Các check-in thực hiện lúc offline được lưu tạm dưới dạng tác vụ hoàn thành (`OfflineAction`) vào hàng đợi `syncQueue` trong IndexedDB, đồng thời cập nhật tăng trực tiếp số đếm hiển thị trên UI. Cơ chế Undo cũng hoạt động offline bằng cách xóa bản ghi khỏi hàng đợi cục bộ này.
    *   **Ngăn chặn trùng lặp bằng UUID & Idempotency:**
        - Để ngăn ngừa các log check-in bị ghi nhận trùng lặp trong cơ sở dữ liệu khi có sự cố mạng hoặc thử lại, mỗi khi người dùng check-in (bất kể online hay offline), frontend lập tức tạo ra một mã UUID định danh duy nhất cho log đó (`log_id`) bằng `crypto.randomUUID` (hoặc thuật toán fallback sinh chuỗi ngẫu nhiên).
        - Mã `log_id` này được gửi kèm lên Server qua API `POST /api/goals/:id/complete` và được lưu làm khóa chính (Primary Key) của bảng `GoalLog`. Nhờ cơ chế ràng buộc khóa chính của database, các lượt check-in bị lặp lại do gửi đúp request sẽ bị chặn đứng hoàn toàn ở phía Backend.
    *   **Khóa Concurrency phía Giao diện (UI Concurrency Guard):**
        - Tại `GoalCard.tsx`, khi người dùng bấm check-in, trạng thái `completing` được gán bằng `true` ngay lập tức để chặn các sự kiện nhấn chuột liên hoàn (double-click) hoặc giữ phím Enter. Điều này đảm bảo mỗi hành động check-in hợp lệ chỉ kích hoạt đúng một yêu cầu gửi đi và một UUID duy nhất, tránh việc sinh ra nhiều UUID khác nhau cho cùng một lần bấm.
    *   **Khóa đồng bộ đa tab (Multi-tab Lock):**
        - Trình quản lý `syncManager.ts` tích hợp cơ chế đồng bộ hóa giữa nhiều tab trình duyệt đang mở đồng thời. Hệ thống sử dụng **Web Locks API** (`navigator.locks.request` với lock name `sync_offline_data_lock`) để chắc chắn rằng chỉ có một tab duy nhất được quyền đọc ghi hàng đợi `syncQueue` và liên kết API lên Server.
        - Khi chạy trong các trình duyệt cũ hoặc môi trường HTTP không bảo mật (non-secure context, nơi Web Locks bị chặn), trình quản lý sẽ tự động chuyển sang chế độ fallback sử dụng **LocalStorage Lock** (có gắn thời gian hết hạn 10 giây để tránh deadlock khi tab giữ lock bị crash đột ngột) và khóa bộ nhớ cục bộ `isSyncing`.
    *   **Tính bền vững của hàng đợi (Queue Durability):**
        - Các tác vụ check-in chỉ được xóa khỏi hàng đợi `syncQueue` *sau khi* API Server phản hồi mã thành công (HTTP status 2xx).
        - Nếu gặp lỗi mạng hoặc lỗi Server (5xx), quá trình đồng bộ sẽ tạm dừng hoàn toàn để giữ nguyên dữ liệu trong hàng đợi cho lần thử lại tiếp theo. Nếu gặp lỗi yêu cầu sai từ phía client (4xx, ví dụ: thói quen đã bị xóa ở server), tác vụ lỗi đó sẽ được gỡ bỏ khỏi hàng đợi để tránh tắc nghẽn vĩnh viễn (poison pill).
    *   **Hợp nhất hàng đợi thông minh chống giật lag (UI State Merging):**
        - Trong quá trình kết nối lại (khi mạng chuyển sang online và sync manager đang đồng bộ), việc tải lại dữ liệu từ Server có thể diễn ra trước khi hàng đợi ngoại tuyến được dọn sạch hoàn toàn, dẫn đến việc dữ liệu giao diện bị quay về trạng thái cũ trước khi offline (flicker/reset).
        - Để giải quyết vấn đề này, các hàm fetch dữ liệu `fetchGoals` và `fetchHistory` trong Zustand store (`goalStore.ts`) được thiết kế để *luôn luôn* đọc hàng đợi `syncQueue` từ IndexedDB và thực hiện cộng gộp/bù trừ số đếm, tự tạo bản ghi log giả định ngay tại client-side để hiển thị trước khi server phản hồi. Nhờ đó, giao diện người dùng luôn thống nhất với thực tế hành động của họ ở mọi thời điểm chuyển tiếp kết nối.
    *   **Đồng bộ khi có mạng:** Hệ thống lắng nghe sự kiện `online` thông qua trình sự kiện toàn cục ở `App.tsx` để tránh đăng ký lặp lại. Khi phát hiện mạng phục hồi, trình quản lý `syncManager.ts` thực hiện khóa đồng bộ, quét hàng đợi IndexedDB và tuần tự đồng bộ các bản ghi check-in với đúng mốc giờ gốc của sự kiện (`completed_at`). Sau khi đồng bộ thành công, stores sẽ được cập nhật lại dữ liệu chuẩn từ server và tính toán lại Streak/Lịch sử thống kê một cách toàn vẹn.