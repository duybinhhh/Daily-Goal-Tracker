# Technical Notes - 2026-06-09

Tài liệu này ghi lại các điểm kỹ thuật đã thay đổi và các lưu ý còn thiếu cho kiến trúc hiện tại.

## 1. AI Coach

### Frontend
- `src/components/AICoachDrawer.tsx`: drawer chat/report AI Coach.
- `src/store/aiCoachStore.ts`: store điều khiển trạng thái mở/đóng.
- `src/components/Sidebar.tsx`: thêm nút AI Coach.
- `src/components/BottomNav.tsx`: thêm nút AI Coach cho mobile.
- `src/App.tsx`: render AI Coach drawer trong layout chính.

### Backend
- `src/controllers/aiController.ts`: gọi Gemini và tạo fallback.
- `src/routes/ai.ts`: route AI có auth middleware.
- `src/express-app.ts`: đăng ký `/api/ai`.

### Environment
- `GEMINI_API_KEY` bắt buộc nếu muốn gọi Gemini thật.
- Nếu key hết quota, Gemini có thể trả `429 RESOURCE_EXHAUSTED`.

## 2. Streak Freeze

### Frontend
- `src/components/GoalCard.tsx`: hiển thị nút `Protect Streak` và gọi API activate.
- `src/pages/Stats.tsx`: hiển thị marker ngày frozen.
- `src/pages/TimelinePage.tsx`: hiển thị marker ngày frozen.
- `src/index.css`: thêm style cho ngày frozen.
- `src/types.ts`: thêm type `StreakFreeze` và `FreezeToken`.

### Backend
- `src/controllers/freezeController.ts`: xử lý token, activate, danh sách ngày frozen.
- `src/routes/freeze.ts`: route freeze có auth middleware.
- `src/express-app.ts`: đăng ký `/api/freeze`.
- `server/db.ts`: thêm wrapper `freezeTokens`, `streakFreezes`, mapper `mapFreeze`.
- `src/controllers/goalController.ts`: cập nhật logic streak để xét ngày đã frozen khi bị miss một ngày.
- `src/services/reminderScheduler.ts`: thêm logic nhắc đóng băng streak.

### Database
Schema Prisma cần có:

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

### DB sync đã xử lý thủ công
Supabase từng thiếu:
- `User.last_freeze_reminder_date`
- `StreakFreeze`
- `FreezeToken`

Các phần thiếu đã được thêm thủ công bằng SQL để login và Freeze Token hoạt động trở lại.

## 3. Ổn định local dev

### LocalStorage
`authStore` phải đọc `localStorage.user` bằng try/catch. Nếu JSON hỏng:
- xóa stored tokens;
- xóa `user`;
- xóa `onboarding_completed`;
- set trạng thái chưa đăng nhập.

### Service worker
Trên `localhost`:
- `main.tsx` không đăng ký service worker production.
- `sw.js` tự xóa cache và unregister.
- Fetch handler không intercept request local.

Lý do: service worker cũ có thể cache app shell/JS lỗi và gây trắng trang dù server vẫn trả HTTP 200.

## 4. Các việc còn thiếu

### Migration
- Cần tạo migration chính thức cho Streak Freeze.
- Không nên chỉ dựa vào SQL thủ công trên Supabase.

### Backend validation
- Cần enforce giờ mở Freeze Token ở backend nếu không muốn người dùng gọi API trực tiếp trước giờ.
- Cần kiểm tra timezone khi enforce giờ để dùng timezone của user, không dùng timezone server.

### i18n
- Freeze Token còn một số copy tiếng Anh/hardcoded.
- AI Coach copy fallback cần đưa đầy đủ vào từ điển `vi/en`.

### QA
- Cần test lại trên mobile BottomNav.
- Cần test khi service worker cũ đã tồn tại trong browser.
- Cần test với user mới hoàn toàn và user cũ đã có goals/streak.
- Cần test deploy mới từ DB rỗng.

## 5. Bảo mật

Các secret đã từng xuất hiện trong chat nên cần rotate nếu là key thật:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `VAPID_PRIVATE_KEY`

Không commit `.env` hoặc log chứa secret.

