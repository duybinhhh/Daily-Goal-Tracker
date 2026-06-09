# Recent Changes and Missing Information - 2026-06-09

Tài liệu này tổng hợp các thay đổi đã thực hiện trong phiên làm việc ngày 2026-06-09 và các thông tin còn thiếu/cần hoàn thiện.

## 1. Các thay đổi đã thực hiện

### 1.1. Chức năng chọn ngôn ngữ
- Thêm hệ thống i18n bằng React Context và hook `useTranslation`.
- Thêm từ điển tiếng Việt và tiếng Anh trong `src/i18n`.
- Thêm `LanguageSwitcher` để dùng ở Login và Settings.
- Lưu lựa chọn ngôn ngữ vào `localStorage` với key `setting_language`.
- Đồng bộ `html lang` và fallback về tiếng Việt nếu key dịch thiếu.

### 1.2. AI Coach
- Thêm drawer AI Coach mở từ Sidebar và BottomNav.
- Thêm Zustand store `aiCoachStore` để điều khiển mở/đóng drawer.
- Thêm component `AICoachDrawer`.
- Thêm backend controller và route AI:
  - `POST /api/ai/report`
  - `POST /api/ai/chat`
- Gọi Gemini ở phía server để không lộ `GEMINI_API_KEY` ra client.
- Thêm fallback khi Gemini lỗi quota, timeout, thiếu key hoặc không kết nối được.

### 1.3. Streak Freeze / Freeze Token
- Thêm model Prisma:
  - `StreakFreeze`
  - `FreezeToken`
- Thêm cột `User.last_freeze_reminder_date`.
- Thêm API:
  - `GET /api/freeze/tokens`
  - `POST /api/freeze/activate`
  - `GET /api/freeze/dates`
- Thêm logic dùng Freeze Token để bảo vệ streak khi người dùng bỏ lỡ một ngày.
- Thêm nút `Protect Streak` ở `GoalCard`.
- Thêm hiển thị ngày đóng băng trong thống kê/timeline.
- Thêm nhắc nhở đóng băng streak trong `reminderScheduler`.

### 1.4. Sửa lỗi AI Coach không mở
- Cập nhật `AppLayout` để render AI Coach drawer ở cấp layout.
- Sidebar và BottomNav phát sự kiện mở drawer thay vì điều hướng sang route riêng.
- Drawer hoạt động dạng overlay/drawer nên không làm trắng trang hoặc chuyển route rỗng.

### 1.5. Sửa lỗi màn trắng / không vào được web
- Sửa `authStore` để parse `localStorage.user` an toàn.
- Nếu dữ liệu user trong localStorage bị hỏng JSON, app tự xóa token/user cục bộ và quay về login.
- Tắt đăng ký service worker trên `localhost`.
- Cập nhật `public/sw.js` để service worker trên localhost tự xóa cache, tự unregister và không intercept request.
- Gỡ request Freeze Token tự động ở Sidebar để tránh gọi API phụ khi DB chưa migrate đủ.

### 1.6. Sửa lỗi database operation khi login
- Xác minh DB Supabase thiếu các thành phần mới của Streak Freeze.
- Bổ sung thủ công bằng SQL:
  - `User.last_freeze_reminder_date`
  - bảng `StreakFreeze`
  - bảng `FreezeToken`
- Kiểm tra lại Prisma đọc được user thật.
- Kiểm tra API login trả lỗi auth đúng khi nhập sai mật khẩu, không còn trả lỗi database schema.

## 2. Thông tin còn thiếu / cần hoàn thiện

### 2.1. Migration database
- Chưa có migration file chính thức trong `prisma/migrations` cho phần Streak Freeze.
- DB Supabase đã được bổ sung bằng SQL thủ công, nhưng môi trường mới vẫn có thể thiếu bảng/cột nếu không tạo migration chuẩn.
- Cần tạo migration hoặc script setup DB chính thức để deploy/reproduce ổn định.

### 2.2. Freeze Token
- Điều kiện giờ mở Freeze Token hiện chủ yếu nằm ở UI `GoalCard.tsx`.
- Backend `/api/freeze/activate` chưa enforce giờ mở tính năng, nên gọi API trực tiếp lúc nào cũng có thể dùng token.
- Copy/UI của Freeze Token chưa được i18n đầy đủ.
- Cần test kỹ các case:
  - dùng hết 3 token trong tháng;
  - reset token sang tháng mới;
  - đóng băng cùng goal cùng ngày 2 lần;
  - đóng băng khi goal đã hoàn thành;
  - thống kê/timeline hiển thị ngày frozen đúng.

### 2.3. AI Coach
- Gemini key có thể hợp lệ nhưng vẫn lỗi `429 RESOURCE_EXHAUSTED` nếu không có quota.
- Cần test lại AI Coach bằng key có quota thật.
- Cần cân nhắc lưu log lỗi server-side để phân biệt lỗi quota, timeout, thiếu key, và lỗi mạng.

### 2.4. Bảo mật secret
- Người dùng đã từng paste các biến môi trường nhạy cảm vào chat.
- Nên rotate các key thật nếu đã dùng:
  - `DATABASE_URL`
  - `GEMINI_API_KEY`
  - `VAPID_PRIVATE_KEY`
- Không commit file `.env`.

### 2.5. Service worker và local dev
- Service worker đã được xử lý để tránh cache trên localhost.
- Nếu người dùng vẫn gặp trắng trang, cần clear site data cho `localhost:3000` hoặc hard refresh bằng `Ctrl + F5`.

## 3. Kiểm tra đã chạy
- `npm run lint`: pass.
- `npm run build`: pass.
- `http://localhost:3000/login#/login`: trả HTTP 200 sau khi restart dev server.
- Prisma đọc được user `todien1432@gmail.com` sau khi đồng bộ DB.

