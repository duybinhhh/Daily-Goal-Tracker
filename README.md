# 🎯 Daily Goal Tracker

Ứng dụng theo dõi và quản lý mục tiêu cá nhân hàng ngày, giúp duy trì kỷ luật bản thân bằng cách thiết lập thói quen, theo dõi tiến độ, tính toán chuỗi ngày liên tục (**Streak**) và hiển thị thống kê trực quan.

---

## 🌟 Điểm nổi bật & Thiết kế (Design Aesthetics)

*   **Premium & Modern UI/UX**: Thiết kế mặc định Dark mode sang trọng với nền Slate-950 và các màu sắc nhấn bắt mắt (Indigo, Emerald, Orange).
*   **Glassmorphism Style**: Các thẻ mục tiêu, bảng biểu được thiết kế theo phong cách kính mờ bán trong suốt thời thượng.
*   **Micro-interactions**: Sử dụng chuyển động mượt mà (thông qua thư viện `motion`) để phản hồi tức thì các thao tác của người dùng như hoàn thành mục tiêu, nảy số lượng hay nảy ngọn lửa Streak.
*   **Hiệu năng & Tiện lợi**: Không sử dụng PostgreSQL cồng kềnh cho chạy thử cục bộ; dự án tự động ghi/đọc dữ liệu vào một tệp JSON cục bộ giả lập Prisma Client giúp khởi chạy nhanh chóng chỉ trong vài giây.

---

## 🚀 Các Tính Năng Core MVP

1.  **Quản lý mục tiêu cá nhân**: Tạo mới, chỉnh sửa, xem danh sách mục tiêu dạng thẻ ([GoalCard](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx)) kèm bộ lọc trạng thái (Active / Completed / Paused). Áp dụng cơ chế **Soft Delete** để bảo toàn lịch sử thống kê.
2.  **Đánh dấu tiến độ ngày (Check-in)**: Tăng nhanh chỉ số hoàn thành mục tiêu trực tiếp từ Dashboard, tự động lưu vết mốc thời gian chính xác trong cơ sở dữ liệu.
3.  **Thuật toán tính chuỗi ngày liên tục (Streak Engine)**: Tự động tính toán và lưu trữ `current_streak` và `longest_streak` cho mỗi mục tiêu thói quen ngay khi người dùng ghi nhận tiến độ.
4.  **Dashboard & Bento-style Analytics**: Hiển thị tổng quan tiến độ hoàn thành trong ngày dưới dạng phần trăm, lịch tuần dạng slider 7 ngày, kèm theo biểu đồ cột/đường trực quan và Heatmap 28 ngày hoạt động dạng đóng góp (GitHub-style contribution chart).
5.  **Hệ thống xác thực JWT an toàn**: Quản lý đăng ký, đăng nhập và đăng xuất. Quản lý Token tự động qua Axios Interceptor trên Client và cơ chế tự refresh token ngầm khi Access Token hết hạn.

---

## 💻 Tech Stack

*   **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + React Router v6.
*   **Backend**: Node.js + Express + TypeScript (chạy qua `tsx`).
*   **Database (Dev)**: Local File Database (JSON) được quản lý qua [db.ts](file:///d:/Download/daily-goal-tracker/server/db.ts) lưu tại `data/db.json` nhằm mô phỏng chính xác mô hình dữ liệu của [schema.prisma](file:///d:/Download/daily-goal-tracker/prisma/schema.prisma) mà không cần cấu hình database phức tạp.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
daily-goal-tracker/
├── assets/                 # Các tài nguyên tĩnh và cấu hình AI Studio
├── data/                   # Thư mục chứa cơ sở dữ liệu cục bộ db.json
├── docs/                   # Tài liệu chi tiết dự án
│   ├── ARCHITECTURE.md     # Đặc tả kiến trúc phần mềm & schema db
│   ├── CHANGELOG.md        # Nhật ký phát triển và danh sách các Sprint
│   ├── Plan.md             # Kế hoạch phát triển và thiết kế giao diện
│   └── SPEC.md             # Tài liệu đặc tả sản phẩm & User Stories
├── prisma/                 # Cấu hình schema PostgreSQL (cho giai đoạn production)
├── server/                 # Tầng Database Client giả lập lưu file
│   └── db.ts
├── src/                    # Mã nguồn chính của ứng dụng
│   ├── components/         # Các Component giao diện tái sử dụng
│   ├── controllers/        # Logic điều khiển API backend
│   ├── hooks/              # Custom React hooks
│   ├── middleware/         # Các middleware trung gian (Error Handler, Auth Guard)
│   ├── pages/              # Các màn hình chính (Dashboard, Login, Goal Form, Stats)
│   ├── routes/             # Định tuyến API endpoint
│   ├── services/           # Service gọi API (Axios Interceptors)
│   ├── store/              # Zustand state stores (authStore, goalStore)
│   ├── App.tsx             # Component gốc định nghĩa định tuyến
│   ├── main.tsx            # Điểm khởi chạy React client
│   └── index.css           # Cấu hình Tailwind CSS v4
├── server.ts               # File khởi chạy server Express chính
├── tsconfig.json           # Cấu hình TypeScript compiler
└── vite.config.ts          # Cấu hình đóng gói Vite
```

---

## ⚙️ Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 1. Chuẩn bị
Đảm bảo máy tính của bạn đã cài đặt **Node.js** (Khuyên dùng v18 trở lên).

### 2. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc bằng cách sao chép từ [.env.example](file:///d:/Download/daily-goal-tracker/.env.example):
```bash
cp .env.example .env
```
Mở file `.env` và điền khóa API của bạn:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
APP_URL="http://localhost:5173"
```

### 3. Cài đặt các thư viện
```bash
npm install
```

### 4. Khởi động máy chủ phát triển
Chạy lệnh bên dưới để khởi động đồng thời cả server frontend Vite và server backend Express:
```bash
npm run dev
```
Truy cập vào ứng dụng tại địa chỉ: `http://localhost:5173`.

---

## 📚 Tài Liệu Hướng Dẫn Kèm Theo

Để hiểu rõ hơn về các khía cạnh thiết kế và lịch trình của dự án, vui lòng đọc các tài liệu chi tiết trong thư mục `docs/`:

*   [ARCHITECTURE.md](file:///d:/Download/daily-goal-tracker/docs/ARCHITECTURE.md) - Chi tiết sơ đồ dữ liệu, API flow và cấu trúc tầng dịch vụ.
*   [SPEC.md](file:///d:/Download/daily-goal-tracker/docs/SPEC.md) - Toàn bộ yêu cầu chi tiết về tính năng, User Stories và bộ tiêu chí AC.
*   [CHANGELOG.md](file:///d:/Download/daily-goal-tracker/docs/CHANGELOG.md) - Ghi nhận tiến độ qua các Sprint phát triển.
*   [Plan.md (docs)](file:///d:/Download/daily-goal-tracker/docs/Plan.md) hoặc [Plan.md (gốc)](file:///d:/Download/daily-goal-tracker/Plan.md) - Kế hoạch thiết kế UI/UX bento-grid và sơ đồ phân bổ các view.
