# Streak Freeze Testing Guide

Tài liệu này ghi lại cách test chức năng đóng băng streak trong Daily Goal Tracker.

## 1. Điều kiện nút `Protect Streak` hiển thị

Nút đóng băng chỉ hiện khi tất cả điều kiện sau đúng:

- Người dùng đã đăng nhập.
- Goal chưa hoàn thành trong ngày hiện tại.
- Goal có `current_streak > 0`.
- Đã tới giờ mở tính năng.
- User còn Freeze Token trong tháng.

Trong code hiện tại, điều kiện nằm ở `src/components/GoalCard.tsx`.

## 2. Đổi giờ mở để test lúc 13:30

Tìm đoạn logic giờ trong `GoalCard.tsx`. Nếu đang là:

```ts
const currentHour = new Date().getHours();
const showFreezeButton = currentHour >= 18 && !isCompleted && currentStreak > 0;
```

Đổi thành:

```ts
const now = new Date();
const currentMinutes = now.getHours() * 60 + now.getMinutes();
const freezeStartMinutes = 13 * 60 + 30;

const showFreezeButton =
  currentMinutes >= freezeStartMinutes && !isCompleted && currentStreak > 0;
```

Sau khi test xong, có thể đổi lại mốc giờ mong muốn cho production.

## 3. Test trên giao diện

1. Đăng nhập vào app.
2. Chọn một goal đang có streak lớn hơn 0.
3. Không bấm check-in goal đó trong ngày test.
4. Đảm bảo giờ hiện tại đã qua mốc mở tính năng.
5. Mở Dashboard hoặc Goals.
6. Bấm `Protect Streak`.

Kết quả đúng:

- Nút chuyển sang trạng thái protected.
- Token giảm đi 1.
- Ngày hiện tại được lưu vào `StreakFreeze`.
- Nếu bấm lại cùng goal cùng ngày, hệ thống báo goal đã được đóng băng hôm nay.

## 4. Test bằng API

### 4.1. Lấy token đăng nhập

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "EMAIL",
  "password": "PASSWORD"
}
```

Lấy `accessToken` từ response.

### 4.2. Xem số Freeze Token còn lại

```http
GET http://localhost:3000/api/freeze/tokens
Authorization: Bearer ACCESS_TOKEN
```

Kết quả đúng:

```json
{
  "success": true,
  "tokens_left": 3,
  "month_year": "2026-06"
}
```

### 4.3. Dùng token để đóng băng goal

```http
POST http://localhost:3000/api/freeze/activate
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "goal_id": "GOAL_ID"
}
```

Kết quả đúng:

```json
{
  "success": true,
  "tokens_left": 2,
  "frozen_date": "2026-06-09"
}
```

### 4.4. Xem ngày đã đóng băng của một goal

```http
GET http://localhost:3000/api/freeze/dates?goal_id=GOAL_ID
Authorization: Bearer ACCESS_TOKEN
```

### 4.5. Xem tất cả ngày đã đóng băng của user

```http
GET http://localhost:3000/api/freeze/dates?all=true
Authorization: Bearer ACCESS_TOKEN
```

## 5. Các case cần test

- Goal có streak > 0, chưa hoàn thành hôm nay, còn token: dùng token thành công.
- Goal streak = 0: UI không hiện nút.
- Goal đã hoàn thành hôm nay: UI không hiện nút, API nên báo không cần token.
- Dùng lại token cho cùng goal cùng ngày: API báo đã đóng băng hôm nay.
- Dùng hết 3 token: lần tiếp theo API báo hết token.
- Sang tháng mới: token reset lại 3.
- Ngày đóng băng xuất hiện đúng ở Stats/Timeline.

## 6. Lưu ý kỹ thuật

- UI đang kiểm tra giờ mở tính năng.
- Backend hiện chưa enforce giờ mở tính năng trong `/api/freeze/activate`.
- Nếu muốn chống bypass API, cần thêm kiểm tra giờ ở `src/controllers/freezeController.ts`.
- DB bắt buộc phải có:
  - cột `User.last_freeze_reminder_date`;
  - bảng `StreakFreeze`;
  - bảng `FreezeToken`.

