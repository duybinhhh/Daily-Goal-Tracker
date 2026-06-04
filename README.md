# 🎯 Momentum: Daily Goal Tracker (Premium Edition)

Ứng dụng theo dõi và quản lý mục tiêu cá nhân hàng ngày cao cấp, giúp người dùng duy trì kỷ luật bản thân bằng cách xây dựng thói quen tốt, theo dõi tiến độ thời gian thực, tính toán chuỗi ngày liên tục (**Streak**) và trực quan hóa hiệu suất thông qua bảng phân tích Bento-grid hiện đại.

---

## 🌟 Các Tính Năng Cao Cấp & Trải Nghiệm Người Dùng (Premium UI/UX)

1. **Giao Diện Momentum Theme Đa Dạng (Light & Dark Theme)**:
   - Hệ thống giao diện Light/Dark linh hoạt được lưu trữ tự động trong `localStorage`. Light theme là chế độ hiển thị mặc định dịu mắt khi truy cập lần đầu.
   - Thiết kế **Glassmorphism** thời thượng với các lớp phủ kính mờ bán trong suốt, hỗ trợ tinh chỉnh độ mờ đục (**Glass Opacity**) và bật/tắt hiệu ứng chuyển động mượt mà.
   - Thanh tác vụ nổi cố định ở cuối màn hình (**Sticky Floating Action Bar**) giúp lưu/hủy các tùy chọn cài đặt một cách nhanh chóng và tự nhiên.
2. **Dashboard Hoàn Thiện & Cơ Chế Hoàn Tác Thông Minh (Undo Engine)**:
   - Hiển thị tiến trình hoàn thành trong ngày bằng vòng tròn tiến độ SVG và slider lịch tuần 7 ngày.
   - **Tự động ẩn mục tiêu hoàn thành**: Khi thói quen đạt chỉ tiêu trong ngày, thẻ sẽ hiển thị đếm ngược 5 giây kèm nút **Undo** hoàn tác trước khi tự động ẩn đi, giúp giảm tải thông tin trên màn hình chính.
3. **Danh Sách Mục Tiêu Chi Tiết (My Goals - `/goals`)**:
   - Giao diện Bento Grid hiển thị tất cả mục tiêu với chức năng tìm kiếm trực quan và lọc nhanh theo trạng thái (Tất cả / Hoạt động / Tạm dừng).
   - Bộ sắp xếp nâng cao theo độ ưu tiên (**Priority**), thời gian cập nhật (**Recent**), hoặc chuỗi ngày liên tục (**Streak**).
   - Menu hành động nhanh cho phép Tạm dừng/Kích hoạt lại, Chỉnh sửa, và Xóa thói quen trực tiếp trên thẻ.
4. **Bảng Thống Kê Momentum (Premium Stats Dashboard - `/stats`)**:
   - **Aligned Header**: Tích hợp thanh tiêu đề chứa ô tìm kiếm cột mốc, huy hiệu chuỗi ngày Streak động toàn cục, nút xuất báo cáo CSV và làm mới dữ liệu nhanh.
   - **Bento Grid Metric**: Hiển thị tổng quan tỷ lệ hoàn thành kèm so sánh xu hướng tăng trưởng (+/- %) so với tháng trước.
   - **Consistency Heatmap (182 ngày)**: Lưới đóng góp 26 tuần (GitHub-style contribution chart) căn chỉnh ngày bắt đầu về Chủ Nhật, hiển thị chi tiết khi rê chuột.
   - **Biểu Đồ Xu Hướng 10 Tuần**: Nhóm dữ liệu tiến độ 70 ngày gần nhất vẽ biểu đồ cột CSS động tự điều chỉnh chiều cao và hiển thị tooltip.
   - **Biểu Đồ Tròn Goal Distribution**: Sử dụng `conic-gradient` chia tỷ lệ mục tiêu theo danh mục kèm bảng chú thích màu sắc động.
   - **Milestone Feed**: Dòng thời gian ghi nhận các cột mốc thành tựu thói quen (ví dụ: "Achiever Elite Tier Unlocked").
5. **Trục Thời Gian Hoạt Động (Activity Timeline - `/timeline`)**:
   - **Performance Grid**: Hiển thị trạng thái hoàn thành mỗi ngày trong tháng, tự động đánh dấu sao vàng lấp lánh (Breakthrough Badge) cho những ngày đạt năng suất cao (từ 3 thói quen trở lên).
   - **Feed Hoạt Động Lọc Động**: Click chọn ngày bất kỳ trên lưới để xem chi tiết các check-in của ngày đó.
   - **Xóa Check-in & Tự Động Tính Lại Streak**: Cho phép xóa log check-in cũ. Khi xóa, backend tự động tính toán lại chuỗi Streak dựa trên múi giờ người dùng.
   - **Xuất báo cáo CSV**: Cho phép tải xuống báo cáo hoạt động dạng bảng tính CSV trực tiếp về trình duyệt.
6. **Hệ Thống Streak Engine & Timezone-Aware**:
   - Thuật toán tự động nhóm log theo ngày địa phương dựa trên `timezone` của người dùng để xác định chuỗi ngày hiện tại (`current_streak`) và chuỗi kỷ lục (`longest_streak`).
   - Cung cấp tính năng cập nhật Profile (Tên, Email, Múi giờ) và Danger Zone (Xuất dữ liệu cá nhân dạng JSON, Xóa tài khoản vĩnh viễn).

---

## 💻 Tech Stack

* **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + React Router v6.
* **Backend**: Node.js + Express + TypeScript (chạy qua `tsx`).
* **Database (Chạy thử cục bộ)**: Local File Database (JSON) được quản lý qua `server/db.ts` lưu tại `data/db.json` nhằm mô phỏng chính xác mô hình dữ liệu của Prisma mà không cần cấu hình database phức tạp.
* **Database (Sản xuất)**: PostgreSQL được cấu hình qua Prisma ORM (`prisma/schema.prisma`).
* **Authentication**: JWT (Access Token 15 phút + Refresh Token 7 ngày) kèm cơ chế Axios Interceptors tự động làm mới phiên làm việc.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
daily-goal-tracker/
├── assets/                 # Tài nguyên tĩnh và cấu hình AI Studio
├── data/                   # Thư mục chứa cơ sở dữ liệu cục bộ db.json
├── docs/                   # Hệ thống tài liệu chi tiết dự án
│   ├── ARCHITECTURE.md     # Đặc tả kiến trúc phần mềm, schema database & data flow
│   ├── CHANGELOG.md        # Nhật ký phát triển chi tiết qua từng Sprint
│   ├── Plan.md             # Kế hoạch phát triển, màu sắc tokens & phân bổ UI/UX
│   ├── SPEC.md             # Tài liệu đặc tả sản phẩm & User Stories (AC)
│   └── VIBE_PROCESS_VERIFICATION.md # Tài liệu chứng minh quy trình kiểm thử 4 bước
├── prisma/                 # Cấu hình schema PostgreSQL (cho môi trường production)
├── server/                 # Database Wrapper giả lập lưu file JSON
│   └── db.ts
├── src/                    # Mã nguồn chính của ứng dụng
│   ├── components/         # Các Component giao diện tái sử dụng
│   │   ├── ui/             # Các UI elements dùng chung (Button, Card, Input, ProgressBar)
│   │   ├── GoalCard.tsx    # Component thẻ mục tiêu với bộ đếm ngược Undo
│   │   ├── Navbar.tsx      # Thanh điều hướng ngang
│   │   └── Sidebar.tsx     # Thanh điều hướng dọc chứa Avatar và Streak badge
│   ├── controllers/        # Logic xử lý API ở phía backend
│   ├── hooks/              # Custom React hooks (quản lý truy vấn dữ liệu)
│   ├── middleware/         # Middleware trung gian (Auth Guard, Error Handler)
│   ├── pages/              # Các màn hình chính của ứng dụng
│   │   ├── DashboardPage.tsx # Màn hình chính trong ngày
│   │   ├── GoalFormPage.tsx  # Biểu mẫu tạo mới mục tiêu thói quen
│   │   ├── GoalsPage.tsx     # Quản lý tất cả mục tiêu thói quen (Bento Grid)
│   │   ├── LoginPage.tsx     # Trang Đăng nhập & Đăng ký
│   │   ├── SettingsPage.tsx  # Trang cấu hình Theme, Glass Opacity, Timezone & Danger Zone
│   │   ├── Stats.tsx         # Bảng thống kê hiệu năng Momentum chi tiết
│   │   └── TimelinePage.tsx  # Nhật ký hoạt động, Performance Grid & xuất CSV
│   ├── routes/             # Định tuyến API endpoint phía backend
│   ├── services/           # Services gọi API & cấu hình Axios Interceptors
│   ├── store/              # Zustand state stores (authStore, goalStore)
│   ├── App.tsx             # Component gốc định nghĩa định tuyến và cấu hình theme
│   ├── main.tsx            # Điểm khởi chạy React client
│   ├── types.ts            # Định nghĩa các TypeScript interfaces dùng chung
│   └── index.css           # Định nghĩa các CSS variables, Light Mode & glassmorphism
├── server.ts               # File khởi chạy máy chủ Express
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
Mở file `.env` và điền thông tin cấu hình:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
APP_URL="http://localhost:5173"
```

### 3. Cài đặt các thư viện
```bash
npm install
```

### 4. Khởi động máy chủ phát triển
Chạy lệnh bên dưới để khởi động đồng thời cả frontend Vite và backend Express:
```bash
npm run dev
```
Truy cập vào ứng dụng tại địa chỉ: `http://localhost:5173`.

---

## 📚 Tài Liệu Hướng Dẫn Kèm Theo

Để hiểu rõ hơn về các khía cạnh thiết kế và lịch trình của dự án, vui lòng đọc các tài liệu chi tiết trong thư mục `docs/`:

* [ARCHITECTURE.md](file:///d:/Download/daily-goal-tracker/docs/ARCHITECTURE.md) - Sơ đồ cấu trúc cơ sở dữ liệu, API flow và luồng hoạt động.
* [SPEC.md](file:///d:/Download/daily-goal-tracker/docs/SPEC.md) - Yêu cầu chi tiết tính năng, User Stories và tiêu chí chấp nhận (AC).
* [CHANGELOG.md](file:///d:/Download/daily-goal-tracker/docs/CHANGELOG.md) - Tiến trình phát triển sản phẩm qua từng giai đoạn/Sprint.
* [Plan.md](file:///d:/Download/daily-goal-tracker/docs/Plan.md) - Sơ đồ màn hình và hệ thống tokens màu sắc.
* [VIBE_PROCESS_VERIFICATION.md](file:///d:/Download/daily-goal-tracker/docs/VIBE_PROCESS_VERIFICATION.md) - Quy trình kiểm thử và nghiệm thu thực tế các tính năng.
