# 🛡️ VIBE PROCESS VERIFICATION: SETTINGS & LIGHT MODE OVERHAUL

Tài liệu này chứng minh và ghi nhận chi tiết quá trình phát triển tính năng mới (**Trang Cài đặt**, **Giao diện Light Mode** và **Đồng bộ Thống kê**) tuân thủ nghiêm ngặt theo quy trình 4 bước chuẩn hóa: **Plan (Lập kế hoạch) -> Doc (Tài liệu hóa) -> Build (Xây dựng) -> Test (Kiểm thử & Nghiệm thu)**.

---

## 1. Plan (Lập kế hoạch thiết kế)
Giai đoạn này xác định mục tiêu, giải pháp kỹ thuật và sơ đồ cấu trúc trước khi can thiệp vào mã nguồn:
*   **Trang Cài đặt**:
    *   Yêu cầu: Cho phép chỉnh sửa thông tin Profile, thiết lập múi giờ, cấu hình thông báo, trích xuất dữ liệu (JSON) và xóa tài khoản vĩnh viễn (Cascade Delete).
    *   Hạ tầng: Thiết kế 2 API mới cho tầng Auth: `PUT /api/auth/profile` và `DELETE /api/auth/profile`.
    *   Tương tác: Tích hợp thanh trượt Glass Opacity tác động trực tiếp vào các biến CSS tùy biến độ mờ theo thời gian thực.
*   **Giao diện Light Mode**:
    *   Ý tưởng: Kế thừa triết lý thiết kế Momentum cao cấp. Sử dụng nền sáng xám dịu mắt (`#f4f6fa`), chữ đen/xám đậm có tương phản cao để khắc phục hoàn toàn hiện tượng chữ bị chìm.
    *   Giải pháp: Tận dụng cơ chế kế thừa biến CSS của Tailwind v4, định nghĩa ghi đè biến trên class `.light` ở tầng gốc `html`.
*   **Trang Thống kê**:
    *   Yêu cầu: Đồng bộ hóa toàn bộ chữ sáng cố định sang chữ ngữ nghĩa. Thiết kế lại lịch hoạt động (heatmap grid) thích ứng nền sáng.

---

## 2. Doc (Tài liệu hóa kỹ thuật)
Các tính năng và luồng xử lý mới được mô tả chi tiết trong hệ thống tài liệu dự án trước khi lập trình:
1.  **Định nghĩa User Stories**: Bổ sung hai câu chuyện người dùng mới (`US-07: Quản lý hồ sơ và Cấu hình cá nhân` và `US-08: Tùy biến giao diện (Theme & Opacity)`) vào tệp [SPEC.md](file:///d:/Download/daily-goal-tracker/docs/SPEC.md).
2.  **Định nghĩa API Endpoints**: Thêm mới các endpoint `PUT /api/auth/profile` và `DELETE /api/auth/profile` vào danh mục API trong tệp [Plan.md](file:///d:/Download/daily-goal-tracker/docs/Plan.md).
3.  **Nhật ký phát triển**: Ghi nhận chi tiết lịch sử hoàn thành các tính năng với mốc thời gian cụ thể (GMT+7) trong tệp [CHANGELOG.md](file:///d:/Download/daily-goal-tracker/docs/CHANGELOG.md).

---

## 3. Build (Xây dựng & Triển khai mã nguồn)
Quá trình lập trình được tiến hành tuần tự từ cơ sở dữ liệu, API điều hướng, trạng thái Client đến giao diện người dùng:
1.  **Backend & Database**:
    *   Thêm phương thức `delete` trong lớp thao tác người dùng tại [db.ts](file:///d:/Download/daily-goal-tracker/server/db.ts).
    *   Xây dựng controller cập nhật và xóa tài khoản trong [authController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/authController.ts).
    *   Đăng ký các tuyến đường API và áp dụng `authMiddleware` bảo vệ trong [auth.ts](file:///d:/Download/daily-goal-tracker/src/routes/auth.ts).
2.  **Client State Management**:
    *   Tích hợp hàm `updateProfile` và `deleteAccount` vào [authStore.ts](file:///d:/Download/daily-goal-tracker/src/store/authStore.ts) bằng Zustand để đồng bộ hóa Token và dữ liệu LocalStorage.
3.  **Styles & Tokens Override**:
    *   Định nghĩa các biến dùng chung (`--border-subtle`, `--bg-hover`, `--sidebar-bg`, `--header-bg`) và bảng màu Light Mode trong [index.css](file:///d:/Download/daily-goal-tracker/src/index.css).
    *   Định nghĩa các lớp CSS độc lập cho ô lịch heatmap (`.heatmap-cell-0` đến `.heatmap-cell-3`) sử dụng `color-mix`.
4.  **UI Components & Routing**:
    *   Tạo trang [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx) với đầy đủ các bento cards và tương tác.
    *   Cấu hình định tuyến và tự động nhận diện theme trên [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx) khi khởi động.
    *   Đồng bộ hóa biến màu nền và viền ở [Sidebar.tsx](file:///d:/Download/daily-goal-tracker/src/components/Sidebar.tsx) và [DashboardPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/DashboardPage.tsx).
    *   Cấu trúc lại toàn bộ trang [Stats.tsx](file:///d:/Download/daily-goal-tracker/src/pages/Stats.tsx) sang màu sắc ngữ nghĩa và heatmap theme-aware.

---

## 4. Test (Kiểm thử & Nghiệm thu thực tế)
Quá trình kiểm thử đã được chạy trực tiếp trên môi trường máy chủ phát triển cục bộ và xác nhận kết quả:
*   **Compile Test (Đạt)**: Vite Dev Server xác nhận biên dịch thành công và cập nhật nóng (HMR) tức thì cho tất cả các file mã nguồn chỉnh sửa mà không xảy ra bất kỳ lỗi cú pháp hay thiếu import nào.
*   **Theme Toggle Test (Đạt)**: Nhấn chọn Light Mode đổi toàn bộ tông nền sáng và đổi màu chữ sang tối rõ nét, không còn hiện tượng chữ bị chìm. Đổi lại Dark Mode giao diện kính mờ tối nguyên bản hiển thị chính xác.
*   **Glass Opacity Test (Đạt)**: Kéo thanh trượt Glass Opacity thay đổi độ mờ của toàn bộ thẻ kính trong ứng dụng mượt mà đúng tỷ lệ % hiển thị.
*   **Data Integrity Test (Đạt)**: Nhấn "Export My Data" tải về file `.json` chứa đúng cấu trúc thông tin người dùng và danh sách các mục tiêu hiện tại.
*   **Profile Save Test (Đạt)**: Thay đổi tên hiển thị và múi giờ, nhấn "Save Preferences" báo lưu thành công và cập nhật tức thì tên hiển thị trên avatar góc trái Sidebar.
*   **Cascade Delete Test (Đạt)**: Nhấn "Delete Account" kích hoạt Modal cảnh báo. Xác nhận xóa tài khoản tự động dọn sạch token/user client-side, xóa sạch các bản ghi User và các bản ghi liên quan (Goal, Streak, GoalLog, Notification) trong DB và chuyển hướng về màn hình `/login`.
