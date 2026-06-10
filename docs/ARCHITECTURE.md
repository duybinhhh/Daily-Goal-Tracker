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
  group_messages    GroupMessage[]
  message_reactions MessageReaction[]
  
  following     Follow[] @relation("UserFollowing")
  followers     Follow[] @relation("UserFollowers")
  show_activity_in_feed Boolean @default(true)
}

model Follow {
  id           String   @id @default(uuid())
  follower_id  String
  following_id String
  created_at   DateTime @default(now())

  follower     User @relation("UserFollowing", fields: [follower_id], references: [id], onDelete: Cascade)
  following    User @relation("UserFollowers", fields: [following_id], references: [id], onDelete: Cascade)

  @@unique([follower_id, following_id])
  @@index([follower_id])
  @@index([following_id])
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
  messages          GroupMessage[]
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

model GroupMessage {
  id        String   @id @default(uuid())
  group_id  String
  group     HabitGroup @relation(fields: [group_id], references: [id], onDelete: Cascade)
  sender_id String
  sender    User     @relation(fields: [sender_id], references: [id], onDelete: Cascade)
  content   String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  reactions MessageReaction[]

  @@index([group_id, created_at])
  @@index([sender_id])
}

model MessageReaction {
  id        String   @id @default(uuid())
  message_id String
  message   GroupMessage @relation(fields: [message_id], references: [id], onDelete: Cascade)
  user_id   String
  user      User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  emoji     String
  created_at DateTime @default(now())

  @@unique([message_id, user_id, emoji])
  @@index([message_id])
  @@index([user_id])
}

model GroupChatNotificationLog {
  id        String   @id @default(uuid())
  user_id   String
  group_id  String
  created_at DateTime @default(now())

  @@index([user_id, created_at])
}
```

---

## 3. Cấu trúc thư mục & Luồng hoạt động (Data Flow)

### 3.1 Cấu trúc thư mục chính (Key Directory)
*   `src/components/`: Chứa các component dùng chung (ví dụ: `Sidebar`, `GoalCard`, `ShareModal`, các UI components như `Button`, `Input`, `Card`, `ProgressBar`).
*   `src/components/groups/`: Chứa các component liên quan đến nhóm (ví dụ: `GroupCommentsSection`).
*   `src/pages/`: Các trang màn hình chính (`DashboardPage`, `GoalsPage`, `Stats`, `SettingsPage`, `LoginPage`, `GoalFormPage`, `TimelinePage`, `GroupsPage`).
*   `src/store/`: Zustand stores quản lý trạng thái client-side (`authStore`, `goalStore`, `groupStore`).
*   `src/services/api.ts`: Cấu hình Axios instance kèm cơ chế bắt lỗi 401 tự động refresh session.
*   `src/services/friends.ts`: Dịch vụ gọi API liên quan đến bạn bè.
*   `server/db.ts`: Lớp wrapper Prisma Client đóng gói các API tương tác DB.

### 3.2 Luồng xử lý dữ liệu cốt lõi (Core Flows)
1.  **Xác thực & Bảo mật (Auth & Guards)**:
    *   `App.tsx` sử dụng định tuyến `HashRouter`. Các tuyến đường chức năng được bao bọc trong `<ProtectedRoute>` kiểm tra `isAuthenticated`.
    *   Trạng thái đăng nhập được lưu trữ tập trung ở `authStore`.
2.  **Cài đặt & Tùy biến giao diện (Settings & Theme)**:
    *   Trang cài đặt cập nhật thông tin cá nhân lên API `PUT /api/auth/profile`.
    *   Người dùng chuyển đổi theme giữa Dark/Light Mode.
3.  **Ghi nhận mục tiêu, Hoàn tác & Tính Streak**:
    *   Khi người dùng check-in mục tiêu, frontend gọi `POST /api/goals/:id/complete`.
    *   Backend ghi nhận log trong bảng `GoalLog`, đồng thời gọi `Streak Engine` để tính toán chuỗi ngày liên tục.
4.  **Bảng thống kê và Heatmap (Premium Statistics Dashboard)**:
    *   Trang thống kê gọi API `GET /api/stats/dashboard` và `GET /api/stats/history`.
    *   Widget `TrendComparison` gọi API `GET /api/stats/trend`.
5.  **Trục thời gian hoạt động (Activity Timeline)**:
    *   Trang Timeline (`TimelinePage.tsx`) lấy lịch sử log từ `GET /api/stats/history`.
6.  **Danh sách mục tiêu chi tiết (My Goals)**:
    *   Trang Goals (`GoalsPage.tsx`) hiển thị toàn bộ mục tiêu của người dùng.
7.  **Chế độ Ngoại tuyến & Đồng bộ hóa sau (Offline Mode & Sync)**:
    *   Sử dụng IndexedDB và Service Worker để hỗ trợ hoạt động offline.
    *   Mã `log_id` UUID đảm bảo tính Idempotency khi đồng bộ.
8.  **Nhắc nhở chủ động chống đứt chuỗi (Active Reminders)**:
    *   [reminderScheduler.ts](file:///d:/Download/daily-goal-tracker/src/services/reminderScheduler.ts) gửi thông báo đẩy lúc 21h00 local time.
9.  **Đồng đội giám sát (Habit Groups)**:
    *   Tính năng nhóm thói quen với Leaderboard real-time.
10. **Chia sẻ vinh danh (Social Sharing)**:
    *   HTML5 Canvas Render Engine tạo ảnh vinh danh để chia sẻ.
11. **Phím tắt Check-in nhanh (Mobile Quick Widget / PWA Shortcuts)**:
    *   PWA Shortcuts cho phép check-in nhanh từ màn hình chính di động.
12. **Bình luận & Chat nhóm (Group Chat)** [NEW]:
    *   **Hệ thống thảo luận:** Tích hợp `GroupCommentsSection` trong `GroupsPage`.
    *   **Reactions:** Phản ứng emoji trên từng tin nhắn với optimistic update.
    *   **Quyền hạn (Moderation):** API và UI kiểm tra quyền xóa tin nhắn (Owner vs Member).
    *   **Giới hạn thông báo (Notification Limit):** Backend kiểm tra `GroupChatNotificationLog` để đảm bảo mỗi người dùng nhận tối đa 3 thông báo chat nhóm mỗi ngày.
13. **Theo dõi Bạn bè & Feed hoạt động (Friends Follow & Activity Feed)** [NEW]:
    *   **Tìm kiếm:** API `GET /api/friends/search` hỗ trợ tìm kiếm theo tên/email.
    *   **Theo dõi:** API `POST /api/friends/follow` và `DELETE /api/friends/follow` quản lý quan hệ follow 1 chiều.
    *   **Activity Feed:** API `GET /api/friends/feed` lấy 5 hoạt động mới nhất từ bạn bè, tôn trọng thiết lập quyền riêng tư (`show_activity_in_feed`).
    *   **Thống kê:** API `GET /api/friends/stats` cung cấp số lượng following/followers.
    *   **Privacy:** API `PATCH /api/friends/privacy` cập nhật trạng thái hiển thị hoạt động cá nhân.
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
