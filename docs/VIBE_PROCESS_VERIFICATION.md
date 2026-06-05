# 🛡️ VIBE PROCESS VERIFICATION: ACTIVE REMINDERS, PWA OFFLINE MODE, UNDO LOG, ACCOUNTABILITY GROUPS & SOCIAL SHARING

Tài liệu này chứng minh và ghi nhận chi tiết quá trình phát triển các tính năng mới (**Nhắc nhở chủ động chống đứt chuỗi - Active Reminders**, **Chế độ Ngoại tuyến & Đồng bộ hóa sau - Offline Mode & Sync**, **Hoàn tác tiến độ - Undo Log**, **Hiệu ứng biến mất 5s trên Dashboard**, **Xóa log từ Timeline**, **Đồng bộ tính lại Streak**, **Cân đối màn Đăng nhập**, **Sticky Action Bar trong Settings**, **Mặc định Theme Sáng**, **Đồng đội giám sát - Habit Groups** và **Chia sẻ thành tích một chạm - Social Sharing**) tuân thủ nghiêm ngặt theo quy trình 4 bước chuẩn hóa: **Plan (Lập kế hoạch) -> Doc (Tài liệu hóa) -> Build (Xây dựng) -> Test (Kiểm thử & Nghiệm thu)**.

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
*   **Chế độ Ngoại tuyến & Đồng bộ hóa sau (Offline Mode & Sync)**:
    *   Yêu cầu: Người dùng có thể check-in thói quen ngay cả khi không có sóng 4G/Wifi (ví dụ: chạy bộ ở công viên, tập gym tầng hầm, trên máy bay).
    *   Hạ tầng: Chuyển đổi ứng dụng thành PWA (Progressive Web App) với Web App Manifest và Service Worker để lưu cache giao diện shell hoàn toàn ngoại tuyến.
    *   Giải pháp: Tích hợp IndexedDB dưới trình duyệt làm kho lưu trữ đệm cho dữ liệu danh sách mục tiêu/chỉ số và làm hàng đợi (syncQueue) lưu tạm các check-in offline. Tự động lắng nghe sự kiện `online` để kích hoạt trình đồng bộ `syncOfflineData` đưa dữ liệu lên Server, đồng thời tính toán lại Streak chính xác theo mốc thời gian thực hiện ban đầu (`completed_at`).
*   **Nhắc nhở chủ động chống đứt chuỗi (Active Reminders)**:
    *   Yêu cầu: Người dùng hay quên mở ứng dụng, dẫn đến đứt chuỗi Streak. Cần gửi thông báo đẩy đến trình duyệt/mobile vào lúc 21h00 tối hàng ngày nếu họ vẫn còn thói quen chưa làm xong.
    *   Giải pháp: Tích hợp chuẩn Web Push sử dụng VAPID keys. Lưu trữ push subscription dưới dạng JSON trong bảng User. Chạy một luồng lập lịch nền (scheduler) kiểm tra mỗi phút, đối chiếu múi giờ cục bộ của người dùng để kích hoạt đẩy thông báo lúc 21h00 local time và lưu ngày gửi gần nhất (`last_reminder_sent_date`) để chống gửi trùng lặp.
*   **Đồng đội giám sát (Accountability Partners / Habit Groups)**:
    *   Yêu cầu: Người dùng tự kỷ luật một mình rất dễ bỏ cuộc. Cần cho phép họ tạo nhóm thói quen chung (ví dụ: nhóm "Chạy bộ 5km mỗi ngày cùng phòng") để cùng nhắc nhở và cạnh tranh.
    *   Giải pháp: Thiết lập hai mô hình quan hệ cơ sở dữ liệu `HabitGroup` và `HabitGroupMember`. Khi một người dùng tham gia nhóm, hệ thống tự động sinh một `Goal` có liên kết `group_id` trên Dashboard của họ. Thành tích của từng thành viên (gồm tiến trình hôm nay và chuỗi Streak hiện tại) sẽ được hiển thị trực tiếp lên bảng xếp hạng (leaderboard) nhóm.
*   **Chia sẻ Heatmap & Huy hiệu đẹp mắt (Social Sharing)**:
    *   Yêu cầu: Tích hợp tính năng chia sẻ bảng Heatmap hoặc Huy hiệu thành tựu (Breakthrough Badge) chỉ với một click lên mạng xã hội để tăng tương tác.
    *   Giải pháp: Phát triển một hộp thoại Share Modal. Sử dụng HTML5 Canvas vẽ thẻ preview kính mờ (dark glassmorphism) thời thượng có độ phân giải 1200x630px chứa thông tin thành tích/Heatmap để tải ảnh PNG trực tiếp về thiết bị, đồng thời hỗ trợ Web Share API trên thiết bị và các link intent chia sẻ lên Facebook/Twitter.

---

## 2. Doc (Tài liệu hóa kỹ thuật)
Các tính năng và luồng xử lý mới được mô tả chi tiết trong hệ thống tài liệu dự án trước khi lập trình:
1.  **Định nghĩa User Stories**: Cập nhật các tiêu chí chấp nhận (AC) cho nút Undo và đếm ngược trong `US-05`, chức năng xóa log và tính lại Streak trong `US-09`, Sticky Action Bar trong `US-07`, theme mặc định trong `US-08`, Active Reminders chống đứt chuỗi trong tệp [SPEC.md](file:///d:/Download/daily-goal-tracker/docs/SPEC.md), cũng như bổ sung yêu cầu nhóm thói quen (`US-10`) và chia sẻ thành tích (`US-11`).
2.  **Định nghĩa API Endpoints**: Đăng ký API mới `DELETE /api/goals/logs/:logId`, `PUT /api/auth/push-subscription` (lưu đăng ký thông báo), và `GET /api/auth/vapid-public-key` (lấy khóa VAPID công khai) tại tệp [Plan.md](file:///d:/Download/daily-goal-tracker/docs/Plan.md), kèm các API nhóm: `GET /api/groups`, `POST /api/groups`, `GET /api/groups/:id`, `POST /api/groups/:id/join`, `POST /api/groups/:id/leave`, và `DELETE /api/groups/:id`.
3.  **Nhật ký phát triển**: Ghi nhận chi tiết lịch sử hoàn thành các tính năng mới với mốc thời gian cụ thể (GMT+7) trong tệp [CHANGELOG.md](file:///d:/Download/daily-goal-tracker/docs/CHANGELOG.md).

---

## 3. Build (Xây dựng & Triển khai mã nguồn)
Quá trình lập trình được tiến hành tuần tự từ cơ sở dữ liệu, API điều hướng, trạng thái Client đến giao diện người dùng:
1.  **Backend & Database**:
    *   Cập nhật tệp cơ sở dữ liệu [schema.prisma](file:///d:/Download/daily-goal-tracker/prisma/schema.prisma) để bổ sung trường `push_subscription` và `last_reminder_sent_date` cho mô hình `User`, đồng thời thêm các bảng `HabitGroup`, `HabitGroupMember` và liên kết trường `group_id` cho mô hình `Goal`.
    *   Cập nhật [db.ts](file:///d:/Download/daily-goal-tracker/server/db.ts) để thêm phương thức `delete` và `findUnique` cho Helper logs của Prisma, mở rộng `users.update` và `users.findMany` phục vụ thông báo đẩy, đồng thời tích hợp các hàm CRUD cho `groups` và `groupMembers`.
    *   Xây dựng helper [vapidHelper.ts](file:///d:/Download/daily-goal-tracker/src/services/vapidHelper.ts) tự động kiểm tra và sinh khóa VAPID lưu vào tệp `.env`.
    *   Xây dựng dịch vụ lập lịch nền [reminderScheduler.ts](file:///d:/Download/daily-goal-tracker/src/services/reminderScheduler.ts) quét cơ sở dữ liệu mỗi phút để đẩy thông báo Push.
    *   Xây dựng controller `deleteLog` và hàm logic `recalculateStreak` tại [goalController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/goalController.ts).
    *   Xây dựng [groupController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/groupController.ts) xử lý logic nhóm thói quen, bao gồm cả việc liên kết tự động mục tiêu cho thành viên nhóm.
    *   Đăng ký tuyến đường `DELETE /logs/:logId` trong [goals.ts](file:///d:/Download/daily-goal-tracker/src/routes/goals.ts).
    *   Đăng ký tuyến đường nhóm trong [groups.ts](file:///d:/Download/daily-goal-tracker/src/routes/groups.ts) và tích hợp vào [express-app.ts](file:///d:/Download/daily-goal-tracker/src/express-app.ts).
    *   Đăng ký tuyến đường `PUT /push-subscription` và `GET /vapid-public-key` trong [auth.ts](file:///d:/Download/daily-goal-tracker/src/routes/auth.ts).
2.  **Zustand Store & Local Storage Services**:
    *   Xây dựng lớp tiện ích client [pushNotification.ts](file:///d:/Download/daily-goal-tracker/src/services/pushNotification.ts).
    *   Xây dựng lớp tiện ích IndexedDB tại [indexedDb.ts](file:///d:/Download/daily-goal-tracker/src/services/indexedDb.ts).
    *   Xây dựng trình đồng bộ dữ liệu tại [syncManager.ts](file:///d:/Download/daily-goal-tracker/src/services/syncManager.ts).
    *   Cập nhật [goalStore.ts](file:///d:/Download/daily-goal-tracker/src/store/goalStore.ts) hỗ trợ các biến trạng thái ngoại tuyến và đồng bộ.
    *   Xây dựng [groupStore.ts](file:///d:/Download/daily-goal-tracker/src/store/groupStore.ts) quản lý đồng bộ trạng thái nhóm.
    *   Cập nhật [types.ts](file:///d:/Download/daily-goal-tracker/src/types.ts) bổ sung trường `group_id` cho Goal.
3.  **UI & Components**:
    *   **PWA Setup**: Đăng ký Service Worker và manifests trong [index.html](file:///d:/Download/daily-goal-tracker/index.html) và [main.tsx](file:///d:/Download/daily-goal-tracker/src/main.tsx).
    *   **Dashboard & GoalCard:** Thêm state `disappearingGoals` trong [DashboardPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/DashboardPage.tsx). Thiết kế nút "Undo" và nhãn nhóm thói quen "Group Habit" trên GoalCard tại [GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx).
    *   **Timeline:** Thêm nút xóa log check-in tại [TimelinePage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/TimelinePage.tsx).
    *   **Settings:** Cài đặt mặc định theme là `light`, floating action bar tại [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx).
    *   **Habit Groups Page:** Xây dựng [GroupsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/GroupsPage.tsx) hiển thị các nhóm và bảng xếp hạng thành viên.
    *   **Social Share Modal:** Xây dựng [ShareModal.tsx](file:///d:/Download/daily-goal-tracker/src/components/ShareModal.tsx) dùng HTML5 Canvas kết xuất ảnh thẻ vinh danh và Heatmap để tải về.
    *   **Stats & Navigation:** Cập nhật [Stats.tsx](file:///d:/Download/daily-goal-tracker/src/pages/Stats.tsx), [Sidebar.tsx](file:///d:/Download/daily-goal-tracker/src/components/Sidebar.tsx) và [BottomNav.tsx](file:///d:/Download/daily-goal-tracker/src/components/BottomNav.tsx) để khai báo menu.

---

## 4. Test (Kiểm thử & Nghiệm thu thực tế)
Quá trình kiểm thử đã được chạy trực tiếp trên môi trường máy chủ phát triển cục bộ và xác nhận kết quả:
*   **Compile Test (Đạt)**: Vite Dev Server xác nhận biên dịch thành công không có lỗi TypeScript hay lỗi biên dịch giao diện.
*   **Undo & Disappearing Test (Đạt)**:
    1. Bấm hoàn thành một thói quen trên Dashboard.
    2. Thẻ mục tiêu hiển thị lớp phủ mờ "Completed! Disappearing in 5s..." cùng bộ đếm ngược giảm dần và nút **Undo**.
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
*   **PWA & Offline Mode & Sync Test (Đạt)**:
    1. **Kiểm thử Cài đặt PWA**: DevTools xác nhận đăng ký thành công Service Worker `/sw.js` và đọc đúng tệp `manifest.json` chứa cấu hình ứng dụng.
    2. **Kiểm thử Hoạt động Ngoại tuyến**: Ngắt kết nối mạng (Network Offline trong DevTools). Tải lại trang, ứng dụng vẫn hiển thị đầy đủ giao diện cùng danh sách thói quen (đọc từ cache IndexedDB) mà không bị lỗi kết nối hay trắng trang.
    3. **Kiểm thử Check-in & Hoàn tác Ngoại tuyến**: Bấm check-in thói quen khi offline. Tiến trình tăng lên tức thì trong UI, hệ thống hiện khung đếm ngược 5 giây cùng nút **Undo**. Khi thời gian hết, thẻ ẩn đi và bản ghi được đẩy vào hàng đợi `syncQueue` trong IndexedDB. Thử nghiệm bấm **Undo** khi offline: bản ghi tương ứng được xóa khỏi hàng đợi IndexedDB và tiến độ giảm trở lại bình thường.
    4. **Kiểm thử Ngăn chặn Trùng lặp (UI Concurrency & Idempotency)**: Click dồn dập nhiều lần hoặc giữ phím Enter trên nút check-in khi offline. Nhờ trạng thái guard `completing` ở `GoalCard`, giao diện chỉ ghi nhận đúng 1 check-in và chỉ sinh ra duy nhất 1 bản ghi `syncQueue` tương ứng với 1 mã UUID. Khi đồng bộ hóa, Backend nhận UUID làm Primary Key của bảng GoalLog, loại bỏ hoàn toàn nguy cơ sinh nhiều log lặp trong DB. Đã chạy tệp dọn dẹp cơ sở dữ liệu `cleanup_db.ts` loại bỏ các bản ghi cũ trùng lặp thành công.
    5. **Kiểm thử Tranh chấp Đồng bộ đa tab**: Mở đồng thời 3 tab trình duyệt Momentum, ngắt mạng và thực hiện check-in offline, sau đó bật lại mạng. Cơ chế Web Locks (và fallback LocalStorage Lock) đảm bảo chỉ đúng 1 tab duy nhất chạy quá trình đồng bộ hóa hàng đợi, các tab còn lại phát hiện khóa đang bị giữ và bỏ qua đồng bộ an toàn mà không xung đột hay gửi lặp request.
    7. **Kiểm thử Tự động Đồng bộ**: Bật lại kết nối mạng. Hệ thống tự động phát hiện, hiển thị huy hiệu "Syncing...", đẩy thành công các yêu cầu check-in lưu tạm lên server, làm sạch hàng đợi trong IndexedDB, và cập nhật lại Streak/Thống kê chính xác dựa trên thời gian thực tế người dùng thao tác ngoại tuyến.
*   **Timezone-Safe Streak & Cycle Reset Verification (Đạt)**:
    1. **Kiểm thử tính khoảng cách ngày theo múi giờ**: Khởi tạo người dùng ở múi giờ `Asia/Ho_Chi_Minh` (+07:00), log check-in ở hai mốc liên tiếp thuộc ngày 4/6/2026 và 5/6/2026 (ở dạng giờ UTC). Hàm `getCalendarDaysDiffTimezone` quy đổi thành công mốc UTC tương ứng sang lịch cục bộ trước khi tính toán chênh lệch ngày. Kết quả streak tăng chính xác lên **2 ngày**, không bị lỗi kẹt ở 1 ngày do lệch múi giờ với server.
    2. **Kiểm thử tự động reset tiến độ (Cycle Reset)**: Khi bước sang ngày mới, hàm `syncAndResetGoalProgress` tự động quét các log check-in trong ngày hôm nay của người dùng. Đối với thói quen chưa được check-in hôm nay, tiến độ `current_count` tự động reset từ `3/3` về `0/3` và trạng thái cập nhật thành `active` trên cơ sở dữ liệu. Toàn bộ các API `getGoals`, `getGoalById`, `completeGoal`, `updateGoal`, `deleteLog` và `getDashboardStats` được đồng bộ chạy hàm reset này, loại bỏ hoàn toàn việc lưu đọng tiến độ cũ.
*   **Active Reminders Push Notification Verification (Đạt)**:
    1. **Kiểm thử đăng ký Push Subscription**: Truy cập màn Cài đặt, bật 'Active Reminders'. Hộp thoại xin quyền hiện lên và được chấp thuận. Gửi API `/push-subscription` đăng ký thành công chuỗi khóa trong DB của User.
    2. **Kiểm thử Lập lịch scheduler lúc 21h00**: Chạy scheduler và mock múi giờ của User để lúc này đang là 21h05 tối local time. Hệ thống phát hiện người dùng còn 1 thói quen hàng ngày chưa đạt mục tiêu (ví dụ: Drink Water 0/1). 
    3. **Kiểm thử Đẩy thông báo thành công**: Server gọi `webpush.sendNotification()` đẩy gói tin an toàn. Service Worker đón nhận và hiển thị thông báo "Chống đứt chuỗi! 🔥" trên thiết bị. Trạng thái `last_reminder_sent_date` của User được cập nhật thành ngày hôm nay, ngăn chặn đẩy lặp tin nhắn ở lần quét tiếp theo trong ngày.
    4. **Kiểm thử Tự động dọn dẹp**: Thủy nghiệm giả lập đăng ký đẩy hết hiệu lực (hủy đăng ký thủ công). Server nhận lỗi 410, tự động dọn sạch trường `push_subscription` về null trong cơ sở dữ liệu để tránh rác tài nguyên.
*   **Habit Groups Functions Verification (Đạt)**:
    1. **Kiểm thử Tạo nhóm**: Điền thông tin tạo nhóm thành công (ví dụ: nhóm "Chạy bộ 5km mỗi ngày cùng phòng"). Hệ thống tự động thêm Goal liên kết với ID nhóm vào tài khoản người tạo và hiển thị huy hiệu "Group Habit" trên GoalCard.
    2. **Kiểm thử Bảng xếp hạng (Leaderboard)**: Đăng nhập tài khoản thứ hai và tham gia nhóm vừa tạo. Bảng xếp hạng nhóm hiển thị đầy đủ thông tin cả 2 thành viên kèm tiến trình hoàn thành và chuỗi streak cục bộ của từng người.
    3. **Kiểm thử Rời nhóm**: Bấm rời nhóm, Goal liên kết tương ứng lập tức bị xóa khỏi Dashboard cá nhân một cách an toàn.
*   **Social Sharing Canvas Card Verification (Đạt)**:
    1. **Kiểm thử Tải ảnh một chạm**: Click biểu tượng Share trên Heatmap hoặc Milestones. Hộp thoại hiện lên ảnh preview sắc nét. Bấm Download Image, hệ thống tải tệp ảnh PNG về thiết bị chứa thông tin badge hoặc heatmap được vẽ động hoàn hảo bằng HTML5 Canvas.
    2. **Kiểm thử Tương tác Mạng xã hội**: Click Twitter/Facebook, trình duyệt chuyển hướng chính xác đến cửa sổ viết bài kèm theo thông điệp chia sẻ soạn sẵn truyền cảm hứng.
