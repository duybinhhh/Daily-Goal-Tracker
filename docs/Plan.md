# 🗺️ PROJECT PLAN: DAILY GOAL TRACKER (MVP)

## 1. Stack & Kiến Trúc Hiện Tại (Core Context)
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + React Router v6.
- **Backend**: Node.js + Express + TypeScript (chạy qua `tsx`).
- **Database**: Sử dụng **PostgreSQL (Supabase)** thông qua **Prisma ORM**.
- **Auth**: JWT (Access Token 15 phút + Refresh Token 7 ngày với cơ chế tự động xoay vòng qua Axios Interceptors).
- **Timezone-Safe Streak & Cycle Resets**: Tự động tính toán khoảng cách ngày an toàn theo múi giờ của người dùng (`getCalendarDaysDiffTimezone`) nhằm tránh lỗi mất streak do lệch múi giờ với server. Tích hợp công cụ `syncAndResetGoalProgress` tự động reset tiến độ (`current_count` và `status`) khi chuyển chu kỳ mới (ngày/tuần/tháng) dựa trên múi giờ tài khoản. Tích hợp tính năng **Nhắc nhở chủ động chống đứt chuỗi (Active Reminders)** gửi thông báo đẩy lúc 21h00 tối hàng ngày theo múi giờ địa phương nếu người dùng còn thói quen hàng ngày chưa hoàn thành.
- **Offline & PWA**: Biến ứng dụng thành Progressive Web App (PWA) qua tệp `manifest.json` và Service Worker `sw.js`. Caching dữ liệu thói quen và lưu hàng đợi check-in offline thông qua **IndexedDB** dưới trình duyệt, tự động đồng bộ hóa lên server khi phát hiện kết nối mạng được khôi phục. *Cập nhật tính năng an toàn*: Bảo vệ quá trình đồng bộ hóa đa tab bằng **Web Locks API** (hỗ trợ fallback LocalStorage Lock) để loại bỏ race conditions; sử dụng client-side UUID (`log_id`) làm Primary Key của bản ghi `GoalLog` trên database để đảm bảo tính idempotency và triệt tiêu trùng lặp log; tích hợp guard `completing` phía UI để tránh click dồn dập; luôn hợp nhất `syncQueue` vào dữ liệu fetch từ server để giao diện hiển thị mượt mà không bị giật lùi dữ liệu cũ.
- **Accountability Partners & Social Sharing**: Cho phép tạo và gia nhập nhóm thói quen chung. Khi gia nhập, một `Goal` cục bộ liên kết với nhóm (`group_id`) tự động được tạo để theo dõi tiến độ, tích hợp trực tiếp với PWA Offline Mode. Thiết kế Share Modal vẽ thẻ vinh danh (Breakthrough Badge) và lưới hoạt động (Consistency Heatmap) động trên **HTML5 Canvas** (1200x630px), hỗ trợ tải xuống, Web Share API cục bộ và intent chia sẻ Twitter/Facebook chỉ với một click.

## 2. Định Hướng UI/UX & Hệ Thống Thẩm Mỹ
- **Theme**: Dark mode mặc định (Backdrop: `#020617` Slate-950, Text: `#1e293b` Slate-800).
- **Accent Colors**: 
  - Primary: `#4f46e5` (Indigo-600) | Streak/Fire: `#f97316` (Orange-500)
  - Success: `#10b981` (Emerald-500) | Warning: `#f59e0b` (Amber-500) | Danger: `#f43f5e` (Rose-500)
- **Style**: Thiết kế dạng Glassmorphism (nền mờ, viền bán trong suốt). Font **Inter** cho body và **Space Grotesk** cho tiêu đề.
- **Chuyển động**: Sử dụng thư viện `motion` (Framer Motion) tạo micro-interactions (hiệu ứng nảy số, streak lửa nảy lên, tiến độ chạy mượt) khi hoàn thành mục tiêu.
- **Nguyên tắc**: Không viết code giả hoặc placeholder (`// TODO`). Dữ liệu mẫu (Seed data) phải trực quan.

## 3. Bản Đồ Màn Hình & API Endpoints (MVP Scope)

### 3.1. Danh Sách 8 Màn Hình Chính
1. **Home / Dashboard (`/`)**: Giao diện hiển thị danh sách 3 mục tiêu ngày (Max 3 Goals), thanh kéo lịch tuần 7 ngày (Weekly Slider Grid), bộ lọc danh mục và vòng tròn tiến độ. *Cập nhật:* Ẩn các mục tiêu đã hoàn thành, tích hợp hiệu ứng đếm ngược biến mất 5 giây kèm nút hoàn tác (Undo) trực tiếp trên thẻ để tránh bấm nhầm. Tích hợp huy hiệu trạng thái mạng kính mờ ("Offline Mode" màu cam, "Syncing..." màu xanh lá) trực quan trên Header. Hiển thị nhãn `👥 Group Habit` trên các thẻ mục tiêu thuộc nhóm thói quen.
2. **Chi tiết danh sách mục tiêu (`/goals`)**: Giao diện bento-grid hiển thị toàn bộ danh sách mục tiêu chi tiết, tích hợp tìm kiếm, bộ lọc trạng thái (Active/Paused/All), danh mục và sắp xếp (Priority/Recent/Streak). Hỗ trợ Log tiến độ nhanh, Popup Menu hành động (Pause/Resume, Edit, Delete) và Vòng tròn tổng quan (Overall Completion SVG Ring).
3. **Tạo mục tiêu (`/new-goal`)**: Form tạo thói quen trong 30 giây (Nhị phân hoặc Số lượng định lượng như cốc nước, km). *Cập nhật:* Sử dụng màu sắc ngữ nghĩa tương thích động với giao diện Sáng/Tối.
4. **Chỉnh sửa mục tiêu (`/edit-goal/:id`)**: Giao diện cập nhật thông tin mục tiêu thói quen.
5. **Lịch sử & Thống kê (`/stats`)**: Bento metrics (Tỷ lệ hoàn thành %, so sánh xu hướng tăng trưởng tháng trước) + Biểu đồ cột hiệu năng 10 tuần gần nhất + GitHub-style Activity Heatmap (180 ngày) + Biểu đồ tròn Donut chia tỉ lệ thói quen + Milestones feed và xuất dữ liệu CSV nhanh trên header. Tích hợp nút **Share** cạnh tiêu đề Heatmap và trên từng Milestone Card để kích hoạt Share Modal.
6. **Trục thời gian hoạt động (`/timeline`)**: Lưới ô hiệu năng tháng (Performance Grid) tích hợp chấm xanh/sao vàng, feed hoạt động lọc động, nút xóa log lịch sử (Delete log) và xuất báo cáo CSV.
7. **Cài đặt (`/settings`)**: Hồ sơ cá nhân (Múi giờ, Tên), công tắc bật hiệu ứng chúc mừng (Confetti) và Danger Zone (Xóa dữ liệu). *Cập nhật:* Mặc định khởi tạo giao diện Light Theme và thiết kế thanh tác vụ Lưu/Hủy dưới dạng Sticky Floating Bar nổi cố định ở cuối trang. Tích hợp công tắc bật/tắt **Nhắc nhở chủ động (Active Reminders)** chống đứt chuỗi (xin quyền thông báo của trình duyệt và đồng bộ subscription lên DB).
8. **Đồng đội giám sát & Nhóm thói quen (`/groups`)**: Hiển thị danh sách các nhóm thói quen đang tham gia (My Groups) và danh sách nhóm có sẵn để khám phá (Discover). Hỗ trợ form tạo nhóm thói quen chung. Bảng chi tiết nhóm hiển thị thông tin mục tiêu chung và **Bảng tiến trình thành viên (Leaderboard)** thể hiện tiến độ hôm nay, trạng thái hoàn thành và chuỗi ngày Streak của từng thành viên. Hỗ trợ nút Check-in nhanh, sao chép link mời và nút Share khoe thành tích nhóm.

### 3.2. Giao diện API Endpoints (MVP Scope)
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `PUT /api/auth/profile` (cập nhật thông tin cá nhân), `DELETE /api/auth/profile` (xóa tài khoản vĩnh viễn), `PUT /api/auth/push-subscription` (đăng ký/hủy thông báo đẩy), `GET /api/auth/vapid-public-key` (lấy khóa công khai VAPID).
- **Goals**: `GET /api/goals` (lọc theo status/category), `POST /api/goals`, `GET /api/goals/:id`, `PUT /api/goals/:id`, `DELETE /api/goals/:id`, `POST /api/goals/:id/complete` (Tăng tiến độ/Ghi log/Tính streak, hỗ trợ truyền tham số `completed_at` tùy chọn từ body để ghi nhận đúng ngày giờ check-in offline), `DELETE /api/goals/logs/:logId` (Xóa log và tự động tính lại Streak).
- **Stats**: `GET /api/stats/dashboard` (bento data), `GET /api/stats/history?from=&to=` (heatmap data).
- **Groups**: `GET /api/groups` (danh sách tất cả nhóm), `POST /api/groups` (tạo nhóm thói quen), `GET /api/groups/:id` (lấy chi tiết nhóm và bảng tiến độ thành viên), `POST /api/groups/:id/join` (gia nhập nhóm), `POST /api/groups/:id/leave` (rời nhóm), `DELETE /api/groups/:id` (xóa nhóm).
