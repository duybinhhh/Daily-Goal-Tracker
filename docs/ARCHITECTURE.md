# Architecture Documentation

## 1. Công nghệ sử dụng (Tech Stack)
* **Backend:** Node.js (Express) với **Prisma ORM** kết hợp adapter PostgreSQL.
* **Database:** **PostgreSQL** (hỗ trợ cascade deletion và chỉ mục tối ưu).
* **Frontend:** React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + React Router v6.
* **State Management:** **Zustand** (quản lý trạng thái xác thực, mục tiêu và nhóm thói quen).
* **HTTP Client:** **Axios** với request/response Interceptor tự động xử lý và xoay vòng JWT tokens.
* **Authentication:** **JWT** (Access Token 15 phút + Refresh Token 7 ngày), mã hóa mật khẩu bằng **bcryptjs**.
* **Offline Caching & Queue:** **IndexedDB** (trình duyệt lưu đệm dữ liệu mục tiêu/chỉ số và hàng đợi đồng bộ offline).
* **PWA Engine:** **Service Worker** (`sw.js` cache giao diện shell tĩnh và đón nhận sự kiện push/notificationclick) + **Web App Manifest** (`manifest.json` cho phép cài đặt lên màn hình chính và hỗ trợ lối tắt **PWA Shortcuts** chạm check-in nhanh từ icon).
* **Web Push Notifications:** Sử dụng thư viện **web-push** ở Backend để đẩy thông báo về thiết bị/trình duyệt của người dùng thông qua chuẩn VAPID keys.
* **Social Sharing Card Renderer:** **HTML5 Canvas API** (kết xuất thẻ vinh danh chất lượng cao phía client) kết hợp **Web Share API** của trình duyệt phục vụ chia sẻ một chạm.

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
  push_subscription     String?
  last_reminder_sent_date String?
  created_groups HabitGroup[] @relation("GroupCreator")
  group_memberships HabitGroupMember[]
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
  reminder_time String?   // Format "HH:mm" (e.g. "08:30")
  created_at    DateTime   @default(now())
  updated_at    DateTime   @updatedAt
  logs          GoalLog[]
  streaks       Streak[]
  group_id      String?
  group         HabitGroup? @relation(fields: [group_id], references: [id], onDelete: SetNull)

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

model HabitGroup {
  id                String             @id @default(uuid())
  name              String
  description       String?
  creator_id        String
  creator           User               @relation("GroupCreator", fields: [creator_id], references: [id], onDelete: Cascade)
  goal_title        String
  goal_category     String
  goal_target_count Int                @default(1)
  goal_frequency    String             @default("daily")
  created_at        DateTime           @default(now())
  updated_at        DateTime           @updatedAt
  members           HabitGroupMember[]
  goals             Goal[]
}

model HabitGroupMember {
  id        String     @id @default(uuid())
  group_id  String
  group     HabitGroup @relation(fields: [group_id], references: [id], onDelete: Cascade)
  user_id   String
  user      User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  joined_at DateTime   @default(now())

  @@unique([group_id, user_id])
  @@index([group_id])
  @@index([user_id])
}
```

---

## 3. Cấu trúc thư mục & Luồng hoạt động (Data Flow)

### 3.1 Cấu trúc thư mục chính (Key Directory)
*   `src/components/`: Chứa các component dùng chung (ví dụ: `Sidebar`, `GoalCard`, `ShareModal`, các UI components như `Button`, `Input`, `Card`, `ProgressBar`).
*   `src/pages/`: Các trang màn hình chính (`DashboardPage`, `GoalsPage`, `Stats`, `SettingsPage`, `LoginPage`, `GoalFormPage`, `TimelinePage`, `GroupsPage`).
*   `src/store/`: Zustand stores quản lý trạng thái client-side (`authStore`, `goalStore`, `groupStore`).
*   `src/services/api.ts`: Cấu hình Axios instance kèm cơ chế bắt lỗi 401 tự động refresh session.
*   `server/db.ts`: Lớp wrapper Prisma Client đóng gói các API tương tác DB (bao gồm mappers cho User, Goal, Streak, HabitGroup, HabitGroupMember).

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
    *   **Thuật toán Recalculate Streak & Múi giờ an toàn:** Hàm `recalculateStreak` và trình tính streak `completeGoal` sử dụng hàm hỗ trợ `getCalendarDaysDiffTimezone` để ánh xạ chính xác các timestamp log sang múi giờ địa phương (`timezone` của User) rồi tính toán khoảng cách ngày trên định dạng `YYYY-MM-DD`. Điều này triệt tiêu hoàn toàn sự cố đứt streak do server đặt ở nước ngoài lệch múi giờ.
    *   **Cơ chế Tự động Reset Tiến độ theo Chu kỳ (Cycle-Aware Progress Reset):** Để giải quyết vấn đề tiến độ mục tiêu (`current_count`) bị tích lũy cộng dồn vô hạn qua các ngày, hệ thống tích hợp bộ lọc đồng bộ `syncAndResetGoalProgress`. Mỗi khi có yêu cầu truy vấn mục tiêu (`getGoals`, `getGoalById`), check-in (`completeGoal`), chỉnh sửa (`updateGoal`), xóa check-in (`deleteLog`), hoặc tải số liệu dashboard (`getDashboardStats`), hệ thống tự động kiểm tra số check-in thực tế trong chu kỳ hiện tại (hàng ngày, hàng tuần, hàng tháng) dựa trên múi giờ của người dùng. Nếu phát hiện đã chuyển sang chu kỳ mới, số đếm tiến độ `current_count` sẽ tự động reset về đúng số check-in thực tế và chuyển `status` về `"active"` trong DB.
4.  **Bảng thống kê và Heatmap (Premium Statistics Dashboard)**:
    *   Trang thống kê gọi API `GET /api/stats/dashboard` và `GET /api/stats/history` (với phạm vi 182 ngày để hiển thị 26 tuần thói quen).
    *   Căn chỉnh ngày bắt đầu của lịch hoạt động về Chủ Nhật để tạo lưới ô lịch hoàn hảo (7 dòng x 26 cột). Màu sắc các ô được điều khiển linh hoạt qua các lớp màu chủ đề `bg-primary`, `bg-primary/20`, v.v. thích ứng tự động với Light/Dark theme.
    *   Biểu đồ xu hiện năng nhóm tiến độ 70 ngày gần nhất thành 10 tuần, hiển thị cột CSS trực quan với hiệu ứng hover tooltip.
    *   Sử dụng CSS `conic-gradient` tạo biểu đồ tròn Donut động biểu diễn tỉ lệ phân loại thói quen của người dùng.
    *   Các hành động như tải file báo cáo CSV (`Export CSV`) và làm mới nhanh dữ liệu được tích hợp trực tiếp trên thanh tiêu đề sticky chuẩn hóa.
    *   Widget `TrendComparison` trong `src/components/stats/TrendComparison.tsx` gọi API `GET /api/stats/trend` để lấy dữ liệu so sánh xu hướng realtime theo `period=day|week|month` và `goalId` tùy chọn.
    *   Backend xử lý logic xu hướng trong `src/controllers/statsController.ts`, đọc trực tiếp từ `GoalLog`, loại trùng log bằng khóa `goal_id + completed_at + note`, chuẩn hóa ngày theo timezone của user và trả `Cache-Control: no-store`.
    *   Chế độ tuần dùng tuần lịch Monday-Sunday. Chế độ tháng nhóm dữ liệu theo các cụm ngày trong tháng để hiển thị biểu đồ cột đôi bằng Recharts.
    *   `dailySummary` cho `Hôm qua` và `Hôm nay` không chỉ kiểm tra có log hay chưa; mỗi goal chỉ được tính là `Đã đạt` khi số log trong ngày lớn hơn hoặc bằng `target_count`.
    *   Khi không lọc `goalId`, response trả thêm `goalBreakdown` để frontend có thể hiển thị chế độ `Chi tiết` theo từng mục tiêu ở dạng hàng ngang.
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
7.  **Chế độ Ngoại tuyến & Đồng bộ hóa sau (Offline Mode & Sync)**:
    *   **Khởi chạy offline:** Khi mất mạng, Service Worker (`sw.js`) phục hồi app shell tĩnh từ Cache Storage. Zustand store (`goalStore.ts`) khôi phục dữ liệu từ cache IndexedDB (`metadata` store).
    *   **Ghi nhận thói quen offline:** Các check-in thực hiện lúc offline được lưu tạm dưới dạng tác vụ hoàn thành (`OfflineAction`) vào hàng đợi `syncQueue` trong IndexedDB, đồng thời cập nhật tăng trực tiếp số đếm hiển thị trên UI. Cơ chế Undo cũng hoạt động offline bằng cách xóa bản ghi khỏi hàng đợi cục bộ này.
    *   **Ngăn chặn trùng lặp bằng UUID & Idempotency:**
        - Để ngăn ngừa các log check-in bị ghi nhận trùng lặp trong cơ sở dữ liệu khi có sự cố mạng hoặc thử lại, mỗi khi người dùng check-in, frontend tạo ra một mã UUID định danh duy nhất cho log đó (`log_id`).
        - Mã `log_id` này được gửi kèm lên Server qua API và được lưu làm khóa chính (Primary Key) của bảng `GoalLog` trong database để chặn đứng hoàn toàn các lượt check-in bị lặp lại.
    *   **Khóa Concurrency phía Giao diện (UI Concurrency Guard):** Tại `GoalCard.tsx`, trạng thái `completing` được gán bằng `true` ngay lập tức để chặn các sự kiện nhấn chuột liên hoàn.
    *   **Khóa đồng bộ đa tab (Multi-tab Lock):** Trình quản lý `syncManager.ts` sử dụng **Web Locks API** (`navigator.locks.request` với lock name `sync_offline_data_lock`) để chắc chắn rằng chỉ có một tab duy nhất được quyền đồng bộ hóa lên Server (hoặc fallback sang LocalStorage Lock có timeout 10 giây).
    *   **Hợp nhất hàng đợi thông minh chống giật lag (UI State Merging):** Các hàm fetch dữ liệu `fetchGoals` và `fetchHistory` trong Zustand store (`goalStore.ts`) được thiết kế để *luôn luôn* đọc hàng đợi `syncQueue` từ IndexedDB và thực hiện cộng gộp/bù trừ số đếm hiển thị trước khi server phản hồi.
8.  **Nhắc nhở chủ động chống đứt chuỗi (Active Reminders)**:
    *   **Scheduler:** Dịch vụ [reminderScheduler.ts](file:///d:/Download/daily-goal-tracker/src/services/reminderScheduler.ts) chạy ngầm trên máy chủ mỗi phút. Nó quét qua toàn bộ người dùng có lưu `push_subscription` trên DB và gửi thông báo đẩy lúc 21h00 tối theo giờ địa phương của họ nếu còn thói quen chưa đạt chỉ tiêu.
9.  **Đồng đội giám sát (Habit Groups)** [NEW]:
    *   **Gia nhập và tạo nhóm thói quen:** Khi tạo/tham gia một nhóm (`HabitGroup`), backend tạo bản ghi `HabitGroupMember` đồng thời sinh một `Goal` cá nhân tương ứng liên kết qua trường `group_id`.
    *   **Leaderboard Real-time:** Khi truy vấn thông tin nhóm qua API `GET /api/groups/:id`, backend quét toàn bộ các goal có `group_id` này, đồng bộ chu kỳ và tính toán tiến độ hôm nay của từng thành viên trong nhóm dựa trên múi giờ riêng của họ, trả về bảng xếp hạng trực quan hiển thị số đếm hoàn thành và chuỗi Streak của từng thành viên.
10. **Chia sẻ vinh danh (Social Sharing)** [NEW]:
    *   **HTML5 Canvas Render Engine:** Khi người dùng mở ShareModal, component [ShareModal.tsx](file:///d:/Download/daily-goal-tracker/src/components/ShareModal.tsx) sẽ lấy dữ liệu tương ứng (milestone badge hoặc heatmap grid) vẽ lên một thẻ canvas 1200x630px được thiết kế dark glassmorphism sang trọng với metallic borders và glows.
    *   **Bất đối xứng mạng xã hội (Share API & Intents):** Hỗ trợ xuất ảnh từ canvas thành URL nhị phân (Data URL) để tải xuống dạng PNG, gọi Web Share API trên mobile để gửi ảnh trực tiếp đến Zalo/Telegram/Messenger, hoặc chuyển hướng người dùng tới X (Twitter) và Facebook kèm thông điệp soạn sẵn.
11. **Phím tắt Check-in nhanh (Mobile Quick Widget / PWA Shortcuts)** [NEW]:
    *   **PWA Shortcuts & Manifest Configuration:** Cấu hình thuộc tính `shortcuts` trong `manifest.json` ánh xạ tới `/index.html#/quick-checkin` để các bệ phóng trên di động (Mobile Launchers) hiển thị phím tắt khi nhấn giữ.
    *   **Trang Check-in di động (`QuickCheckInPage.tsx`):** Xây dựng trang check-in tối giản có layout thích ứng, chỉ hiển thị danh sách mục tiêu ngày (phân tách hai nhóm Chưa hoàn thành / Đã hoàn thành).
    *   **Web Vibration Haptic Feedback:** Tích hợp gọi `navigator.vibrate([80])` phản hồi xúc giác rung nhẹ khi check-in (hoặc rung kép `[40, 40]` khi hoàn tác) tạo cảm giác tương tác phản hồi xúc giác như widget gốc di động.
    *   **Cơ chế đếm ngược hoàn tác:** Thể hiện trạng thái đếm ngược 5 giây trên thẻ thói quen sau khi bấm log tiến độ, cho phép người dùng bấm "Hoàn tác" (Undo) để thu hồi log từ hàng đợi IndexedDB hoặc API Backend.
## Bổ sung 2026-06-09: Ghi chú kiến trúc AI Coach, Streak Freeze và local dev

### AI Coach
Frontend:
- `src/components/AICoachDrawer.tsx`: drawer chat/report AI Coach.
- `src/store/aiCoachStore.ts`: store điều khiển trạng thái mở/đóng.
- `src/components/Sidebar.tsx`: thêm nút AI Coach.
- `src/components/BottomNav.tsx`: thêm nút AI Coach cho mobile.
- `src/App.tsx`: render AI Coach drawer trong layout chính.

Backend:
- `src/controllers/aiController.ts`: gọi Gemini và tạo fallback.
- `src/routes/ai.ts`: route AI có auth middleware.
- `src/express-app.ts`: đăng ký `/api/ai`.

Environment:
- `GEMINI_API_KEY` bắt buộc nếu muốn gọi Gemini thật.
- Nếu key hết quota, Gemini có thể trả `429 RESOURCE_EXHAUSTED`.

### Streak Freeze
Frontend:
- `src/components/GoalCard.tsx`: hiển thị nút `Protect Streak` và gọi API activate.
- `src/pages/Stats.tsx`: hiển thị marker ngày frozen.
- `src/pages/TimelinePage.tsx`: hiển thị marker ngày frozen.
- `src/index.css`: thêm style cho ngày frozen.
- `src/types.ts`: thêm type `StreakFreeze` và `FreezeToken`.

Backend:
- `src/controllers/freezeController.ts`: xử lý token, activate, danh sách ngày frozen.
- `src/routes/freeze.ts`: route freeze có auth middleware.
- `src/express-app.ts`: đăng ký `/api/freeze`.
- `server/db.ts`: thêm wrapper `freezeTokens`, `streakFreezes`, mapper `mapFreeze`.
- `src/controllers/goalController.ts`: cập nhật logic streak để xét ngày đã frozen khi bị miss một ngày.
- `src/services/reminderScheduler.ts`: thêm logic nhắc đóng băng streak.

Database cần có:
```prisma
model User {
  last_freeze_reminder_date String?
}

model StreakFreeze {
  id          String   @id @default(uuid())
  user_id     String
  goal_id     String
  frozen_date String
  created_at  DateTime @default(now())

  @@unique([goal_id, frozen_date])
  @@index([user_id])
  @@index([goal_id])
}

model FreezeToken {
  id          String   @id @default(uuid())
  user_id     String   @unique
  tokens_left Int      @default(3)
  month_year  String
  updated_at  DateTime @updatedAt
}
```

### Ổn định local dev
- `authStore` đọc `localStorage.user` bằng try/catch để tránh trắng trang khi JSON bị hỏng.
- Trên `localhost`, `main.tsx` không đăng ký service worker production.
- `sw.js` tự xóa cache và unregister khi chạy local.
- Fetch handler không intercept request local.

Lý do: service worker cũ có thể cache app shell/JS lỗi và gây trắng trang dù server vẫn trả HTTP 200.
