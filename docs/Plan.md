# 🗺️ PROJECT PLAN: DAILY GOAL TRACKER (MVP)

## 1. Stack & Kiến Trúc Hiện Tại (Core Context)
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + React Router v6.
- **Backend**: Node.js + Express + TypeScript (chạy qua `tsx`).
- **Database**: Sử dụng **Local File Database** (JSON) qua file `server/db.ts` lưu tại `data/db.json` để giả lập Prisma client. *Tuyệt đối không dùng PostgreSQL hay chạy Prisma migrate trong giai đoạn này.*
- **Auth**: JWT (Access Token 15 phút + Refresh Token 7 ngày với cơ chế tự động xoay vòng qua Axios Interceptors).

## 2. Định Hướng UI/UX & Hệ Thống Thẩm Mỹ
- **Theme**: Dark mode mặc định (Backdrop: `#020617` Slate-950, Text: `#1e293b` Slate-800).
- **Accent Colors**: 
  - Primary: `#4f46e5` (Indigo-600) | Streak/Fire: `#f97316` (Orange-500)
  - Success: `#10b981` (Emerald-500) | Warning: `#f59e0b` (Amber-500) | Danger: `#f43f5e` (Rose-500)
- **Style**: Thiết kế dạng Glassmorphism (nền mờ, viền bán trong suốt). Font **Inter** cho body và **Space Grotesk** cho tiêu đề.
- **Chuyển động**: Sử dụng thư viện `motion` (Framer Motion) tạo micro-interactions (hiệu ứng nảy số, streak lửa nảy lên, tiến độ chạy mượt) khi hoàn thành mục tiêu.
- **Nguyên tắc**: Không viết code giả hoặc placeholder (`// TODO`). Dữ liệu mẫu (Seed data) phải trực quan.

## 3. Bản Đồ Màn Hình & API Endpoints (MVP Scope)

### 3.1. Danh Sách 7 Màn Hình Chính
1. **Home / Dashboard (`/`)**: Giao diện hiển thị danh sách 3 mục tiêu ngày (Max 3 Goals), thanh kéo lịch tuần 7 ngày (Weekly Slider Grid), bộ lọc danh mục và vòng tròn tiến độ. *Cập nhật:* Ẩn các mục tiêu đã hoàn thành, tích hợp hiệu ứng đếm ngược biến mất 5 giây kèm nút hoàn tác (Undo) trực tiếp trên thẻ để tránh bấm nhầm.
2. **Chi tiết danh sách mục tiêu (`/goals`)**: Giao diện bento-grid hiển thị toàn bộ danh sách mục tiêu chi tiết, tích hợp tìm kiếm, bộ lọc trạng thái (Active/Paused/All), danh mục và sắp xếp (Priority/Recent/Streak). Hỗ trợ Log tiến độ nhanh, Popup Menu hành động (Pause/Resume, Edit, Delete) và Vòng tròn tổng quan (Overall Completion SVG Ring).
3. **Tạo mục tiêu (`/new-goal`)**: Form tạo thói quen trong 30 giây (Nhị phân hoặc Số lượng định lượng như cốc nước, km). *Cập nhật:* Sử dụng màu sắc ngữ nghĩa tương thích động với giao diện Sáng/Tối.
4. **Chỉnh sửa mục tiêu (`/edit-goal/:id`)**: Giao diện cập nhật thông tin mục tiêu thói quen.
5. **Lịch sử & Thống kê (`/stats`)**: Bento metrics (Tỷ lệ hoàn thành %, so sánh xu hướng tăng trưởng tháng trước) + Biểu đồ cột hiệu năng 10 tuần gần nhất + GitHub-style Activity Heatmap (180 ngày) + Biểu đồ tròn Donut chia tỉ lệ thói quen + Milestones feed và xuất dữ liệu CSV nhanh trên header.
6. **Trục thời gian hoạt động (`/timeline`)**: Lưới ô hiệu năng tháng (Performance Grid) tích hợp chấm xanh/sao vàng, feed hoạt động lọc động, nút xóa log lịch sử (Delete log) và xuất báo cáo CSV.
7. **Cài đặt (`/settings`)**: Hồ sơ cá nhân (Múi giờ, Tên), công tắc bật hiệu ứng chúc mừng (Confetti) và Danger Zone (Xóa dữ liệu). *Cập nhật:* Mặc định khởi tạo giao diện Light Theme và thiết kế thanh tác vụ Lưu/Hủy dưới dạng Sticky Floating Bar nổi cố định ở cuối trang.

### 3.2. Hệ Thống API Hệ Mặt Đất (Endpoints)
- **Auth**: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `PUT /api/auth/profile` (cập nhật thông tin cá nhân), `DELETE /api/auth/profile` (xóa tài khoản vĩnh viễn).
- **Goals**: `GET /api/goals` (lọc theo status/category), `POST /api/goals`, `GET /api/goals/:id`, `PUT /api/goals/:id`, `DELETE /api/goals/:id`, `POST /api/goals/:id/complete` (Tăng tiến độ/Ghi log/Tính streak), `DELETE /api/goals/logs/:logId` (Xóa log và tự động tính lại Streak).
- **Stats**: `GET /api/stats/dashboard` (bento data), `GET /api/stats/history?from=&to=` (heatmap data).

