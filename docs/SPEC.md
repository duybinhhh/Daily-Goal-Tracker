# PRODUCT SPECIFICATION (SPEC) - GOAL TRACKING SYSTEM

---

## 1. Tổng quan hệ thống & Đối tượng sử dụng
Hệ thống quản lý mục tiêu cá nhân (**Goal Tracking**) giúp cá nhân thiết lập thói quen, theo dõi tiến độ hàng ngày, tính toán chuỗi ngày hoàn thành liên tục (**Streak**) và xem thống kê trực quan nhằm duy trì động lực kỷ luật bản thân.

---

## 2. Tính năng Core MVP (Giới hạn: 5 tính năng cốt lõi)
> *Áp dụng tinh thần MVP tinh gọn: Tập trung tối đa vào luồng trải nghiệm cốt lõi của một cá nhân, lược bỏ bớt sự cồng kềnh của các tính năng phụ trợ.*

* **Quản lý mục tiêu cá nhân:** Tạo mới, chỉnh sửa, xóa và xem danh sách mục tiêu (`GoalCard`) tích hợp tìm kiếm/lọc nhanh.
* **Đánh dấu tiến độ ngày (Check-in):** Cho phép người dùng bấm hoàn thành/tăng số đếm (`current count`) của mục tiêu trong ngày và ghi vết thời gian tự động.
* **Tính toán chuỗi ngày liên tục (Streak Engine):** Tự động tính toán và cập nhật số ngày duy trì thói quen liên tục ngay khi người dùng log tiến độ.
* **Dashboard & Thống kê trực quan:** Hiển thị tỷ lệ hoàn thành (`Completion Rate`) trong ngày cùng biểu đồ cột/đường (`Streak & Completion Chart`) để theo dõi tiến trình dài hạn.
* **Hệ thống xác thực người dùng cơ bản:** Đăng ký, đăng nhập và đăng xuất để bảo vệ và đồng bộ dữ liệu cá nhân giữa các thiết bị.

---

## 3. Danh sách User Stories & Tiêu chí chấp nhận (AC) cải tiến

### 📦 Module 1: Authentication & State (Sprint 1 — 6.0 SP)
> **Tối ưu hóa:** Gộp các câu chuyện xác thực lại để xử lý tập trung, giảm Story Point thừa.

#### US-01: Quản lý truy cập tài khoản (Đăng ký / Đăng nhập / Đăng xuất)
* **Độ ưu tiên:** High
* **Story Point:** 6.0
* **Tiêu chí chấp nhận (AC):**
    * **Đăng ký:** Người dùng nhập Email (validate đúng định dạng, hệ thống kiểm tra chưa tồn tại trong DB), Mật khẩu (mã hóa an toàn bằng `bcrypt` trước khi lưu vào DB) và Tên.
    * **Đăng nhập:** Xác thực bằng Email và Mật khẩu. Hệ thống kiểm tra thông tin, nếu đúng sẽ trả về cặp `Access Token` (JWT, thời gian sống ngắn) và `Refresh Token` (thời gian sống dài).
    * **Trạng thái Client:** Quản lý trạng thái đăng nhập tập trung ở Client thông qua **Zustand** và tự động đính kèm Token vào các request sau qua *Axios Interceptor*.
    * **Đăng xuất:** Token hiện tại bị vô hiệu hóa ở phía server. Client xóa dữ liệu trong Auth Store và chuyển hướng người dùng về màn hình Login ngay lập tức.

---

### 📦 Module 2: Goal Core Management (Sprint 2 — 8.0 SP)

#### US-02: Thiết lập mục tiêu mới
* **Độ ưu tiên:** High
* **Story Point:** 5.0
* **Tiêu chí chấp nhận (AC):**
    * Form tạo mục tiêu bao gồm: Tên mục tiêu (bắt buộc, không trống), mô tả, chỉ tiêu (`Target count` - bắt buộc là số nguyên dương).
    * Phải validate dữ liệu đầu vào phía Client và Server. Lưu thành công vào cơ sở dữ liệu và tự động cập nhật, hiển thị lại danh sách mục tiêu mới mà không cần reload toàn bộ trang.

#### US-03: Chỉnh sửa và Xóa mục tiêu
* **Độ ưu tiên:** High / Medium
* **Story Point:** 3.0
* **Tiêu chí chấp nhận (AC):**
    * **Chỉnh sửa:** Cho phép cập nhật các thông tin của mục tiêu, dữ liệu thay đổi phải được đồng bộ tức thì lên giao diện hiển thị.
    * **Xóa:** Áp dụng cơ chế **Soft Delete** (gắn flag ẩn dữ liệu thay vì xóa cứng khỏi DB), đảm bảo không làm mất hoặc sai lệch lịch sử thống kê cũ trong bảng `GoalLog` của người dùng.

#### US-04: Bộ lọc danh sách mục tiêu
* **Độ ưu tiên:** Medium
* **Story Point:** 2.0
* **Tiêu chí chấp nhận (AC):**
    * Hiển thị toàn bộ danh sách các mục tiêu đang hoạt động dưới dạng thẻ (`GoalCard`).
    * Tích hợp thanh tìm kiếm theo tên (`Search`) và bộ lọc theo trạng thái (`Filter`: *Tất cả* / *Đã hoàn thành hôm nay* / *Chưa hoàn thành*).

---

### 📦 Module 3: Progress, Streak & Analytics (Sprint 3 — 8.0 SP)

#### US-05: Đánh dấu hoàn thành mục tiêu ngày
* **Độ ưu tiên:** High
* **Story Point:** 4.0
* **Tiêu chí chấp nhận (AC):**
    * Khi người dùng bấm nút tương tác trực tiếp trên `GoalCard`, chỉ số tiến độ hiện tại (`current count`) tăng lên.
    * Hệ thống tự động bắn một bản ghi log vào bảng dữ liệu `GoalLog` để lưu vết thời gian kèm timestamp chính xác của Client phục vụ cho việc tính toán thống kê.
    * **Hoàn tác & Đếm ngược:** Khi một mục tiêu được bấm hoàn thành và đạt chỉ tiêu trong ngày, thẻ mục tiêu hiển thị trạng thái đếm ngược 5 giây kèm nút **Undo** trên Dashboard trước khi ẩn đi. Nếu bấm **Undo**, hệ thống sẽ hủy bỏ check-in đó và khôi phục tiến độ thói quen cũ.

#### US-06: Dashboard & Biểu đồ thống kê (Premium Statistics Overhaul)
* **Độ ưu tiên:** Medium
* **Story Point:** 4.0
* **Tiêu chí chấp nhận (AC):**
    * **Thanh điều hướng đỉnh đồng bộ (Aligned Header):** Tích hợp thanh tiêu đề sticky đồng bộ với Timeline/Dashboard, chứa ô Tìm kiếm milestone thời gian thực, huy hiệu chuỗi ngày Streak động, nút xuất dữ liệu nhanh CSV, và nút làm mới dữ liệu nhanh (Refresh).
    * **Bento Grid chỉ số tổng quan:** Hiển thị tỷ lệ hoàn thành thói quen toàn cục kèm theo tính toán so sánh xu hướng tăng trưởng (+/- %) so với tháng trước một cách trực quan, và bảng phân loại 3 cột thói quen hàng đầu.
    * **Consistency Heatmap (Lịch hoạt động 180 ngày):** Truy vấn lịch sử 182 ngày và tự động căn chỉnh ngày bắt đầu về Chủ Nhật để tạo lưới lịch tuần hoàn hảo (7 dòng x 26 cột) hỗ trợ tooltip chi tiết khi di chuột qua.
    * **Biểu đồ xu hướng hiệu suất 10 tuần:** Phân nhóm tiến độ 70 ngày gần nhất thành 10 tuần gần nhất, vẽ biểu đồ cột CSS động tự điều chỉnh chiều cao và hiển thị chi tiết khi rê chuột.
    * **Biểu đồ tròn Goal Distribution:** Xây dựng biểu đồ tròn Donut động sử dụng `conic-gradient` chia tỉ lệ mục tiêu theo từng danh mục thói quen kết hợp bảng chú thích màu sắc tương ứng.
    * **Milestone Feed:** Hiển thị dòng mốc thành tựu thói quen động (ví dụ: "Achiever Elite Tier Unlocked") và bộ lọc theo từ khóa tìm kiếm.
    * **Seed Dữ liệu mẫu:** Tích hợp tùy chọn Seed Goal từ Backend khi cơ sở dữ liệu trống giúp người dùng nhanh chóng trải nghiệm dashboard thống kê đầy đủ.

#### US-09: Màn hình Trục thời gian hoạt động (Activity Timeline Page)
* **Độ ưu tiên:** Medium
* **Story Point:** 4.0
* **Tiêu chí chấp nhận (AC):**
    * **Lưới hiệu năng tháng (Performance Grid):** Hiển thị lịch dạng ô lưới cho tháng được chọn. Đánh dấu chấm tròn xanh tại các ngày có ghi nhận tiến độ (`GoalLog`) và đánh dấu ngôi sao vàng cho ngày đạt năng suất cao (&ge; 3 completions).
    * **Tương tác bộ lọc:** Nhấn vào ngày bất kỳ trên Grid để lọc tức thì danh sách hoạt động ngày đó ở bảng bên phải. Bấm lại ngày đó để xóa bộ lọc.
    * **Tìm kiếm & Phân loại:** Thanh tìm kiếm lọc động các bản ghi theo tên mục tiêu hoặc ghi chú đi kèm. Có icon phân loại màu sắc cho từng mục tiêu (Sức khỏe, Tập luyện, Công việc, Học tập, Tài chính, Thói quen).
    * **Xóa Log & Tính toán lại Streak:** Mỗi bản ghi log check-in hiển thị biểu tượng Xóa (Trash). Nhấn vào sẽ yêu cầu xác nhận; khi đồng ý, hệ thống gọi API xóa log check-in khỏi DB, tự động giảm tiến độ của thói quen liên quan, tính toán lại chuỗi Streak và đồng bộ tức thì lên giao diện/thống kê.
    * **Cột mốc vinh danh (Milestone Achievements):** Bento cards tự động tính toán để mở khóa danh hiệu "Consistent Leader" (khi chuỗi ngày hiện tại &ge; 10) và "Goal Crusher" (khi tổng check-in tháng hiện tại &ge; 15).
    * **Xuất báo cáo hàng tháng:** Tải file `.csv` chứa danh sách chi tiết các check-in gồm ID log, ID mục tiêu, Tên mục tiêu, Phân loại, Thời gian và Ghi chú đi kèm.

#### US-10: Màn hình danh sách mục tiêu chi tiết (My Goals Page)
* **Độ ưu tiên:** High
* **Story Point:** 4.0
* **Tiêu chí chấp nhận (AC):**
    * **Giao diện Bento Grid & Glassmorphism:** Hiển thị toàn bộ mục tiêu của người dùng trong một lưới bento sang trọng tương tự thiết kế Momentum.
    * **Tìm kiếm & Phân loại linh hoạt:** Bộ lọc tìm kiếm thời gian thực theo tiêu đề hoặc mô tả mục tiêu. Tích hợp các tab lọc nhanh theo trạng thái (Tất cả / Hoạt động / Tạm dừng) đi kèm số đếm số lượng mục tiêu tự động.
    * **Sắp xếp nâng cao:** Sắp xếp danh sách mục tiêu linh hoạt theo: Độ ưu tiên (ngày đến hạn / số lượng chỉ tiêu), Mới nhất (thời gian cập nhật), hoặc Chuỗi Streak cao nhất.
    * **Tương tác nhanh trên thẻ:**
        * Hỗ trợ nút Đăng ký tiến độ nhanh (Log) trực tiếp trên từng thẻ mục tiêu đang hoạt động.
        * Popup Menu hành động (Tạm dừng/Kích hoạt lại, Chỉnh sửa, Xóa) cho từng thẻ mục tiêu. Khi tạm dừng (Paused), thẻ mục tiêu sẽ giảm độ mờ (`opacity-60`) và chuyển sang trạng thái tạm dừng, cho phép người dùng kích hoạt lại bất cứ lúc nào.
    * **Vòng tròn tổng quan (Overall Progress Ring):** Vòng tròn tiến độ lớn tự động tính toán và hiển thị Tỷ lệ hoàn thành trung bình của tất cả các mục tiêu đang hoạt động, kèm các thành tích/danh hiệu (Elite Strategist) để gia tăng động lực.

### 📦 Module 4: Settings & Appearance Customization (Sprint 4 — 6.0 SP)

#### US-07: Quản lý hồ sơ và Cấu hình cá nhân
* **Độ ưu tiên:** High / Medium
* **Story Point:** 4.0
* **Tiêu chí chấp nhận (AC):**
    * Cho phép cập nhật tên hiển thị (Display Name), Email và múi giờ (Timezone) của người dùng hiện tại.
    * Gửi yêu cầu qua API `PUT /api/auth/profile` để đồng bộ thông tin vào Database và cấp lại Access Token mới chứa thông tin cập nhật.
    * Hỗ trợ lưu trữ các cấu hình bật/tắt thông báo dưới client bao gồm: nhắc nhở hàng ngày, thông báo sắp đứt chuỗi Streak, và cột mốc hoàn thành.
    * **Nhắc nhở chủ động chống đứt chuỗi (Active Reminders):** Tích hợp công tắc bật/tắt thông báo đẩy trên giao diện Settings. Khi người dùng bật, trình duyệt sẽ yêu cầu quyền thông báo (`Notification.requestPermission()`) và đăng ký Web Push Subscription thông qua Service Worker. Thông tin Subscription (endpoint, keys) được gửi qua API `PUT /api/auth/push-subscription` và lưu vào DB người dùng. Khi người dùng tắt, hệ thống sẽ gọi unsubscribe và xóa subscription trên DB.
    * Hỗ trợ nút hành động "Export My Data" cho phép trích xuất toàn bộ dữ liệu mục tiêu và lịch sử của người dùng ra file JSON.
    * Hỗ trợ nút hành động "Delete Account" cho phép xóa vĩnh viễn tài khoản kèm toàn bộ dữ liệu liên quan ở backend qua API `DELETE /api/auth/profile` (yêu cầu Modal xác nhận an toàn trước khi xóa).
    * **Thanh tác vụ nổi (Sticky Action Bar):** Nút Lưu cấu hình và Hủy thay đổi được hiển thị nổi cố định (Sticky) ở cạnh đáy trang Settings, giúp người dùng dễ dàng thao tác nhanh mà không cần cuộn trang.

#### US-08: Tùy biến giao diện (Theme & Opacity)
* **Độ ưu tiên:** Medium
* **Story Point:** 3.0
* **Tiêu chí chấp nhận (AC):**
    * Tích hợp bộ chọn chủ đề sáng/tối (Dark/Light Theme) với cơ chế preview trực quan thời gian thực.
    * **Theme Sáng mặc định:** Khi người dùng truy cập ứng dụng lần đầu tiên, giao diện sẽ mặc định chạy Light Theme.
    * Giao diện chế độ sáng (Light Mode) tuân thủ ngôn ngữ Momentum: sử dụng màu nền xám sáng, các thẻ kính mờ màu trắng đục, chữ tối tương phản cao và viền mảnh tinh tế.
    * Cho phép điều chỉnh độ trong suốt của kính mờ (Glass Opacity) qua thanh trượt trong khoảng 20% - 95% bằng cách cập nhật biến CSS trực tiếp.
    * Lưu lựa chọn theme và opacity của người dùng vào `localStorage` để tự động phục hồi ở các phiên làm việc sau.

---

### 📦 Module 5: Offline Mode & Progressive Web App (Sprint 5 — 6.0 SP)

#### US-11: Chế độ Ngoại tuyến & Đồng bộ hóa sau (Offline Mode & Sync)
* **Độ ưu tiên:** High
* **Story Point:** 6.0
* **Tiêu chí chấp nhận (AC):**
    * **Khả năng cài đặt (PWA):** Ứng dụng cung cấp tệp cấu hình `manifest.json` và Service Worker `sw.js` để có thể cài đặt trực tiếp lên màn hình điện thoại hoặc máy tính dưới dạng ứng dụng độc lập (standalone).
    * **Hoạt động Ngoại tuyến (Offline App Shell):** Khi thiết bị mất mạng, Service Worker sẽ tự động tải các tài nguyên giao diện shell (HTML, CSS, JS, phông chữ, biểu tượng) từ bộ nhớ cache, đảm bảo ứng dụng mở lên hoạt động bình thường thay vì hiển thị màn hình lỗi.
    * **Đệm dữ liệu cục bộ (IndexedDB Cache):** Các tài nguyên danh sách thói quen, chỉ số Dashboard và dữ liệu lịch sử sẽ được lưu vào cache IndexedDB. Khi ứng dụng khởi động ở trạng thái offline, hệ thống tự động tải từ cache này và cộng bù trừ số đếm tiến trình cho các thói quen được check-in trong phiên offline.
    * **Hàng đợi Check-in Offline (Sync Queue):** Cho phép người dùng bấm check-in hoặc hoàn tác thói quen khi mất kết nối mạng. Hệ thống tự động tạo mã log tạm thời và đẩy yêu cầu check-in vào hàng đợi `syncQueue` lưu trong IndexedDB.
    * **Đồng bộ hóa Tự động (Auto Sync):** Tự động phát hiện khi thiết bị có mạng trở lại (sự kiện `online`) và kích hoạt gửi các yêu cầu lưu trong hàng đợi lên backend Server. Các check-in được đồng bộ với mốc thời gian thực hiện ban đầu (`completed_at`) để đảm bảo tính đúng đắn cho công cụ Streak Engine và nhật ký Timeline.
    * **Trạng thái Giao diện (Connectivity Badges):** Hiển thị huy hiệu trạng thái mạng "Offline Mode" (màu cam) hoặc "Syncing..." (màu xanh lá xoay tròn) trực quan trên Header để nâng cao trải nghiệm người dùng.
    * **Khóa đồng bộ đa tab (Multi-tab Lock):** Ngăn chặn tranh chấp hàng đợi khi mở ứng dụng ở nhiều tab cùng lúc bằng cơ chế Web Locks API, hoặc tự động fallback sang LocalStorage Lock (có timeout 10 giây tránh deadlock).
    * **Idempotency & Chống trùng lặp:** Sinh UUID định danh duy nhất (`log_id`) ngay khi bấm check-in ở client để gửi lên API. Server sử dụng ID này làm Primary Key cho bảng GoalLog để triệt tiêu việc tạo các log trùng lặp khi thử lại request.
    * **Chặn Concurrency từ giao diện (UI Concurrency Guard):** Tích hợp trạng thái khóa `completing` ở `GoalCard` để ngăn click dồn dập hoặc giữ phím Enter.
    * **Hợp nhất hàng đợi thông minh:** Cập nhật `fetchGoals` và `fetchHistory` để tự động cộng gộp các check-in đang chờ trong `syncQueue` vào dữ liệu fetch từ server, ngăn ngừa giật lag, quay ngược dữ liệu cũ khi online trở lại.

#### US-14: Lối tắt check-in nhanh trên di động (Mobile Quick Widget / PWA Shortcuts)
* **Độ ưu tiên:** High
* **Story Point:** 3.0
* **Tiêu chí chấp nhận (AC):**
    * **PWA Shortcuts:** Cấu hình thuộc tính `shortcuts` trong `manifest.json` để cho phép người dùng mở ứng dụng trực tiếp từ màn hình chính điện thoại bằng cách nhấn giữ biểu tượng và chọn lối tắt "Check-in nhanh" (điều hướng đến `/#/quick-checkin`).
    * **Giao diện tối giản:** Trang `/quick-checkin` hiển thị danh sách các thói quen ngày chưa hoàn thành dưới dạng các nút bấm siêu lớn giúp thao tác dễ dàng trên di động.
    * **Rung phản hồi (Haptic):** Khi bấm check-in, gọi Web Vibration API (`navigator.vibrate`) để phát ra tín hiệu rung phản hồi nhẹ.
    * **Cơ chế Hoàn tác nhanh:** Hiển thị lớp phủ đếm ngược 5 giây trên thẻ thói quen vừa hoàn thành với nút Undo để thu hồi check-in nếu chạm nhầm.
    * **Trạng thái All-Done:** Hiển thị thông điệp vinh danh đầy cảm hứng khi người dùng hoàn thành toàn bộ mục tiêu trong ngày.

---

### 📦 Module 6: Accountability Partners & Social Sharing (Sprint 6 — 8.0 SP)

#### US-12: Đồng đội giám sát (Accountability Partners / Habit Groups)
* **Độ ưu tiên:** High
* **Story Point:** 4.5
* **Tiêu chí chấp nhận (AC):**
    * **Tạo nhóm thói quen chung:** Cho phép người dùng tạo nhóm mới bằng cách khai báo: Tên nhóm, mô tả, tên thói quen chung, phân loại (Health, Fitness, Work, Learning, Routine, Finance), chỉ tiêu và chu kỳ thói quen. Người tạo tự động trở thành thành viên.
    * **Tự động liên kết mục tiêu cá nhân:** Khi người dùng tạo hoặc tham gia nhóm, hệ thống tự động tạo một thói quen tương ứng (`Goal`) liên kết qua trường `group_id` trong tài khoản của họ. Tiến độ check-in thói quen này sẽ được cập nhật đồng thời lên Dashboard cá nhân và bảng tiến độ nhóm.
    * **Bảng tiến độ nhóm (Leaderboard):** Trang chi tiết nhóm hiển thị danh sách các thành viên, số đếm hoàn thành hôm nay (ví dụ: 1/1 Completed, 0/2 Active) và chuỗi Streak hiện tại của từng người (có kèm biểu tượng lửa phát sáng).
    * **Rời nhóm & Xóa nhóm:** Thành viên có thể rời nhóm bất kỳ lúc nào, khi đó hệ thống tự động xóa mục tiêu liên kết của họ để dọn dẹp Dashboard. Người tạo nhóm có quyền xóa nhóm, giải tán tất cả thành viên.
    * **Tích hợp ngoại tuyến:** Check-in thói quen nhóm hoạt động bình thường khi offline qua IndexedDB và tự động đồng bộ khi online trở lại.

#### US-13: Chia sẻ thành tích một chạm (Social Sharing)
* **Độ ưu tiên:** Medium
* **Story Point:** 3.5
* **Tiêu chí chấp nhận (AC):**
    * **Điểm kích hoạt:** Nút Share được bố trí hợp lý cạnh tiêu đề Consistency Heatmap, các thẻ huy hiệu trong Key Milestones (Stats Page) và giao diện nhóm thói quen.
    * **Thẻ vinh danh (Shareable Card):** Giao diện Modal hiển thị bản preview dạng thẻ kính mờ (dark glassmorphism) sang trọng chứa thông tin: Huy hiệu thành tựu (Emoji cúp/lửa lớn), tiêu đề thành tựu, tên người dùng, mô tả thành tích và logo thương hiệu "DailyGoal TRACKER".
    * **HTML5 Canvas Dynamic Renderer:** Canvas ngầm kết xuất hình ảnh thẻ với độ phân giải cao 1200x630px (chuẩn hiển thị mạng xã hội) đảm bảo hiển thị sắc nét các hiệu ứng chuyển màu (gradient) và bo góc.
    * **Thao tác một chạm:**
        * **Download PNG:** Tải trực tiếp ảnh từ Canvas về thiết bị.
        * **Web Share API:** Chia sẻ file ảnh hoặc link thành tích trực tiếp lên các ứng dụng trên thiết bị di động/máy tính hỗ trợ.
        * **Social Share Intent:** Cung cấp link chia sẻ trực tiếp đi kèm thông điệp soạn sẵn lên Twitter và Facebook.

---

## 4. Tech Stack Đề Xuất (Tinh gọn & Đồng bộ)
*Áp dụng tư duy chọn Tech Stack thực tế để tối ưu hóa tốc độ hoàn thiện sản phẩm MVP.*

* **Frontend:** `Next.js` (React Framework) + `Tailwind CSS` + `Zustand` (State Management) + `Axios` (Interceptor điều hướng Token).
* **Backend & Database:** * *Phương án 1:* `Node.js` (`Express`) + `MongoDB` (`Mongoose`) phù hợp cho việc lưu trữ cấu trúc log linh hoạt của bảng `GoalLog`.
    * *Phương án 2:* Sử dụng trực tiếp `Supabase` (`PostgreSQL`) nếu muốn tận dụng hệ thống Auth và Real-time có sẵn để giảm tải gánh nặng code Backend.

---

## 5. Rủi Ro Kỹ Thuật Sớm (Technical Risks)
> *Đúc kết từ thực tế: "Những rủi ro này chỉ thực sự lộ ra khi chúng ta bắt tay vào đụng dữ liệu và viết code".*

### ⚠️ Timezone & Reset chu kỳ ngày
* **Bài toán:** Người dùng đánh dấu mục tiêu lúc 23:30 đêm, nhưng Server đặt tại Mỹ (lệch múi giờ) nhận request lại tính sang ngày hôm sau. Hoặc trường hợp người dùng liên tục di chuyển giữa các quốc gia có múi giờ khác nhau.
* **Giải pháp thiết kế:** Hệ thống phải ghi nhận log thời gian dựa trên chuẩn UTC kết hợp với múi giờ địa phương (`Local Timezone Offset`) do Client gửi lên. Điểm cắt ngày (**Midnight Reset**) để làm mới trạng thái mục tiêu phải dựa trên múi giờ cấu hình của người dùng, không phụ thuộc vào múi giờ mặc định của Server hạ tầng.

### ⚠️ Logic thuật toán tính Streak (Chuỗi ngày liên tục)
* **Bài toán:** Nếu tính toán chuỗi ngày real-time bằng cách quét qua toàn bộ bảng `GoalLog` mỗi lần tải trang, hệ thống sẽ bị tụt giảm hiệu năng trầm trọng (`Performance Drop`) khi tập dữ liệu lớn dần. Ngược lại, nếu chỉ lưu một biến số `streak_count` tĩnh trong bảng Goal, dữ liệu rất dễ bị sai lệch khi người dùng có hành vi sửa đổi log cũ hoặc log bù ngày hôm trước.
* **Giải pháp thiết kế:** Lưu trữ cố định hai trường dữ liệu `current_streak` và `longest_streak` ngay trong bảng dữ liệu Goal. Đồng thời, xây dựng một hàm dịch vụ riêng biệt (`Streak Engine`) chuyên trách việc kiểm tra, đánh giá điểm đứt gãy của chuỗi thói quen tại thời điểm người dùng check-in phát súng đầu tiên trong ngày mới, hoặc khi phát hiện có thao tác can thiệp thay đổi dữ liệu quá khứ.

### ⚠️ Trạng thái đồng bộ giao diện & Trùng lặp dữ liệu (Race Condition & Duplication)
* **Bài toán:** Người dùng bấm nút hoàn thành liên tiếp nhiều lần do kết nối mạng chập chờn hoặc thao tác nhanh (hiện tượng Double Click / giữ phím Enter), hệ thống backend và hàng đợi offline có nguy cơ tạo ra nhiều bản ghi log trùng lặp trong cùng một khoảng thời gian cực ngắn, gây sai lệch nghiêm trọng chỉ số mục tiêu và chuỗi Streak. Đồng thời, trong giai đoạn chuyển đổi offline-to-online, giao diện có thể bị reset tạm thời về trạng thái cũ do server chưa kịp xử lý hàng đợi.
* **Giải pháp thiết kế:** 
    1. **Khóa phía giao diện:** Triển khai cơ chế khóa concurrency trạng thái `completing` tại component `GoalCard` để chặn lập tức các click liên tiếp hoặc phím tắt dồn dập.
    2. **Đảm bảo Idempotency:** Sinh UUID định danh duy nhất (`log_id`) cho check-in ngay tại thời điểm click ở client. Server nhận mã này và lưu trực tiếp làm khóa chính (Primary Key) cho bảng GoalLog trong database, tận dụng cơ chế cưỡng chế khóa chính duy nhất của database để bác bỏ hoàn toàn các yêu cầu gửi trùng lắp.
    3. **Hợp nhất hàng đợi (Smart Merging):** Cải tiến store (`fetchGoals`, `fetchHistory`) tự động đọc hàng đợi `syncQueue` IndexedDB và hợp nhất cục bộ các tác vụ check-in đang chờ đồng bộ vào dữ liệu nhận từ server để giữ trạng thái UI thống nhất, không bị giật lag quay lại trạng thái cũ.