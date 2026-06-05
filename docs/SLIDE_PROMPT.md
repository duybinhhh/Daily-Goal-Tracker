# PROMPT YÊU CẦU AI TẠO SLIDES CHO DỰ ÁN MOMENTUM

Tài liệu này chứa cấu trúc prompt nâng cao, tổng hợp toàn diện và chi tiết tất cả tài liệu kỹ thuật của dự án **Momentum: Daily Goal Tracker (Premium Edition)**. Bạn hãy **sao chép toàn bộ nội dung trong khung bên dưới** (từ hàng `Hãy đóng vai trò...` đến hết) và dán vào các công cụ AI tạo slide (như ChatGPT, Claude, Gamma.app, Tome.app) để tạo ra bộ slide thuyết trình kỹ thuật cao cấp, chuyên nghiệp và có chiều sâu.

---

```text
Hãy đóng vai trò là một Chuyên gia thiết kế Slide thuyết trình chuyên nghiệp kiêm Kiến trúc sư giải pháp phần mềm cao cấp. Tôi muốn bạn thiết kế nội dung chi tiết cho một bộ Slide (gồm 12 slide) giới thiệu về dự án phần mềm của tôi: "Momentum: Daily Goal Tracker (Premium Edition)".

Yêu cầu chung:
- Ngôn ngữ hiển thị trên Slide: Tiếng Việt.
- Văn phong: Chuyên nghiệp, hiện đại, cuốn hút và mang tính kỹ thuật cao (tech-savvy).
- Mỗi Slide trong phản hồi cần được cấu trúc rõ ràng với các mục:
  1. Tiêu đề Slide (Slide Title)
  2. Bố cục đề xuất (Suggested Layout - ví dụ: Bento Grid, 2 cột bất đối xứng, Timeline thời gian, Lưới so sánh...)
  3. Nội dung văn bản hiển thị trên slide (Các Bullet points ngắn gọn, đắt giá, sử dụng số liệu và thuật ngữ kỹ thuật, không viết lan man)
  4. Lời thoại chi tiết cho người thuyết trình (Presenter Notes - viết trôi chảy, giải thích sâu các khía cạnh kỹ thuật và trải nghiệm người dùng)
  5. Ý tưởng thiết kế trực quan (Visual & Icon Suggestions - màu sắc chủ đạo, icon, hình ảnh minh họa phù hợp với slide)

Dưới đây là thông tin chi tiết được tổng hợp từ toàn bộ tài liệu đặc tả dự án (SPEC, ARCHITECTURE, USER GUIDE, PLAN, VIBE VERIFICATION):

=======================================================
TỔNG HỢP CHI TIẾT DỰ ÁN: MOMENTUM DAILY GOAL TRACKER
=======================================================

1. ĐỊNH VỊ SẢN PHẨM & GIÁ TRỊ CỐT LÕI:
- Tên dự án: Momentum: Daily Goal Tracker (Premium Edition).
- Định vị: Ứng dụng theo dõi và quản lý thói quen cá nhân hàng ngày cao cấp, hướng đến việc xây dựng kỷ luật bản thân thông qua trải nghiệm người dùng tối ưu (Premium UI/UX), trực quan hóa dữ liệu bento-grid và các đột phá kỹ thuật giải quyết triệt để vấn đề mất streak, hoạt động ngoại tuyến.
- Điểm khác biệt lớn nhất: Hoạt động ngoại tuyến đồng bộ an toàn (Offline-first PWA), công cụ tính toán streak an toàn múi giờ (Timezone-Aware Streak Engine), nhắc nhở thông minh chống đứt chuỗi (Active Web Push Reminders), và cơ chế hoàn tác 5 giây (Undo Engine) tiện dụng.

2. HỆ THỐNG THẨM MỸ & UI/UX (PLAN.MD):
- Phong cách: Glassmorphism (nền mờ, viền bán trong suốt) tạo độ sâu, tinh tế và cao cấp.
- Màu sắc chủ đạo (Accent Colors):
  + Dark Mode (Mặc định): Nền Slate-950 (`#020617`), chữ Slate-800 (`#1e293b`).
  + Light Mode (Khởi tạo lần đầu): Nền xám sáng, các thẻ kính mờ trắng đục contrast cao.
  + Điểm nhấn: Indigo-600 (`#4f46e5`) cho nút bấm chính | Orange-500 (`#f97316`) cho Streak/Lửa | Emerald-500 (`#10b981`) cho Success.
- Typography: Font 'Inter' cho phần thân (Body) và 'Space Grotesk' cho tiêu đề chính để tăng độ cá tính và hiện đại.
- Hiệu ứng động: Sử dụng thư viện Motion (Framer Motion) cho hoạt ảnh vi mô (confetti chúc mừng, ngọn lửa nhảy số).

3. TECH STACK (ARCHITECTURE.MD):
- Frontend: React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Zustand + Axios Interceptor.
- Backend: Node.js + Express + TypeScript (`tsx`).
- Database: PostgreSQL (môi trường sản xuất) thông qua Prisma ORM. Cục bộ sử dụng File DB (JSON) được đóng gói qua `server/db.ts` mô phỏng chính xác mô hình dữ liệu Prisma giúp dễ dàng chạy thử mà không cần cài đặt SQL phức tạp.
- Authentication: JWT (Access Token 15 phút + Refresh Token 7 ngày) kèm Axios Interceptors tự động làm mới phiên làm việc.
- Offline Cache & Queue: IndexedDB (lưu trữ cục bộ dữ liệu thói quen và hàng đợi check-in offline).
- PWA Engine: Service Worker (`sw.js`) cache app shell tĩnh + Web App Manifest (`manifest.json`) hỗ trợ cài đặt lên màn hình chính và lối tắt PWA Shortcuts.
- Web Push: Thư viện `web-push` ở backend gửi thông báo đẩy qua chuẩn bảo mật VAPID.
- Social Share Card Renderer: HTML5 Canvas API kết xuất thẻ vinh danh chất lượng cao 1200x630px phía client.

=======================================================
CHI TIẾT 12 SLIDES YÊU CẦU THIẾT KẾ:
=======================================================

SLIDE 1: Trang tiêu đề (Title Slide)
- Tiêu đề: Momentum: Daily Goal Tracker (Premium Edition)
- Slogan: Định nghĩa lại kỷ luật bản thân bằng công nghệ và thiết kế đỉnh cao.
- Bố cục đề xuất: Thiết kế tối giản (Minimalist/Dark mode), tên dự án nổi bật chính giữa sử dụng gradient chữ, logo Momentum dạng ngọn lửa phát sáng mờ.
- Nội dung văn bản: 
  + Ứng dụng quản lý mục tiêu & xây dựng thói quen hàng ngày cao cấp.
  + Trải nghiệm Premium UI/UX kết hợp các đột phá công nghệ offline-first và bảo vệ Streak.
  + Tác giả/Nhóm thực hiện.
- Presenter Notes: Xin chào mọi người, hôm nay tôi xin giới thiệu Momentum - một ứng dụng theo dõi mục tiêu cá nhân cao cấp. Không chỉ là một app to-do list thông thường, Momentum kết hợp ngôn ngữ thiết kế Glassmorphism thời thượng cùng kiến trúc công nghệ mạnh mẽ để giúp người dùng duy trì thói quen và kỷ luật bản thân một cách khoa học, mượt mà nhất.
- Đề xuất hình ảnh: Icon ngọn lửa gradient cam-vàng tỏa sáng nhẹ, nền tối slate với hiệu ứng kính mờ (glassmorphism filter).

SLIDE 2: Vấn đề & Nỗi đau của thị trường (The Problem & Market Pain Points)
- Tiêu đề: Tại sao người dùng bỏ cuộc khi xây dựng thói quen?
- Bố cục đề xuất: Lưới so sánh 2x2 hoặc 4 cột dọc chỉ rõ 4 vấn đề lớn.
- Nội dung văn bản:
  + Mất chuỗi (Streak) oan uổng: Sự lệch pha múi giờ giữa máy chủ (UTC) và múi giờ địa phương của người dùng (khi đi du lịch hoặc lệch múi giờ hệ thống) khiến chuỗi streak dày công xây dựng bị reset về 0.
  + Mất mạng = Không hoạt động: Khi tập luyện ở hầm gym, chạy bộ công viên mất sóng 4G/Wifi, ứng dụng thông thường bị treo hoặc lỗi kết nối.
  + Giao diện nhàm chán: Thiếu các tương tác vi mô tạo động lực, dashboard chồng chéo thông tin.
  + Cô độc & Thiếu tính lan tỏa: Người dùng tự kỷ luật một mình dễ nản lòng; khó chia sẻ thành tựu một cách đẹp mắt lên mạng xã hội.
- Presenter Notes: Chúng tôi nghiên cứu sâu và thấy 4 rào cản chính khiến người dùng từ bỏ app thói quen. Thứ nhất là lỗi hệ thống gây đứt streak oan uổng do lệch múi giờ. Thứ hai là mất kết nối mạng ở các khu vực khuất sóng khiến app tê liệt. Thứ ba là giao diện khô khan, không tạo cảm hứng tương tác. Và thứ tư là sự thiếu kết nối cộng đồng. Momentum được sinh ra để xử lý triệt để những nỗi đau này.
- Đề xuất hình ảnh: Icon ngọn lửa bị dập tắt (đứt streak), icon không có sóng mạng (offline), icon màn hình lỗi.

SLIDE 3: Giải pháp từ Momentum (The Solution Overview)
- Tiêu đề: Hệ sinh thái theo dõi thói quen cao cấp Momentum
- Bố cục đề xuất: Trực quan hóa 4 trụ cột giải pháp dạng vòng tròn trung tâm hoặc sơ đồ khối kết nối.
- Nội dung văn bản:
  + Timezone-Aware Streak Engine: Thuật toán bảo vệ streak thông minh dựa trên múi giờ thực tế của tài khoản.
  + Offline-First PWA: Hoạt động không cần mạng, tự động đồng bộ hóa an toàn khi online trở lại.
  + Premium Glassmorphism UI: Giao diện mờ mịn tinh tế, tối ưu hóa hiển thị, tự động ẩn thói quen hoàn thành kèm Undo 5 giây.
  + Accountability & Social Sharing: Nhóm thói quen đồng hành (Habit Groups) và kết xuất canvas thẻ vinh danh chia sẻ một chạm.
- Presenter Notes: Giải pháp của chúng tôi là một hệ sinh thái đồng bộ. Momentum mang lại sự yên tâm tuyệt đối với thuật toán Streak an toàn múi giờ và chế độ offline hoàn thiện. Đồng thời, thiết kế kính mờ cao cấp và các tính năng tương tác nhóm, chia sẻ mạng xã hội sẽ chuyển đổi việc rèn luyện thói quen từ một nghĩa vụ khô khan thành một niềm vui hàng ngày.
- Đề xuất hình ảnh: Icon lá chắn bảo vệ ngọn lửa, biểu tượng đồng bộ hai chiều, giao diện dashboard điện thoại đẹp mắt.

SLIDE 4: Trải nghiệm người dùng Premium & Smart Dashboard
- Tiêu đề: Premium UI/UX & Cơ chế hoàn tác thông minh (Undo Engine)
- Bố cục đề xuất: Cột đôi bất đối xứng (Trái: Hình ảnh Mockup Dashboard; Phải: Các tính năng UI/UX nổi bật).
- Nội dung văn bản:
  + Glassmorphism & Tùy biến: Thiết kế nền kính mờ sang trọng, hỗ trợ tùy chỉnh độ mờ đục (Glass Opacity 20% - 95%) qua CSS Variables thời gian thực.
  + Light Mode mặc định: Giao diện sáng dịu mắt làm chủ đạo khi truy cập lần đầu, dễ dàng chuyển đổi Dark Mode (nền Slate-950).
  + Smart Dashboard: Tự động ẩn các thói quen đã hoàn thành để giảm tải thông tin, giữ màn hình sạch sẽ.
  + Undo Engine 5 giây: Khi đạt chỉ tiêu thói quen, màn hình hiển thị đếm ngược 5 giây kèm nút Undo trên thẻ GoalCard để người dùng thu hồi nếu bấm nhầm.
  + Weekly Slider Grid: Thanh lịch trình 7 ngày hiển thị trực quan tiến trình tuần hiện tại.
- Presenter Notes: Chúng tôi rất chú trọng vào thiết kế. Màn hình Dashboard sử dụng ngôn ngữ thiết kế kính mờ Glassmorphism, mặc định là giao diện sáng nhẹ nhàng khi mới cài đặt và có thể đổi sang chế độ tối sâu Slate-950. Khi check-in đủ chỉ tiêu, ví dụ uống đủ 8 cốc nước, thẻ thói quen không biến mất ngay lập tức mà kích hoạt đếm ngược 5 giây cùng nút Undo. Đây là thiết kế chống bấm nhầm vô cùng tinh tế trước khi thẻ tự động ẩn đi để nhường không gian cho việc khác.
- Đề xuất hình ảnh: Ảnh chụp màn hình Dashboard của Momentum hiển thị vòng tròn tiến độ SVG và thẻ GoalCard đang chạy đếm ngược 5 giây.

SLIDE 5: Hệ thống thống kê Bento-Grid chuyên sâu (Premium Stats Dashboard)
- Tiêu đề: Bảng phân tích hiệu năng Momentum Stats (/stats)
- Bố cục đề xuất: Bố cục Bento Grid tương tự trang thống kê của ứng dụng để thể hiện đúng tinh thần UI.
- Nội dung văn bản:
  + Aligned Header: Tiêu đề sticky chứa tìm kiếm mốc thành tựu, huy hiệu chuỗi ngày Streak động toàn cục, xuất CSV và làm mới dữ liệu nhanh.
  + Bento Metrics: Hiển thị tỷ lệ hoàn thành trung bình kèm tính toán so sánh xu hướng tăng trưởng (+/- %) so với tháng trước.
  + Consistency Heatmap (182 ngày): Lưới lịch đóng góp 26 tuần (GitHub-style) tự động căn chỉnh ngày xuất phát về Chủ Nhật, hiển thị tooltip thông tin chi tiết khi rê chuột.
  + Biểu đồ hiệu năng 10 tuần: Nhóm 70 ngày hoạt động gần nhất biểu diễn bằng biểu đồ cột CSS động tự điều chỉnh chiều cao và hiển thị tooltip.
  + Goal Distribution: Biểu đồ tròn Donut vẽ bằng CSS conic-gradient chia tỷ lệ thói quen theo danh mục kèm chú thích màu sắc động.
  + Milestone Feed: Dòng thời gian ghi nhận các cột mốc tự hào (ví dụ: "Consistent Leader" khi đạt Streak >= 10 ngày).
- Presenter Notes: Trang thống kê `/stats` được thiết kế theo cấu trúc Bento Grid hiện đại. Trọng tâm của trang là biểu đồ bản đồ nhiệt Heatmap 182 ngày mô phỏng biểu đồ đóng góp của GitHub nhưng được căn chỉnh ngày bắt đầu về Chủ Nhật để người dùng dễ theo dõi tuần làm việc của mình. Bên cạnh đó, các biểu đồ cột 10 tuần, biểu đồ Donut phân bố danh mục vẽ hoàn toàn bằng CSS conic-gradient và dòng cột mốc Milestone Feed tạo nên bức tranh toàn cảnh trực quan về quá trình tự kỷ luật của người dùng.
- Đề xuất hình ảnh: Hình ảnh trang Stats với lưới Heatmap đóng góp màu xanh lục-indigo nổi bật, biểu đồ donut nhiều màu sắc.

SLIDE 6: Trục thời gian hoạt động & Nhật ký tương tác (Activity Timeline Page)
- Tiêu đề: Trục thời gian hoạt động & Quản lý lịch sử (/timeline)
- Bố cục đề xuất: Chia làm 2 phần (Trái: Lưới tháng Performance Grid; Phải: Danh sách log chi tiết và tính năng).
- Nội dung văn bản:
  + Lưới hiệu năng tháng (Performance Grid): Trực quan hóa trạng thái hoàn thành mỗi ngày trong tháng.
  + Huy hiệu Đột phá (Breakthrough Badge): Tự động đánh dấu sao vàng lấp lánh cho những ngày đạt năng suất cao xuất sắc (hoàn thành từ 3 thói quen trở lên).
  + Bộ lọc tương tác: Nhấp chọn một ngày bất kỳ trên lưới để xem chi tiết danh sách feed check-in của riêng ngày đó; bấm lại để hủy lọc.
  + Xóa log & Tự tính lại Streak: Cho phép xóa check-in lỗi trong quá khứ. Hệ thống tự động tính toán lại chuỗi Streak hiện tại và chuỗi kỷ lục trên DB ngay lập tức.
  + Xuất báo cáo CSV: Tải xuống toàn bộ nhật ký check-in tháng hiện tại dạng file CSV bảng tính về trình duyệt chỉ với 1 chạm.
- Presenter Notes: Trang Timeline hoạt động như một cuốn nhật ký số. Điểm đặc biệt ở đây là Lưới hiệu năng tháng Performance Grid. Mỗi ngày hoàn thành thói quen sẽ có chấm xanh, đặc biệt ngày nào bạn hoàn thành từ 3 thói quen trở lên, hệ thống sẽ gắn một ngôi sao vàng lấp lánh vinh danh sự đột phá. Bạn có thể nhấn vào từng ngày để lọc lịch sử, hoặc xóa một check-in cũ. Khi xóa, hệ thống sẽ tự chạy thuật toán tính lại chuỗi ngày Streak một cách trung thực nhất.
- Đề xuất hình ảnh: Lưới ô vuông tháng có các ngôi sao vàng lấp lánh nổi bật, nút xuất CSV và danh sách log lịch sử.

SLIDE 7: Giải pháp kỹ thuật (1) - Streak Engine an toàn múi giờ & Nhắc nhở chủ động
- Tiêu đề: Thuật toán bảo vệ Streak & Web Push Notifications
- Bố cục đề xuất: Mô hình hóa quy trình logic từ Client gửi timezone đến Server tính toán và Scheduler quét gửi thông báo.
- Nội dung văn bản:
  + Khắc phục lỗi lệch múi giờ: Sử dụng hàm getCalendarDaysDiffTimezone quy đổi chính xác timestamp UTC sang múi giờ tài khoản cấu hình của người dùng (ví dụ: Asia/Ho_Chi_Minh) để tính khoảng cách ngày.
  + Tự động reset theo chu kỳ: Hàm syncAndResetGoalProgress tự động reset bộ đếm current_count thói quen và trạng thái khi chuyển sang ngày/tuần/tháng mới theo múi giờ người dùng.
  + Lập lịch nhắc nhở nền (Scheduler): Tự động chạy ngầm trên máy chủ mỗi phút để quét người dùng có lịch nhắc nhở.
  + Active Web Push Reminders: Gửi thông báo đẩy chuẩn VAPID keys lúc 21h00 tối hàng ngày theo giờ địa phương của người dùng nếu họ còn thói quen chưa hoàn thành. Lưu last_reminder_sent_date chống gửi trùng lặp.
- Presenter Notes: Về mặt kỹ thuật, chúng tôi giải quyết bài toán múi giờ bằng cách không phụ thuộc vào giờ hệ thống của server. Khi người dùng check-in, client gửi timezone của họ lên, backend dùng hàm `getCalendarDaysDiffTimezone` quy đổi để tính toán. Chuỗi ngày Streak được bảo vệ tuyệt đối. Thêm vào đó, hệ thống nhắc nhở chủ động Active Reminders chạy ngầm trên server, quét và gửi tin nhắn đẩy lúc đúng 21h00 tối theo giờ của thiết bị người dùng nếu họ quên check-in thói quen trong ngày, giúp ngăn chặn đứt chuỗi một cách hiệu quả.
- Đề xuất hình ảnh: Sơ đồ luồng logic đồng hồ múi giờ lệch nhau, biểu tượng tin nhắn push notification hiện lên màn hình khóa điện thoại.

SLIDE 8: Giải pháp kỹ thuật (2) - Kiến trúc Ngoại tuyến & Đồng bộ hóa sau
- Tiêu đề: Offline-First Architecture & Cơ chế chống Race Condition
- Bố cục đề xuất: Sơ đồ luồng dữ liệu 3 lớp (UI Client <=> IndexedDB <=> Server API).
- Nội dung văn bản:
  + App Shell Caching: Service Worker (sw.js) lưu bộ đệm tĩnh giúp tải ứng dụng tức thì không cần mạng.
  + Offline Storage: Sử dụng IndexedDB để lưu trữ đệm dữ liệu thói quen và lưu hàng đợi check-in/hoàn tác (syncQueue) dưới trình duyệt.
  + Đồng bộ tự động (Auto Sync): Phát hiện sự kiện online, tự động đẩy hàng đợi lên Server kèm mốc thời gian hoàn thành gốc (completed_at) để tính lại Streak chính xác.
  + Web Locks API: Khóa concurrency đa tab, đảm bảo chỉ có duy nhất 1 tab xử lý đồng bộ hóa hàng đợi lên Server (tránh xung đột dữ liệu).
  + Chống trùng lặp tuyệt đối (Idempotency): Client sinh mã UUID duy nhất (log_id) làm khóa chính (Primary Key) lưu vào DB GoalLog, triệt tiêu nguy cơ gửi trùng lặp log khi bấm liên tiếp hoặc mạng chập chờn.
  + Giao diện hợp nhất (UI State Merging): Gộp dữ liệu local syncQueue vào state nhận từ server để UI hiển thị mượt mà, không bị giật lag quay lại trạng thái cũ khi đồng bộ.
- Presenter Notes: Momentum là ứng dụng thiết kế theo triết lý Offline-first thực thụ. Khi không có mạng, Service Worker đảm bảo app tải bình thường, IndexedDB lưu trữ dữ liệu check-in tạm thời. Khi mạng có lại, hệ thống tự động đồng bộ. Để tránh xung đột khi người dùng mở nhiều tab trình duyệt cùng lúc, chúng tôi sử dụng Web Locks API để khóa đồng bộ đa tab. Đồng thời, cơ chế UUID đóng vai trò khóa chính (Primary Key) trong database giúp loại bỏ hoàn toàn các bản ghi bị nhân bản (Race Condition) do double-click hoặc lỗi gửi lại mạng.
- Đề xuất hình ảnh: Sơ đồ IndexedDB kết nối với server qua Sync Manager, icon ổ khóa đa tab (Web Locks).

SLIDE 9: Cộng đồng & Lan tỏa: Habit Groups & Social Sharing Canvas
- Tiêu đề: Đồng đội giám sát & Chia sẻ một chạm
- Bố cục đề xuất: Hai cột song song (Trái: Tính năng Habit Groups; Phải: Cơ chế kết xuất thẻ Canvas chia sẻ).
- Nội dung văn bản:
  + Habit Groups (/groups): Tạo/tham gia nhóm thói quen chung. Tự động sinh mục tiêu cá nhân đồng bộ trực tiếp lên Dashboard và PWA Offline.
  + Real-time Leaderboard: Bảng xếp hạng tiến độ hiển thị chi tiết số lượng hoàn thành hôm nay và ngọn lửa Streak động của từng thành viên trong nhóm.
  + HTML5 Canvas Renderer: Kết xuất thẻ vinh danh (Milestone Card) hoặc lưới hoạt động Heatmap chất lượng cao (1200x630px) ngay tại client với hiệu ứng kính mờ và viền kim loại sang trọng.
  + Chia sẻ một chạm: Tải ảnh PNG chất lượng cao, gọi Web Share API gốc của di động, hoặc tạo link intent chia sẻ lên Twitter/Facebook chỉ với 1 click.
- Presenter Notes: Để tạo động lực kỷ luật chéo, Momentum giới thiệu Habit Groups. Khi gia nhập nhóm chạy bộ hay đọc sách, hệ thống tự động đồng bộ thói quen này lên Dashboard của bạn. Bạn có thể theo dõi bảng xếp hạng Leaderboard của nhóm theo thời gian thực để cùng thi đua duy trì chuỗi Streak. Đặc biệt, khi đạt thành tích, bạn có thể bấm Share. Một thẻ vinh danh chất lượng cao chuẩn HD 1200x630px được vẽ động trực tiếp bằng HTML5 Canvas để bạn lưu về hoặc chia sẻ thẳng lên Twitter, Facebook chỉ bằng một nút bấm.
- Đề xuất hình ảnh: Giao diện bảng xếp hạng Leaderboard nhóm có ngọn lửa phát sáng cạnh tên thành viên, bên cạnh là hình ảnh thẻ Canvas vinh danh thiết kế sang trọng.

SLIDE 10: Lối tắt check-in tối giản & Trải nghiệm Widget Di động
- Tiêu đề: PWA Shortcuts & Trang Check-in nhanh di động
- Bố cục đề xuất: Mockup điện thoại dọc hiển thị màn hình check-in tối giản cực lớn.
- Nội dung văn bản:
  + PWA Shortcuts: Nhấn giữ biểu tượng ứng dụng ngoài màn hình chính điện thoại để kích hoạt phím tắt mở trực tiếp màn hình check-in nhanh (/quick-checkin).
  + Giao diện một chạm tối giản: Thiết kế layout tối ưu với các nút bấm kích thước lớn, phân tách rõ ràng mục tiêu đã hoàn thành và chưa hoàn thành.
  + Phản hồi xúc giác (Haptic Feedback): Gọi Web Vibration API để rung nhẹ thiết bị khi người dùng check-in thành công (rung đơn) hoặc hoàn tác (rung kép), tạo cảm giác bấm phím cơ vật lý.
  + Hoàn tác nhanh: Hỗ trợ thanh đếm ngược 5 giây kèm nút Undo trực quan ngay trên trang check-in nhanh để sửa đổi nhanh các lượt chạm nhầm.
- Presenter Notes: Chúng tôi tối ưu hóa trải nghiệm check-in trên di động thông qua phím tắt PWA Shortcuts ngoài màn hình chính. Người dùng nhấn giữ icon app và chọn "Check-in nhanh" để mở trang `/quick-checkin` tối giản. Không còn các biểu đồ rườm rà, giao diện chỉ gồm các nút chạm rất lớn. Để tăng trải nghiệm vật lý, chúng tôi tích hợp Web Vibration API. Mỗi lần check-in thành công, điện thoại sẽ rung nhẹ một nhịp haptic phản hồi, và rung kép khi hoàn tác thói quen, mang lại trải nghiệm như một widget native của hệ điều hành.
- Đề xuất hình ảnh: Hình ảnh nhấn giữ ngón tay trên biểu tượng ứng dụng điện thoại hiển thị menu Shortcuts, và màn hình check-in với các nút bấm lớn kèm làn sóng sóng rung mô phỏng.

SLIDE 11: Kiến trúc hệ thống & Mô hình Dữ liệu (System Architecture)
- Tiêu đề: Kiến trúc hệ thống & Database Schema tối ưu
- Bố cục đề xuất: Sơ đồ thực thể quan hệ cơ sở dữ liệu (ER Diagram) đơn giản hóa.
- Nội dung văn bản:
  + Ba tầng kiến trúc: Client (React 19, Zustand) <=> API Gateway (Express, JWT Guard) <=> Database (PostgreSQL, Prisma).
  + Thực thể chính trong Schema:
    - User: Lưu thông tin tài khoản, cấu hình múi giờ timezone, push subscription và ngày gửi thông báo gần nhất.
    - Goal: Lưu thông tin mục tiêu thói quen cá nhân hoặc nhóm, tần suất (daily, weekly, monthly), trạng thái (active, paused).
    - GoalLog: Lưu lịch sử từng lần check-in cụ thể (completed_at). Sử dụng log_id làm khóa chính để chống trùng dữ liệu.
    - Streak: Theo dõi current_streak và longest_streak thực tế của từng thói quen để truy vấn nhanh.
    - HabitGroup & HabitGroupMember: Quản lý thông tin nhóm và mối quan hệ thành viên để lập Leaderboard tiến trình.
- Presenter Notes: Đây là bức tranh kiến trúc hệ thống của Momentum. Chúng tôi xây dựng mô hình cơ sở dữ liệu quan hệ tối ưu bằng Prisma ORM kết hợp PostgreSQL. Các bảng User, Goal, GoalLog và Streak được liên kết chặt chẽ hỗ trợ cascade deletion để tối ưu hóa tài nguyên. Bằng việc lưu trữ thông tin Streak và log check-in riêng biệt, chúng tôi vừa đảm bảo hiệu năng truy vấn nhanh cho Dashboard, vừa sẵn sàng tính toán lại dữ liệu lịch sử một cách chính xác nhất khi có thay đổi.
- Đề xuất hình ảnh: Sơ đồ kiến trúc 3 tầng và các bảng cơ sở dữ liệu kết nối với nhau bằng các đường link khóa ngoại.

SLIDE 12: Đảm bảo chất lượng & Định hướng tương lai (QA & Future Roadmap)
- Tiêu đề: Quy trình VIBE Verification & Lộ trình phát triển
- Bố cục đề xuất: Trục thời gian tiến trình (Timeline Roadmap) kết hợp các điểm checklist kiểm thử.
- Nội dung văn bản:
  + Quy trình kiểm thử VIBE: 4 bước nghiêm ngặt (Plan -> Doc -> Build -> Test) đảm bảo chất lượng phần mềm.
  + Đã xác nhận nghiệm thu (VIBE Verified): Biên dịch thành công 100%, bảo vệ đồng bộ đa tab Web Locks, xử lý trùng lặp UUID, streak an toàn múi giờ, Web Push và Canvas Share hoạt động trơn tru.
  + Lộ trình tương lai:
    - AI Goal Assistant: Tích hợp Gemini API phân tích hành vi để đề xuất điều chỉnh thói quen thông minh và gợi ý lộ trình kỷ luật bản thân.
    - Premium Monetization: Mở rộng cổng thanh toán, gói đăng ký nâng cao cho tính năng nhóm lớn.
    - Native Apps: Đóng gói PWA lên các chợ ứng dụng Google Play Store và Apple App Store thông qua các wrapper chuẩn hóa.
- Presenter Notes: Để dự án vận hành hoàn hảo, chúng tôi áp dụng quy trình kiểm thử 4 bước VIBE nghiêm ngặt. Mọi tính năng từ Web Locks đa tab đến Web Push đều đã được chạy thử và nghiệm thu thành công. Trong tương lai, chúng tôi định hướng tích hợp AI thông qua Gemini API của Google để đóng vai trò là một trợ lý ảo, phân tích lịch sử thói quen và đưa ra lời khuyên cá nhân hóa cho người dùng. Đồng thời, đóng gói ứng dụng để đưa lên các chợ ứng dụng di động chính thức. Xin cảm ơn quý vị đã lắng nghe!
- Đề xuất hình ảnh: Biểu tượng checklist tích xanh cho các tính năng đã test, trục thời gian lộ trình hướng tới AI Assistant và App Store.

=======================================================

Hãy bắt đầu viết nội dung chi tiết và đầy đủ cho từng slide dựa trên các thông tin và yêu cầu trên.
```
