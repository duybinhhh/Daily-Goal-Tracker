### 3.2 Nội dung file `docs/CHANGELOG.md`
*File này theo dõi tiến độ phát triển, ghi nhận các tính năng đã/sẽ hoàn thiện theo từng Sprint.*


# Changelog

Tất cả các thay đổi lớn của dự án sẽ được ghi nhận và cập nhật theo từng Sprint tại đây.

## [Đã hoàn thành] - Offline Sync Reliability & Concurrency Overhaul - 2026-06-05 11:20 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Khóa đồng bộ đa tab (Multi-tab Synchronization Locking):**
  - Tích hợp **Web Locks API** (`navigator.locks`) trong [syncManager.ts](file:///d:/Download/daily-goal-tracker/src/services/syncManager.ts) nhằm đảm bảo chỉ có duy nhất một tab trình duyệt thực hiện quá trình đồng bộ hóa dữ liệu ngoại tuyến tại một thời điểm, tránh xung đột cuộc đua (race conditions).
  - Triển khai giải pháp fallback tự động sử dụng **LocalStorage Lock** kết hợp với cơ chế hết hạn khóa (10 giây) và khóa trong bộ nhớ (in-memory lock) cho các trình duyệt cũ hoặc môi trường HTTP không bảo mật (non-secure contexts).
* **Cơ chế Đảm bảo Tính Tuần Tự & Bền Vững (Durability & Ordering):**
  - Các phần tử trong hàng đợi `syncQueue` chỉ bị xóa đi *sau khi* nhận được phản hồi thành công (HTTP status 2xx) từ Server API.
  - Các lỗi mạng hoặc lỗi phía Server (5xx) sẽ dừng quá trình đồng bộ hóa để thử lại sau, trong khi lỗi người dùng (4xx) sẽ loại bỏ phần tử lỗi khỏi hàng đợi để tránh làm tắc nghẽn quá trình đồng bộ.
* **Cơ chế Chống Trùng lặp & Bảo đảm Idempotency (Deduplication & Idempotency):**
  - Frontend tự động tạo mã UUID định danh duy nhất (`log_id`) cho từng sự kiện check-in ngay khi người dùng nhấn nút. Mã này được đẩy vào `syncQueue` và gửi lên API Backend `POST /api/goals/:id/complete`.
  - Backend sử dụng `log_id` làm khóa chính (Primary Key) cho bảng `GoalLog`, loại bỏ hoàn toàn khả năng ghi nhận trùng lặp log check-in ở cơ sở dữ liệu nếu có request bị gửi lặp lại.
* **Ngăn chặn Xung đột Giao diện do Thao tác nhanh (UI Concurrency Guards):**
  - Tích hợp trạng thái khóa `completing` trong [GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx) để vô hiệu hóa/ngăn chặn hành vi nhấn nút check-in dồn dập (double-click) hoặc giữ phím Enter, tránh việc tạo ra nhiều UUID cục bộ trùng lặp cho một lần tương tác.
* **Hợp nhất Dữ liệu Ngoại tuyến Thông minh (Smart Cache & Sync Queue Merging):**
  - Cải tiến hàm `fetchGoals` và `fetchHistory` trong [goalStore.ts](file:///d:/Download/daily-goal-tracker/src/store/goalStore.ts) luôn tự động hợp nhất các hành động đang chờ trong `syncQueue` vào dữ liệu tải về từ server.
  - Giúp loại bỏ hoàn toàn lỗi giật màn hình (UI reset/flicker) trong giai đoạn chuyển tiếp từ offline sang online khi dữ liệu server chưa đồng bộ kịp.

## [Đã hoàn thành] - Offline Mode & Synchronization (PWA & IndexedDB) - 2026-06-05 09:45 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Tính năng Progressive Web App (PWA):**
  - Khởi tạo tệp cấu hình ứng dụng [manifest.json](file:///d:/Download/daily-goal-tracker/public/manifest.json) và tích hợp logo PWA glassmorphism [icon.png](file:///d:/Download/daily-goal-tracker/public/icon.png).
  - Viết Service Worker [sw.js](file:///d:/Download/daily-goal-tracker/public/sw.js) để thực hiện lưu trữ cache giao diện (HTML, CSS, JS, hình ảnh, phông chữ) và hỗ trợ ứng dụng tải hoàn toàn offline.
  - Tích hợp và đăng ký Service Worker khi tải trang tại [main.tsx](file:///d:/Download/daily-goal-tracker/src/main.tsx) và liên kết manifest trong [index.html](file:///d:/Download/daily-goal-tracker/index.html).
* **Đệm dữ liệu & Hàng đợi Ngoại tuyến (IndexedDB Caching & Offline Queue):**
  - Xây dựng lớp dịch vụ cơ sở dữ liệu IndexedDB tại [indexedDb.ts](file:///d:/Download/daily-goal-tracker/src/services/indexedDb.ts) gồm kho lưu trữ `metadata` (để lưu cache danh sách thói quen, thống kê và lịch sử) và `syncQueue` (hàng đợi lưu tạm check-in offline).
  - Cập nhật Zustand [goalStore.ts](file:///d:/Download/daily-goal-tracker/src/store/goalStore.ts) để khi mất mạng (Offline), hệ thống tự động đọc dữ liệu từ cache IndexedDB kèm cộng bù trừ số lượng thói quen đã hoàn thành tạm thời trong hàng đợi.
  - Hỗ trợ thao tác Check-in và Hoàn tác (Undo) hoạt động hoàn toàn offline mà không cần kết nối mạng.
* **Tự động đồng bộ hóa & Xử lý thời gian phía Backend (Background Synchronization):**
  - Xây dựng trình đồng bộ dữ liệu tại [syncManager.ts](file:///d:/Download/daily-goal-tracker/src/services/syncManager.ts) tự động lắng nghe sự kiện `online` để gửi các check-in lưu tạm trong hàng đợi lên server và làm sạch hàng đợi.
  - Cập nhật controller `completeGoal` tại [goalController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/goalController.ts) để chấp nhận tham số `completed_at` tùy chọn do client gửi lên, đảm bảo lưu trữ chính xác mốc thời gian thực hiện thói quen khi offline để tính toán streak và timeline.
* **Huy hiệu Trực quan & Đồng bộ Trạng thái Mạng (UI Connectivity Badges):**
  - Thêm các huy hiệu hiển thị trạng thái kết nối mạng ("Offline Mode" màu cam và "Syncing..." màu xanh lá) sắc nét trên thanh Header tại [DashboardPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/DashboardPage.tsx).
  - Cập nhật định tuyến ứng dụng và trình quản lý sự kiện mạng trong [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx) để đồng bộ trạng thái `isOffline` toàn cục.
  - Tích hợp đồng bộ hóa tự động trước khi tải dữ liệu mới khi nhấn nút "Refresh" tại [useGoals.ts](file:///d:/Download/daily-goal-tracker/src/hooks/useGoals.ts).

## [Đã hoàn thành] - Undo Progress Log, Disappearing Goals & UX Optimization - 2026-06-04 13:30 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Tính năng Hủy ghi nhận tiến độ thói quen (Undo Progress Log):**
  - Thêm hiệu ứng biến mất (disappearing animation) kéo dài 5 giây trên thẻ mục tiêu [GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx) tại trang Dashboard khi người dùng bấm hoàn thành (Log progress).
  - Thiết lập hiển thị đếm ngược 5 giây kèm nút "Undo" để người dùng hoàn tác tức thì hành động log tiến độ trong trường hợp bấm nhầm.
  - Tự động ẩn các thói quen đã hoàn thành ra khỏi Dashboard sau khi kết thúc đếm ngược nhằm tối ưu sự tập trung và tối giản hóa không gian làm việc.
* **Xóa Log lịch sử từ Trục thời gian (Timeline Log Deletion):**
  - Thêm nút "Xóa log" (Delete log) bên cạnh mỗi bản ghi check-in tại trang [TimelinePage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/TimelinePage.tsx).
  - Khi người dùng xóa một log check-in cũ, thói quen tương ứng sẽ tự động hiển thị lại trên Dashboard nếu nó chưa đạt chỉ tiêu hoàn thành.
* **Thuật toán tính toán lại Chuỗi Streak (Streak Recalculation Engine):**
  - Triển khai logic tính toán lại chuỗi ngày liên tục (`recalculateStreak`) trong [goalController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/goalController.ts) khi có hành động xóa/hủy log tiến độ.
  - Tự động nhóm log theo ngày địa phương dựa trên múi giờ (`timezone`) được thiết lập của người dùng, cập nhật lại chuỗi ngày hiện tại (`current_streak`), chuỗi ngày kỷ lục (`longest_streak`), và ngày hoàn thành cuối cùng (`last_completed_at`) chính xác.
* **Tối ưu hóa Giao diện và Trải nghiệm Người dùng:**
  - **Sửa lỗi hiển thị Đăng ký/Đăng nhập:** Thêm thuộc tính `width: 100%` cho khung bao trang đăng nhập trong [LoginPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/LoginPage.tsx) giúp căn giữa chuẩn xác trên mọi độ phân giải.
  - **Cải thiện Form tạo mục tiêu:** Thay thế các mã màu cố định của Tailwind CSS bằng các lớp màu ngữ nghĩa tương thích động (`text-on-surface-variant`, `m-input`) trong [GoalFormPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/GoalFormPage.tsx) để hiển thị đồng bộ trên cả Light và Dark Theme.
  - **Thanh tác vụ Cố định trong Cài đặt (Sticky Action Bar):** Chuyển đổi khu vực nút Lưu/Hủy thay đổi trong [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx) thành thanh điều khiển kính mờ nổi cố định (Sticky Floating Bar) ở cuối màn hình giúp người dùng dễ dàng thao tác mà không cần cuộn trang xuống dưới.
  - **Mặc định Theme Sáng:** Thiết lập chế độ giao diện ban đầu mặc định là màu trắng (Light Theme) thay vì màu tối khi người dùng truy cập lần đầu tiên.
* **API Backend & Database Wrapper:**
  - Thêm API route `DELETE /api/goals/logs/:logId` trong [goals.ts](file:///d:/Download/daily-goal-tracker/src/routes/goals.ts).
  - Bổ sung các hàm helper `delete` và `findUnique` cho bảng GoalLog trong [db.ts](file:///d:/Download/daily-goal-tracker/server/db.ts) để quản lý cơ sở dữ liệu.

## [Đã hoàn thành] - Premium Statistics Dashboard Overhaul - 2026-06-04 11:00 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Trang Thống kê Thói quen cao cấp (Premium Statistics Dashboard):**
  - Tái thiết kế toàn diện trang [Stats.tsx](file:///d:/Download/daily-goal-tracker/src/pages/Stats.tsx) thành một bảng điều khiển phân tích hiệu suất Momentum cao cấp.
  - **Thanh điều hướng đỉnh đồng bộ (Aligned Header):** Tích hợp thanh tiêu đề sticky đồng bộ với Timeline/Dashboard, chứa ô Tìm kiếm milestone thời gian thực, huy hiệu chuỗi ngày Streak động, nút xuất dữ liệu nhanh CSV, và nút làm mới dữ liệu nhanh (Refresh).
  - **Bento Grid chỉ số tổng quan:** Hiển thị tỷ lệ hoàn thành thói quen toàn cục kèm theo tính toán so sánh xu hướng tăng trưởng (+/- %) so với tháng trước một cách trực quan, và bảng phân loại 3 cột thói quen hàng đầu.
  - **Consistency Heatmap (Lịch hoạt động 180 ngày):** Truy vấn lịch sử 182 ngày và tự động căn chỉnh ngày bắt đầu về Chủ Nhật để tạo lưới lịch tuần hoàn hảo (7 dòng x 26 cột) hỗ trợ tooltip chi tiết khi di chuột qua.
  - **Biểu đồ xu hướng hiệu suất 10 tuần:** Phân nhóm tiến độ 70 ngày gần nhất thành 10 tuần gần nhất, vẽ biểu đồ cột CSS động tự điều chỉnh chiều cao và hiển thị chi tiết khi rê chuột.
  - **Biểu đồ tròn Goal Distribution:** Xây dựng biểu đồ tròn Donut động sử dụng `conic-gradient` chia tỉ lệ mục tiêu theo từng danh mục thói quen kết hợp bảng chú thích màu sắc tương ứng.
  - **Milestone Feed:** Hiển thị dòng mốc thành tựu thói quen động (ví dụ: "Achiever Elite Tier Unlocked") và bộ lọc theo từ khóa tìm kiếm.
  - **Seed Dữ liệu mẫu:** Tích hợp tùy chọn Seed Goal từ Backend khi cơ sở dữ liệu trống giúp người dùng nhanh chóng trải nghiệm dashboard thống kê đầy đủ.

## [Đã hoàn thành] - My Goals Page Integration - 2026-06-04 10:52 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Màn hình danh sách mục tiêu chi tiết (My Goals Page):**
  - Tạo mới trang [GoalsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/GoalsPage.tsx) với giao diện Bento Grid & Glassmorphism cao cấp.
  - Tích hợp ô Tìm kiếm trực quan, lọc nhanh theo trạng thái (Tất cả / Hoạt động / Tạm dừng) kèm theo đếm số lượng động.
  - Hỗ trợ sắp xếp nâng cao theo Priority (ngày đến hạn/số lượng chỉ tiêu), Recent (cập nhật mới nhất), và Streak (chuỗi liên tục cao nhất).
  - Tích hợp Popup Menu hành động trên từng thẻ mục tiêu cho phép Tạm dừng/Kích hoạt lại, Chỉnh sửa, và Xóa nhanh chóng.
  - Tích hợp nút Đăng ký tiến độ nhanh (Log) trực tiếp trên từng thẻ.
  - Thiết kế vòng tròn tiến độ lớn (Overall Completion SVG Progress Ring) tự động hiển thị tỷ lệ thói quen hoạt động trung bình kèm danh hiệu thành tích Elite Strategist.
* **Cấu hình & Tích hợp:**
  - Cập nhật định tuyến trong [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx) để đăng ký đường dẫn `/goals`.
  - Thêm menu "Goals" sử dụng icon `checklist` vào thanh điều hướng bên trái tại [Sidebar.tsx](file:///d:/Download/daily-goal-tracker/src/components/Sidebar.tsx).

## [Đã hoàn thành] - Activity Timeline Page Integration - 2026-06-04 10:45 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Màn hình Trục thời gian hoạt động (Activity Timeline):**
  - Tạo mới trang [TimelinePage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/TimelinePage.tsx) hiển thị chi tiết lịch sử check-in mục tiêu.
  - Tích hợp ô lưới Performance Grid hiển thị các ngày hoàn thành và đánh dấu các mốc đột phá (star badge).
  - Tích hợp feed log hoàn thành với bộ lọc thời gian thực theo từ khóa và theo ngày được chọn trên Grid.
  - Thêm chức năng xuất báo cáo CSV động (Export Monthly Report) hỗ trợ tải trực tiếp về trình duyệt.
* **Cấu hình & Tích hợp:**
  - Cập nhật định tuyến ứng dụng trong [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx) để đăng ký đường dẫn `/timeline`.
  - Thêm mục menu "Timeline" trong [Sidebar.tsx](file:///d:/Download/daily-goal-tracker/src/components/Sidebar.tsx) nằm giữa Statistics và Settings.
  - Bổ sung các class CSS phụ trợ (`.neon-glow-primary`, `.neon-glow-secondary`, `.custom-scrollbar`) trong [index.css](file:///d:/Download/daily-goal-tracker/src/index.css).

## [Đã hoàn thành] - Settings Page, Light Mode & Stats Theme Overhaul - 2026-06-04 10:20 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Trang Cài đặt (Settings Page):**
  - Tạo mới trang [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx) tích hợp cập nhật Profile (Tên, Email, Múi giờ) và lưu đồng bộ vào database qua API `PUT /api/auth/profile`.
  - Hỗ trợ xuất dữ liệu cá nhân dạng JSON (Export My Data) và xóa tài khoản vĩnh viễn (Delete Account) tích hợp xác thực cảnh báo và API `DELETE /api/auth/profile`.
  - Tích hợp điều khiển các hiệu ứng chuyển động và thanh trượt thay đổi độ trong suốt kính mờ (Glass Opacity) theo thời gian thực.
* **Chế độ Sáng (Light Mode):**
  - Thiết kế hoàn chỉnh Light Mode cho toàn bộ hệ thống Momentum trong [index.css](file:///d:/Download/daily-goal-tracker/src/index.css) dưới class `html.light` (tông màu xám xanh nhạt dịu mắt, thẻ kính mờ trắng mờ sang trọng, viền và hover tinh tế).
  - Tích hợp bộ chọn chủ đề sáng/tối trong Cài đặt với tính năng xem trước trực quan và lưu trạng thái vào `localStorage`.
  - Tự động áp dụng theme tương ứng khi khởi động ứng dụng trong [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx).
* **Đồng bộ trang Thống kê (Stats Page):**
  - Tái cấu trúc [Stats.tsx](file:///d:/Download/daily-goal-tracker/src/pages/Stats.tsx) để hiển thị sắc nét trên cả Light và Dark Mode.
  - Chuyển toàn bộ màu chữ cứng sang các lớp màu ngữ nghĩa (`text-on-surface`, `text-on-surface-variant`).
  - Cập nhật nền thanh tiến độ tuần và thẻ phân loại sang kính mờ tương thích màu nền.
  - Thiết kế lại các ô lịch hoạt động (heatmap grid) sang hệ thống lớp CSS có `color-mix` tự thích ứng độ sáng/tối.

## [Đã hoàn thành] - UI Overhaul: Momentum Theme - 2026-06-04 10:00 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Phong cách Thiết kế & Tokens:**
  - Thiết kế lại toàn bộ giao diện sang phong cách Momentum (Glassmorphism & Dark Mode).
  - Tích hợp font chữ Google (Inter & Material Symbols Outlined) trong [index.html](file:///d:/Download/daily-goal-tracker/index.html).
  - Định nghĩa hệ thống màu sắc (HSL) và các class tiện ích Momentum (glass-card, streak-badge, cat-pill, v.v.) trong [src/index.css](file:///d:/Download/daily-goal-tracker/src/index.css) với Tailwind v4.
* **Layout & Navigation:**
  - Tạo mới thanh điều hướng dọc [Sidebar.tsx](file:///d:/Download/daily-goal-tracker/src/components/Sidebar.tsx) cố định bên trái (220px) với Avatar, chỉ số Streak và liên kết điều hướng.
  - Cấu trúc lại [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx) giúp phần Dashboard chính co giãn và lấp đầy 100% chiều rộng màn hình còn lại.
* **Dashboard Page:**
  - Thiết kế lại giao diện Dashboard với khối Bento 3 cột chỉ số ở trên đầu ([DashboardPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/DashboardPage.tsx)).
  - Sắp xếp lại danh sách mục tiêu hiển thị ngang ([GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx)) chứa vòng/thanh tiến độ, nút hoàn thành nhanh và ghi chú.
  - Thiết kế lại các widget Mini Calendar và Upcoming Milestones ở cột bên phải.
* **Xác thực & UI Components:**
  - Thiết kế lại trang đăng nhập [LoginPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/LoginPage.tsx) dạng glass-card với hiệu ứng các đốm màu (gradient blobs) nền.
  - Đồng bộ hóa các component dùng chung như [Button.tsx](file:///d:/Download/daily-goal-tracker/src/components/ui/Button.tsx), [Input.tsx](file:///d:/Download/daily-goal-tracker/src/components/ui/Input.tsx), [Card.tsx](file:///d:/Download/daily-goal-tracker/src/components/ui/Card.tsx), [ProgressBar.tsx](file:///d:/Download/daily-goal-tracker/src/components/ui/ProgressBar.tsx).

## [Kế hoạch] - Sprint 4: Thống kê nâng cao, Thông báo & Cấu hình
### Sẽ bổ sung (To Be Added)
* **Thống kê & Biểu đồ:**
  - API Lịch sử & Trang UI xem lịch sử (`US-11`).
  - API Thống kê & Biểu đồ trực quan (Completion Rate Chart, Streak Chart) (`US-12`).
* **Hệ thống Thông báo:**
  - Thiết kế Schema & API bắn thông báo nhắc nhở (`US-13`).
* **Cài đặt cá nhân:**
  - Cập nhật Profile và đồng bộ hiển thị Dashboard theo `Timezone` được chọn (`US-14`, `US-15`).
* **Nghiệm thu (Release):**
  - Chạy thử nghiệm UAT (User Acceptance Testing).
  - Triển khai sản phẩm lên môi trường Production (Deployment).

## [Đã hoàn thành] - Sprint 3: Tiến độ & Dashboard - 2026-06-04 02:00 (GMT+7)
### Đã thêm (Added)
* **Ghi nhận tiến độ:**
  - API và Nút bấm UI để đánh dấu hoàn thành mục tiêu (`US-08`).
  - Logic tự động tính toán chuỗi ngày liên tục (`Streak Calculation Service`).
* **Giao diện Dashboard:**
  - API tổng hợp dữ liệu trong ngày (`US-09`).
  - Giao diện Dashboard tổng quan kèm Widget hiển thị Tỷ lệ hoàn thành và Widget hiển thị chuỗi ngày (Streak Widget).

## [Đã hoàn thành] - Sprint 2: Quản lý mục tiêu (Goal Management) - 2026-06-03 (GMT+7)
### Đã thêm (Added)
* **Cơ sở dữ liệu:** Thêm Prisma Schema cho thực thể `Goal`.
* **Phía Backend:** Phát triển cụm API CRUD cho Goal (Create, Get List, Update, Delete).
* **Phía Frontend:**
  - Cài đặt React Router cho ứng dụng.
  - Thiết kế Form tạo mục tiêu (có Validate) và các Component hiển thị (`GoalCard`, `GoalList`, `GoalDetail`).
  - Xây dựng `Goal Zustand Store` quản lý State chung cho Module này.

## [Đã hoàn thành] - Sprint 1: Khởi tạo dự án & Xác thực (Authentication) - 2026-06-03 (GMT+7)
### Đã thêm (Added)
* Khởi tạo cấu trúc thư mục chuẩn cho dự án (gồm `docs/`, `src/`, `tests/`).
* Thiết lập môi trường Cơ sở dữ liệu PostgreSQL kết hợp Prisma ORM (`T-01`).
* Định nghĩa cấu trúc bảng User ban đầu (`T-02`).
* Xây dựng bộ API lõi cho tính năng Xác thực: Register, Login, Logout bao gồm cơ chế mã hóa mật khẩu (`bcrypt`) và cấp phát cặp mã token (`JWT Access/Refresh Token`).
* Setup Frontend Client: Cấu hình `Zustand` quản lý trạng thái đăng nhập, viết `Axios Interceptor` để bắt và xử lý Token tự động.
* Xây dựng giao diện cơ bản (UI) cho màn hình Login và Register.
* Viết bổ sung Unit Test cho nhóm API Auth này để đảm bảo độ ổn định (`T-15`).
