# 🛡️ VIBE PROCESS VERIFICATION: UNDO LOG, DISAPPEARING GOALS & UX OPTIMIZATION

Tài liệu này chứng minh và ghi nhận chi tiết quá trình phát triển các tính năng mới (**Hoàn tác tiến độ - Undo Log**, **Hiệu ứng biến mất 5s trên Dashboard**, **Xóa log từ Timeline**, **Đồng bộ tính lại Streak**, **Cân đối màn Đăng nhập**, **Sticky Action Bar trong Settings** và **Mặc định Theme Sáng**) tuân thủ nghiêm ngặt theo quy trình 4 bước chuẩn hóa: **Plan (Lập kế hoạch) -> Doc (Tài liệu hóa) -> Build (Xây dựng) -> Test (Kiểm thử & Nghiệm thu)**.

---

## 1. Plan (Lập kế hoạch thiết kế)
Giai đoạn này xác định mục tiêu, giải pháp kỹ thuật và sơ đồ cấu trúc trước khi can thiệp vào mã nguồn:
*   **Hoàn tác tiến độ (Undo Log) & Ẩn thói quen đã hoàn thành**:
    *   Yêu cầu: Khi thói quen hoàn thành mục tiêu ngày, nó nên ẩn khỏi Dashboard để tạo không gian gọn gàng. Tuy nhiên, nếu người dùng bấm nhầm, cần có cơ chế "Undo" khôi phục tiến độ lập tức.
    *   Giải pháp: Tích hợp trạng thái đếm ngược 5 giây trên thẻ mục tiêu. Trong thời gian này, hiển thị nút Undo. Nếu kết thúc đếm ngược mà không Undo, thói quen sẽ biến mất.
*   **Xóa log check-in từ Trục thời gian (Timeline)**:
    *   Yêu cầu: Hỗ trợ người dùng xóa bất kỳ log check-in nào trong quá khứ trực tiếp từ trang Timeline.
    *   Hạ tầng: Thiết kế API `DELETE /api/goals/logs/:logId` để xóa log, giảm chỉ số đếm của thói quen, và tính toán lại Streak.
*   **Thuật toán Tính toán lại Streak (Streak Recalculation)**:
    *   Yêu cầu: Khi một log bị xóa hoặc hoàn tác, chuỗi ngày liên tục (Streak) phải được tính lại chính xác để tránh gian lận hoặc sai lệch dữ liệu.
    *   Giải pháp: Viết hàm dịch vụ quét toàn bộ logs còn lại, nhóm theo múi giờ địa phương (`timezone`) của người dùng để tính toán lại chuỗi `current_streak` và `longest_streak`.
*   **Tối ưu hóa Giao diện (UX Overhaul)**:
    *   Đăng nhập/Đăng ký: Cân đối và căn giữa màn hình Login/Register (`width: 100%`).
    *   Cài đặt (Settings): Chuyển đổi các nút Save/Discard thành một thanh nổi cố định (Sticky Floating Bar) ở cuối trang để người dùng không phải cuộn màn hình xuống dưới. Thiết lập Theme sáng làm mặc định ban đầu.
    *   Form tạo mục tiêu: Thay thế các mã màu Tailwind cứng bằng mã màu biến ngữ nghĩa để thích ứng động với hai chế độ sáng/tối.

---

## 2. Doc (Tài liệu hóa kỹ thuật)
Các tính năng và luồng xử lý mới được mô tả chi tiết trong hệ thống tài liệu dự án trước khi lập trình:
1.  **Định nghĩa User Stories**: Cập nhật các tiêu chí chấp nhận (AC) cho nút Undo và đếm ngược trong `US-05`, chức năng xóa log và tính lại Streak trong `US-09`, Sticky Action Bar trong `US-07`, và theme mặc định trong `US-08` tại tệp [SPEC.md](file:///d:/Download/daily-goal-tracker/docs/SPEC.md).
2.  **Định nghĩa API Endpoints**: Đăng ký API mới `DELETE /api/goals/logs/:logId` và cập nhật bản đồ màn hình tại tệp [Plan.md](file:///d:/Download/daily-goal-tracker/docs/Plan.md).
3.  **Nhật ký phát triển**: Ghi nhận chi tiết lịch sử hoàn thành các tính năng mới với mốc thời gian cụ thể (GMT+7) trong tệp [CHANGELOG.md](file:///d:/Download/daily-goal-tracker/docs/CHANGELOG.md).

---

## 3. Build (Xây dựng & Triển khai mã nguồn)
Quá trình lập trình được tiến hành tuần tự từ cơ sở dữ liệu, API điều hướng, trạng thái Client đến giao diện người dùng:
1.  **Backend & Database**:
    *   Cập nhật [db.ts](file:///d:/Download/daily-goal-tracker/server/db.ts) để thêm phương thức `delete` và `findUnique` cho Helper logs của Prisma.
    *   Xây dựng controller `deleteLog` và hàm logic `recalculateStreak` dựa trên múi giờ của người dùng tại [goalController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/goalController.ts).
    *   Đăng ký tuyến đường `DELETE /logs/:logId` trong [goals.ts](file:///d:/Download/daily-goal-tracker/src/routes/goals.ts).
2.  **Zustand Store**:
    *   Thêm action `deleteLogProgress` vào [goalStore.ts](file:///d:/Download/daily-goal-tracker/src/store/goalStore.ts) để gọi API xóa log và tự động làm mới thống kê (`fetchStats()`, `fetchHistory()`).
3.  **UI & Components**:
    *   **Dashboard & GoalCard:** Thêm state `disappearingGoals` quản lý bộ đếm thời gian 5s trong [DashboardPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/DashboardPage.tsx). Thiết kế giao diện đếm ngược kèm nút "Undo" trong [GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx).
    *   **Timeline:** Thêm nút xóa log check-in kế bên mỗi mục lịch sử và tích hợp hàm gọi xác nhận trong [TimelinePage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/TimelinePage.tsx).
    *   **Settings:** Cài đặt mặc định theme là `light` thay vì `dark`. Di chuyển cụm Save/Discard vào khung kính mờ `glass-card sticky bottom-4 md:bottom-6 z-30` tại [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx).
    *   **LoginPage:** Thêm class `w-full` và kiểu `width: "100%"` cho wrapper ngoài cùng để sửa lỗi căn lệch màn hình.
    *   **GoalFormPage:** Đồng bộ các class Tailwind (`text-slate-400` -> `text-on-surface-variant`, `m-input`) cho biểu mẫu.

---

## 4. Test (Kiểm thử & Nghiệm thu thực tế)
Quá trình kiểm thử đã được chạy trực tiếp trên môi trường máy chủ phát triển cục bộ và xác nhận kết quả:
*   **Compile Test (Đạt)**: Vite Dev Server xác nhận biên dịch thành công không có lỗi TypeScript hay lỗi biên dịch giao diện.
*   **Undo & Disappearing Test (Đạt)**:
    1. Bấm hoàn thành một thói quen trên Dashboard.
    2. Thẻ mục tiêu lập tức hiển thị lớp phủ mờ "Completed! Disappearing in 5s..." cùng bộ đếm ngược giảm dần và nút **Undo**.
    3. Bấm **Undo**: Tiến độ thói quen giảm đi 1, bộ đếm dừng lại và thẻ thói quen trở về bình thường.
    4. Bấm hoàn thành lại và đợi hết 5 giây: Thói quen tự động ẩn khỏi Dashboard.
*   **Timeline Log Deletion Test (Đạt)**:
    1. Truy cập `/timeline`, xem danh sách check-in.
    2. Bấm biểu tượng Thùng rác bên cạnh một log check-in. Hệ thống hiện hộp thoại xác nhận.
    3. Nhấn OK: Log biến mất khỏi Timeline, chỉ số hoàn thành của thói quen đó giảm đi 1.
    4. Quay lại Dashboard: Thói quen đã biến mất trước đó nay tự động hiển thị trở lại vì tiến trình hoàn thành đã bị giảm.
*   **Streak Recalculation Test (Đạt)**:
    - Xóa một log check-in giữa chuỗi ngày liên tục. Hệ thống tự động tính toán lại và giảm chuỗi `current_streak` và `longest_streak` tương ứng trong cơ sở dữ liệu và hiển thị số mới tức thì trên Widget.
*   **Login Layout Alignment Test (Đạt)**:
    - Truy cập trang `/login` và `/register`, khung đăng nhập hiển thị căn giữa hoàn hảo, không bị tràn màn hình hay lệch về một bên.
*   **Settings Sticky Bar Test (Đạt)**:
    - Truy cập `/settings`, thanh tác vụ chứa nút Save Preferences và Discard Changes luôn nổi cố định ở cuối trang với nền kính mờ sang trọng, giúp thao tác nhanh chóng và tiện lợi ở mọi độ cuộn.
*   **Default Theme Test (Đạt)**:
    - Xóa bộ nhớ `localStorage` và tải lại trang, hệ thống tự động khởi tạo bằng giao diện màu sáng (Light Theme) dịu mắt, các thẻ kính mờ trắng đục hiển thị sắc nét.
