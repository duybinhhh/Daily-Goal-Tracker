# 🎯 HƯỚNG DẪN SỬ DỤNG: MOMENTUM DAILY GOAL TRACKER (PREMIUM EDITION)

Chào mừng bạn đến với **Momentum**, hệ thống theo dõi và quản lý mục tiêu cá nhân hàng ngày cao cấp. Tài liệu này hướng dẫn chi tiết cách vận hành ứng dụng từ thiết lập thói quen, theo dõi tiến độ, kiểm tra thống kê bento-grid cho tới cấu hình tùy chỉnh giao diện và múi giờ.

---

## 📑 Mục Lục
1. [Khởi Đầu Nhanh & Đăng Nhập/Đăng Ký](#1-khởi-đầu-nhanh--đăng-nhậpđăng-ký)
2. [Bảng Điều Khiển Chính (Dashboard) & Cơ Chế Hoàn Tác (Undo Engine)](#2-bảng-điều-khiển-chính-dashboard--cơ-chế-hoàn-tác-undo-engine)
3. [Quản Lý Danh Sách Mục Tiêu (My Goals)](#3-quản-lý-danh-sách-mục-tiêu-my-goals)
4. [Bảng Thống Kê & Phân Tích Hiệu Năng (Premium Stats)](#4-bảng-thống-kê--phân-tích-hiệu-năng-premium-stats)
5. [Trục Thời Gian Hoạt Động (Activity Timeline)](#5-trục-thời-gian-hoạt-động-activity-timeline)
6. [Cấu Hình & Cài Đặt (Settings) & Nhắc nhở chủ động](#6-cấu-hình--cài-đặt-settings)
7. [Đồng Đội Giám Sát (Habit Groups)](#7-đồng-đội-giám-sát-habit-groups)
8. [Bình luận & Chat nhóm (Group Chat)](#8-bình-luận--chat-nhóm-group-chat)
9. [Chia Sẻ Thành Tích Một Chạm (Social Sharing)](#9-chia-sẻ-thành-tích-một-chạm-social-sharing)
10. [Hẹn Giờ Pomodoro (Pomodoro Timer)](#10-hẹn-giờ-pomodoro-pomodoro-timer)
11. [Theo dõi Bạn bè & Feed hoạt động (Friends)](#11-theo-dõi-bạn-bè--feed-hoạt-động-friends)
12. [Phòng Kỷ Luật (Discipline Room)](#12-phòng-kỷ-luật-discipline-room)
13. [Các Câu Hỏi Thường Gặp (FAQs)](#13-các-câu-hỏi-thường-gặp-faqs)

---

## 1. Khởi Đầu Nhanh & Đăng Nhập/Đăng Ký

Khi truy cập vào ứng dụng lần đầu tiên, giao diện mặc định sẽ là **Light Theme** với phong cách **Glassmorphism** tối giản và tinh tế. Để bắt đầu lưu trữ tiến độ, bạn cần tạo tài khoản:

- **Đăng ký tài khoản mới**: Nhấn vào tab **Register**, điền đầy đủ thông tin: Họ tên, Email, Mật khẩu và chọn **Múi giờ hoạt động** phù hợp.
- **Đăng nhập**: Điền Email và Mật khẩu của bạn. Hệ thống sử dụng phương thức xác thực bảo mật cao JWT. Phiên làm việc sẽ tự động làm mới (**Axios Interceptors**) giúp bạn không cần đăng nhập lại liên tục.

> [!NOTE]
> Múi giờ của tài khoản rất quan trọng, hệ thống Streak Engine sẽ dựa vào múi giờ này để chốt ngày và tính toán chuỗi ngày liên tục của bạn một cách chính xác nhất.

---

## 2. Bảng Điều Khiển Chính (Dashboard) & Cơ Chế Hoàn Tác (Undo Engine)

Màn hình Dashboard (`/`) là trung tâm kiểm soát các hoạt động cần thực hiện trong ngày hiện tại.

<img width="1920" height="909" alt="image" src="https://github.com/user-attachments/assets/9b53803b-0f2a-4be5-a4b9-6e2d580d0e8d" />


### 2.1. Các Thành Phần Chính trên Dashboard
- **Header Thông Minh**: Chào hỏi cá nhân hóa động theo buổi (Sáng/Chiều/Tối), hiển thị huy hiệu ngọn lửa **Streak** cao nhất hiện tại của bạn và nút làm mới dữ liệu nhanh (**Refresh**).
- **Vòng Tròn Tiến Độ SVG & Bento Stats**:
  - **Today's Progress**: Hiển thị phần trăm hoàn thành tổng thể trong ngày kèm thanh tiến độ mượt mà.
  - **Current Streak**: Hiển thị chuỗi ngày liên tục tốt nhất của bạn. Nếu đạt từ 7 ngày trở lên, bạn sẽ nhận được danh hiệu "Top 5% of all users 🏆".
  - **Total Logged**: Tổng số lượt check-in đã thực hiện trên mọi thói quen.
- **Mini Calendar (Lịch nhỏ)**: Giúp bạn theo dõi ngày hiện tại trong tháng và nhanh chóng nhận biết các ngày đã qua.
- **Mục Tiêu Sắp Tới (Upcoming Milestones)**: Gợi ý các cột mốc bạn cần chinh phục tiếp theo, chẳng hạn như duy trì chuỗi lửa 7 ngày hoặc hoàn thành các mục tiêu còn lại trong ngày.
- **Nhãn nhóm thói quen**: Các thói quen thuộc nhóm sẽ hiển thị nhãn `👥 Group Habit` trên Dashboard.

### 2.2. Cơ Chế Hoàn Tác Thông Minh (Undo Engine)
Khi bạn thực hiện check-in thói quen và đạt chỉ tiêu mục tiêu trong ngày (ví dụ: uống đủ 5 cốc nước), thẻ mục tiêu đó sẽ hoàn thành:
1. Thẻ mục tiêu sẽ kích hoạt **bộ đếm ngược 5 giây**.
2. Một nút **Undo (Hoàn tác)** sẽ xuất hiện trực tiếp trên thẻ.
3. Nếu bạn vô tình click nhầm, hãy nhấn **Undo** ngay lập tức để rút lại lượt check-in đó.
4. Sau 5 giây, nếu không có hành động hoàn tác, mục tiêu đã hoàn thành sẽ tự động **ẩn đi** để giảm tải thông tin, giữ cho màn hình chính luôn gọn gàng và tập trung vào các thói quen chưa làm.

### 2.3. Cài đặt PWA & Chế độ Ngoại tuyến (Offline Mode & Sync)
* **Cài đặt PWA lên điện thoại/máy tính:** Khi truy cập trang web, bạn sẽ thấy biểu tượng **Tải xuống/Cài đặt** (Install) ở thanh địa chỉ trình duyệt. Hãy nhấn cài đặt để tạo biểu tượng ứng dụng trực tiếp trên màn hình chính như một app di động thực thụ.
* **Hoạt động Ngoại tuyến:** Khi đi chạy bộ ngoài công viên hoặc ở phòng tập gym tầng hầm không có sóng 4G/Wifi, bạn vẫn mở được app và check-in bình thường:
  - Header Dashboard sẽ hiển thị huy hiệu màu cam **Offline Mode** báo hiệu bạn đang làm việc ngoại tuyến.
  - Các check-in được ghi nhận ngay lập tức trên màn hình và lưu tạm thời dưới trình duyệt (IndexedDB). Hệ thống có cơ chế bảo vệ thông minh, ngăn chặn click dồn dập (double-click) hoặc gửi trùng lặp bản ghi kể cả khi mạng chập chờn.
  - Khi thiết bị có mạng lại, hệ thống hiện huy hiệu xoay tròn **Syncing...** màu xanh lá và tự động đồng bộ hóa các lượt check-in cũ lên Server với đúng mốc giờ bạn check-in lúc offline. Quá trình đồng bộ này được đồng bộ hóa an toàn giữa các tab trình duyệt (sử dụng khóa hệ thống Web Locks) nên bạn hoàn toàn yên tâm nếu đang mở nhiều tab Momentum cùng lúc.

### 2.4. Phím tắt Check-in nhanh ngoài màn hình chính (Mobile Quick Widget)
Để giải quyết sự bất tiện khi phải mở trình duyệt, gõ URL và chờ đợi tải trang chỉ để check-in một cốc nước hoặc một cữ chạy bộ, Momentum cung cấp tiện ích phím tắt nhanh ngoài màn hình chính (App Shortcuts) và màn hình Check-in tối giản:
* **Phím tắt ứng dụng (PWA Shortcuts):** Sau khi bạn cài đặt PWA ngoài màn hình chính điện thoại, chỉ cần **nhấn và giữ biểu tượng ứng dụng**. Một menu phím tắt sẽ hiện ra, chọn **"Check-in nhanh"** để truy cập tức thì.
* **Trang Check-in nhanh tối giản (`/#/quick-checkin`):** 
  - Giao diện được tinh gọn hoàn hảo, loại bỏ các chỉ số thống kê rườm rà, tập trung 100% vào việc check-in.
  - **Check-in 1 chạm (Vibration feedback):** Nhấn trực tiếp vào thẻ thói quen để ghi nhận tiến độ, điện thoại sẽ phát ra phản hồi rung nhẹ vật lý tạo trải nghiệm tương tác xúc giác thực tế.
  - **Hoàn tác tức thì (Undo):** Sau khi check-in, thẻ sẽ hiển thị đếm ngược 5 giây kèm nút **Hoàn tác**. Nếu lỡ tay bấm nhầm, bạn có thể hoàn tác ngay lập tức.
  - **Thống kê đã hoàn thành:** Các mục tiêu đã làm xong sẽ tự động mờ đi và xếp gọn xuống phía dưới để giao diện luôn sạch sẽ.

---

## 3. Quản Lý Danh Sách Mục Tiêu (My Goals)

Trang Quản lý mục tiêu (`/goals`) được thiết kế dưới dạng lưới bento tối tân hiển thị tất cả các thói quen của bạn. Trang được chia làm hai Tab chính:
- **Đang hoạt động:** Chứa các mục tiêu bạn đang thực hiện hoặc tạm dừng.
- **Đã lưu trữ:** Chứa các mục tiêu cũ bạn không còn theo dõi nhưng muốn giữ lại lịch sử.

### 3.1. Tạo Thói Quen Mới (`/new-goal`)
Click vào nút **Add Goal** trên header để mở giao diện tạo thói quen. Bạn có thể thiết lập:
- **Chọn từ Template (Mẫu có sẵn)**: Nếu bạn chưa biết bắt đầu từ đâu, hãy nhấn nút "Chọn từ Template có sẵn". Hệ thống cung cấp thư viện mẫu đa dạng (Sức khỏe, Học tập, Thể lực...) để bạn điền nhanh các thông tin.
- **Title (Tiêu đề)**: Ví dụ "Đọc sách", "Chạy bộ", "Uống nước".
- **Category (Danh mục)**: Chọn các danh mục có sẵn như Health, Work, Fitness, Learning hoặc tự tạo danh mục riêng.
- **Nhắc nhở lúc (Individual Reminder)** [NEW]: Bạn có thể cài đặt một giờ nhắc nhở cụ thể (ví dụ: 08:30) cho thói quen này. Nếu cài đặt, hệ thống sẽ ưu tiên nhắc bạn vào đúng giờ đó thay vì nhắc chung lúc 21h.
- **Type (Loại mục tiêu)**:
  - `Binary` (Nhị phân): Chỉ có trạng thái Đã hoàn thành hoặc Chưa hoàn thành (Có/Không).
  - `Quantity` (Định lượng): Thiết lập mục tiêu theo số lượng cụ thể trong ngày (ví dụ: 8 cốc, 10 km). Bạn cần điền thêm đơn vị (**Unit**) và chỉ tiêu cần đạt (**Target Count**).
- **Priority (Độ ưu tiên)**: Low (Thấp), Medium (Trung bình), High (Cao). Thói quen độ ưu tiên cao sẽ có viền sáng động nổi bật.

### 3.2. Lưu Trữ & Thao Tác Hàng Loạt (Bulk Actions) [NEW]
Để giúp không gian làm việc gọn gàng hơn, bạn có thể sử dụng tính năng thao tác hàng loạt:
- **Lưu trữ đơn lẻ:** Nhấn vào dấu 3 chấm trên một Goal Card bất kỳ và chọn **"Lưu trữ"**. Mục tiêu sẽ được chuyển sang Tab "Đã lưu trữ" và ngừng hiển thị ở các thống kê. Để lấy lại, vào Tab "Đã lưu trữ" và chọn **"Khôi phục"**.
- **Chế độ Chọn nhiều:** Bấm nút **"Chọn nhiều"** trên thanh bộ lọc. Các thẻ mục tiêu sẽ hiển thị Checkbox.
- **Thanh công cụ nổi (FAB):** Khi chọn 1 hoặc nhiều mục tiêu, một thanh công cụ sẽ trượt lên từ đáy màn hình cho phép bạn:
  - Lưu trữ hàng loạt (Archive)
  - Tạm dừng hàng loạt (Pause)
  - Khôi phục hàng loạt (Restore - nếu ở tab Đã lưu trữ)
  - Xóa hàng loạt (Delete - sẽ có bảng Modal yêu cầu bạn xác nhận lần cuối tên các mục tiêu sẽ bị xóa).

### 3.3. Tìm Kiếm, Lọc & Sắp Xếp Nâng Cao
Tại trang `/goals`, bạn có các công cụ mạnh mẽ:
- **Tìm kiếm**: Gõ từ khóa để lọc nhanh tiêu đề thói quen.
- **Lọc theo trạng thái**: Click các nút lựa chọn để xem danh sách mục tiêu `All` (Tất cả), `Active` (Đang hoạt động), hoặc `Paused` (Đang tạm dừng).
- **Sắp xếp**:
  - `Priority`: Đẩy thói quen có độ ưu tiên cao lên trước.
  - `Recent`: Sắp xếp theo thói quen được tạo hoặc cập nhật gần nhất.
  - `Streak`: Sắp xếp theo thứ tự chuỗi ngày hoàn thành liên tục từ cao xuống thấp.

### 3.4. Hiển thị thông tin trên Goal Card
- **Badge Nhắc nhở**: Nếu thói quen có cài đặt giờ nhắc riêng, một biểu tượng chuông 🔔 kèm giờ sẽ hiển thị ngay dưới tên thói quen để bạn dễ dàng theo dõi lịch trình.
- **Menu Hành Động Nhanh**: Mỗi thẻ mục tiêu có một nút menu hành động nhanh (biểu tượng 3 chấm hoặc tùy chọn góc phải):
  - **Tạm dừng/Kích hoạt lại (Pause/Resume)**: Giúp bạn đóng băng thói quen khi đi du lịch hoặc nghỉ ngơi mà không làm mất lịch sử cũ hay ảnh hưởng đến thống kê ngày hiện tại.
  - **Chỉnh sửa (Edit)**: Thay đổi tiêu đề, chỉ tiêu, danh mục thói quen bất kỳ lúc nào.
  - **Lưu trữ (Archive)**: Đưa thói quen vào thùng lưu trữ, loại bỏ khỏi radar hệ thống nhưng giữ nguyên lịch sử.
  - **Xóa (Delete)**: Gỡ bỏ thói quen khỏi hệ thống vĩnh viễn (sẽ xóa toàn bộ lịch sử check-in liên quan).

---

## 4. Bảng Thống Kê & Phân Tích Hiệu Năng (Premium Stats)

Truy cập `/stats` để xem báo cáo trực quan về kỷ luật bản thân. Đây là khu vực phân tích sâu số liệu của bạn:

- **Aligned Header**: Tích hợp ô tìm kiếm mốc thành tựu nhanh, huy hiệu chuỗi ngày Streak động toàn cục và hai nút chức năng quan trọng:
  - **Export CSV**: Xuất nhanh bảng báo cáo tiến độ thói quen dưới dạng file Excel/CSV.
  - **Refresh**: Đồng bộ lại dữ liệu phân tích ngay lập tức.
- **Tỷ lệ hoàn thành & Tăng trưởng**: Hiển thị phần trăm hoàn thành thói quen trung bình kèm chỉ số so sánh xu hướng tăng trưởng (+/- %) so với tháng trước.
- **Consistency Heatmap (Bản đồ nhiệt 182 ngày)**: 
  - Hiển thị dưới dạng lưới đóng góp 26 tuần tương tự phong cách GitHub.
  - Mỗi ô vuông đại diện cho 1 ngày, màu càng đậm chứng tỏ số lượng mục tiêu bạn hoàn thành trong ngày đó càng nhiều.
  - Hỗ trợ rê chuột (hover) để xem chi tiết số lượng goal đã đạt được vào ngày cụ thể đó.
  - Lưới được tự động căn chỉnh ngày bắt đầu về Chủ Nhật hàng tuần giúp bạn dễ dàng đối chiếu tuần làm việc.
  - Tích hợp nút **Share** để kích hoạt tạo ảnh thẻ vinh danh cho heatmap của bạn.
- **10-Week Trend Chart (Biểu đồ xu hướng 10 tuần)**: Gom nhóm dữ liệu tiến độ trong 70 ngày gần nhất vẽ thành các cột biểu đồ CSS động tự động điều chỉnh độ cao và hiển thị tooltip thông tin chi tiết khi rê chuột.
- **Goal Distribution (Biểu đồ tròn phân bổ)**: Sử dụng kỹ thuật gradient conic hiện đại để chia tỷ lệ phần trăm thói quen của bạn theo danh mục (Sức khỏe, Công việc, v.v.), đi kèm bảng chú thích màu sắc tương tác.
- **Milestone Feed**: Dòng thời gian vinh danh các cột mốc bạn đã đạt được (ví dụ: đạt Streak 7 ngày đầu tiên, hoàn thành thói quen đạt mốc đặc biệt, đạt cấp bậc "Achiever Elite Tier"). Tích hợp nút **Share** trên từng thẻ cột mốc.
- **So sánh xu hướng (Trend Comparison)**:
  - Widget nằm ngay sau Bento Grid trong trang Stats.
  - Dùng toggle **Ngày / Tuần / Tháng** để so sánh hiệu suất giữa `Kỳ trước` và `Hiện tại`.
  - Chọn dropdown **Tất cả mục tiêu** để xem dữ liệu toàn bộ goal, hoặc chọn một mục tiêu cụ thể để lọc riêng.
  - Khi xem tất cả mục tiêu, có 2 chế độ:
    - **Tổng thể:** hiển thị biểu đồ cột đôi tổng quan.
    - **Chi tiết:** hiển thị từng mục tiêu theo hàng ngang, gồm số check-in kỳ trước, kỳ hiện tại, phần trăm thay đổi và trạng thái hôm qua/hôm nay.
  - Bảng **Hôm qua** và **Hôm nay** dùng nhãn **Đã đạt / Chưa đạt**. Một mục tiêu chỉ được tính là **Đã đạt** khi số lần check-in trong ngày đạt đủ `target_count`, ví dụ goal cần 8 lần thì mới check-in 1 lần vẫn thuộc nhóm **Chưa đạt**.
  - Khối **Gợi ý cần cải thiện theo ngày** đưa ra gợi ý dựa trên các mục tiêu chưa đạt target của hôm qua hoặc hôm nay.
  - Chế độ tuần dùng tuần lịch Monday-Sunday và so sánh với tuần lịch liền trước, không dùng cách lấy hôm nay trừ 7 ngày.

---

## 5. Trục Thời Gian Hoạt Động (Activity Timeline)

Trang Nhật ký hoạt động (`/timeline`) cung cấp cái nhìn chi tiết theo từng ngày về lịch sử check-in thói quen của bạn.

- **Performance Grid (Lưới hiệu năng tháng)**:
  - Mỗi ô đại diện cho một ngày trong tháng hiện tại.
  - Ngày có check-in thói quen sẽ được tô màu tiến độ.
  - **Huy hiệu Đột Phá (Breakthrough Badge)**: Đối với những ngày năng suất cao vượt bậc (hoàn thành từ 3 thói quen trở lên), ô vuông đó sẽ tự động xuất hiện biểu tượng **sao vàng lấp lánh** 🌟 để tôn vinh sự nỗ lực của bạn.
- **Lọc Hoạt Động Theo Ngày**: Click chọn vào bất kỳ ngày nào trên Lưới hiệu năng, danh sách Nhật ký hoạt động bên dưới sẽ tự động lọc chỉ hiển thị các lượt check-in của ngày được chọn.
- **Xóa Check-in & Tự Tính Lại Streak**: Nếu bạn check-in nhầm ngày cũ hoặc muốn chỉnh sửa lịch sử, bạn có thể nhấn nút **Delete Log** trên dòng hoạt động đó. Backend của Momentum sẽ tự động tính toán lại toàn bộ chuỗi Streak hiện tại và chuỗi Streak kỷ lục của bạn theo đúng múi giờ thực tế đã cài đặt.
- **Xuất báo cáo CSV**: Cho phép tải xuống báo cáo hoạt động dạng bảng tính CSV trực tiếp về trình duyệt chỉ với 1 click.

---

## 6. Cấu Hình & Cài Đặt (Settings)

Trang cài đặt (`/settings`) giúp bạn cá nhân hóa hoàn toàn trải nghiệm sử dụng ứng dụng Momentum.

### 6.1. Hồ Sơ Cá Nhân & Múi Giờ
- **Display Name**: Thay đổi tên hiển thị của bạn trên trang Dashboard.
- **Email**: Cập nhật email tài khoản.
- **Timezone**: Lựa chọn múi giờ địa phương của bạn (Ví dụ: `Asia/Ho_Chi_Minh` cho Việt Nam - GMT+7). Múi giờ này quyết định thời điểm bắt đầu một ngày mới và cách tính chuỗi Streak không bị lệch múi giờ quốc tế.

### 6.2. Tùy Chỉnh Trải Nghiệm Giao Diện (Appearance)
- **Theme (Giao diện)**: Chọn giữa chế độ **Light Mode** (Sáng dịu mắt) và **Dark Mode** (Tối huyền ảo với nền Slate-950).
- **Motion Effects (Hiệu ứng chuyển động)**: Bật/tắt các hoạt ảnh vi mô (Confetti chúc mừng khi hoàn thành mục tiêu, hoạt ảnh nảy ngọn lửa streak). Bạn nên bật tính năng này để có trải nghiệm thị giác tốt nhất.
- **Glass Opacity (Độ mờ đục của kính)**: Thanh trượt từ 20% đến 95% cho phép bạn điều chỉnh độ mờ đục của các thẻ Glassmorphic theo sở thích cá nhân ngay trong thời gian thực.
- **Sticky Floating Action Bar**: Khi có thay đổi cài đặt chưa lưu, thanh tác vụ nổi cố định ở cuối màn hình sẽ xuất hiện, giúp bạn lưu nhanh các thay đổi (**Save Preferences**) hoặc hủy bỏ hoàn toàn (**Discard Changes**).

### 6.3. Danger Zone (Vùng Nguy Hiểm)
- **Export My Data (Xuất dữ liệu)**: Tải xuống toàn bộ hồ sơ cá nhân và lịch sử thói quen dưới dạng file JSON để lưu trữ dự phòng.
- **Delete Account (Xóa tài khoản)**: Xóa vĩnh viễn tài khoản của bạn cùng tất cả mục tiêu, lịch sử check-in và chuỗi Streak liên quan. *Lưu ý: Hành động này không thể hoàn tác.*

### 6.4. Thông báo & Nhắc nhở chủ động chống đứt chuỗi (Active Reminders)
Để khắc phục tình trạng người dùng quên mở ứng dụng dẫn đến mất chuỗi Streak đáng tiếc, Momentum cung cấp tính năng **Nhắc nhở chủ động chống đứt chuỗi (Active Reminders)**:
- **Nguyên lý hoạt động:** Khi bạn bật tính năng này, trình duyệt sẽ yêu cầu quyền thông báo đẩy. Hàng ngày vào lúc **21h00 tối (giờ địa phương theo Múi giờ tài khoản của bạn)**, hệ thống máy chủ sẽ tự động kiểm tra xem bạn còn thói quen hàng ngày nào chưa hoàn thành hay không. Nếu phát hiện còn thói quen chưa làm, một thông báo đẩy (Push Notification) sẽ được gửi thẳng đến thiết bị/trình duyệt của bạn (kể cả khi bạn đã đóng ứng dụng).
- **Cách kích hoạt:**
  1. Đi tới trang **Settings** (`/settings`).
  2. Tại bảng **Notifications**, tìm mục **Active Reminders** và bật công tắc này lên.
  3. Xác nhận cho phép hiển thị thông báo khi trình duyệt gửi yêu cầu.
  4. Nhấn **Save Preferences** ở thanh tác vụ nổi để lưu lại.
- **Tương tác thông báo:** Nhấn trực tiếp vào thông báo đẩy "Chống đứt chuỗi! 🔥" trên điện thoại hoặc máy tính để mở và điều hướng nhanh về màn hình chính của ứng dụng để hoàn thành mục tiêu.

---

## 7. Đồng Đội Giám Sát (Habit Groups)

Tính năng **Đồng đội giám sát (Habit Groups)** giúp bạn không còn đơn độc trên hành trình kỷ luật. Bạn có thể kết nối với bạn bè hoặc những người dùng khác để cùng thực hiện một thói quen chung.

*   **Tạo nhóm thói quen:**
    1. Truy cập trang **Habit Groups** (`/groups`) qua thanh điều hướng.
    2. Nhấn nút **Create Group** ở góc trên bên phải.
    3. Điền Tên nhóm, mô tả thói quen, chọn danh mục, chỉ tiêu ngày/tuần/tháng.
    4. Nhấn **Create Group Habit** để hoàn tất. Bạn sẽ tự động tham gia nhóm.
*   **Liên kết Dashboard cá nhân:**
    *   Khi bạn tạo hoặc tham gia một nhóm, hệ thống sẽ tự động sinh ra một thói quen tương ứng hiển thị trực tiếp trên Dashboard cá nhân của bạn, được đánh dấu bằng nhãn `👥 Group Habit`.
    *   Bạn có thể check-in tiến trình này ngay trên Dashboard chính hoặc check-in trực tiếp từ bảng xếp hạng của nhóm.
*   **Leaderboard Real-time:**
    *   Trang chi tiết của nhóm hiển thị trực quan danh sách các thành viên cùng tiến trình check-in hôm nay của từng người (ví dụ: `1/1 Completed` hoặc `0/2 Active`).
    *   Chuỗi ngày Streak hiện tại của từng thành viên cũng được hiển thị kèm biểu tượng lửa 🔥.
*   **Rời và xóa nhóm:**
    *   Nếu muốn dừng tham gia, bạn có thể nhấn **Leave Group** ở cuối trang chi tiết nhóm. Hệ thống sẽ tự động xóa mục tiêu liên kết trên Dashboard của bạn.
    *   Nếu bạn là người tạo nhóm, bạn có quyền nhấn **Delete Group** để giải tán nhóm thói quen chung.

---

## 8. Bình luận & Chat nhóm (Group Chat) [NEW]

Tính năng **Bình luận nhóm** giúp các thành viên trao đổi, động viên và giữ trách nhiệm cho nhau ngay trong giao diện nhóm.

*   **Vị trí:** Section chat nằm ngay dưới Leaderboard trong trang chi tiết nhóm. Chỉ những người đã gia nhập nhóm mới có thể xem và gửi tin nhắn.
*   **Gửi tin nhắn:**
    *   Nhập nội dung vào ô chat ở cuối danh sách (tối đa 200 ký tự).
    *   Nhấn nút **Gửi** hoặc phím **Enter** để gửi nhanh. Dùng **Shift + Enter** nếu muốn xuống dòng.
    *   Hệ thống sử dụng **Optimistic Update**, tin nhắn của bạn sẽ xuất hiện ngay lập tức mà không cần chờ server phản hồi.
*   **Phản ứng bằng Emoji (Reactions):**
    *   Mỗi tin nhắn có 5 emoji phản ứng nhanh: 🔥 💪 👏 ❤️ 😂.
    *   Nhấn vào emoji để bày tỏ cảm xúc. Nhấn lại lần nữa để gỡ bỏ.
    *   Số đếm bên cạnh emoji cho biết tổng số thành viên đã thả reaction đó.
*   **Quản lý tin nhắn (Moderation):**
    *   **Người tạo nhóm (Admin):** Có quyền xóa bất kỳ tin nhắn nào không phù hợp trong nhóm của mình.
    *   **Thành viên:** Chỉ có quyền xóa tin nhắn do chính mình gửi.
    *   Khi xóa, tin nhắn sẽ biến mất khỏi danh sách của tất cả mọi người.
*   **Thông báo đẩy (Push Notifications):**
    *   Khi có tin nhắn mới, các thành viên khác trong nhóm sẽ nhận được thông báo đẩy trên thiết bị (nếu đã bật Active Reminders).
    *   Để tránh làm phiền, hệ thống giới hạn mỗi người dùng chỉ nhận tối đa **3 thông báo chat nhóm mỗi ngày**.

---

## 9. Chia Sẻ Thành Tích Một Chạm (Social Sharing)


Momentum cung cấp tính năng **Social Sharing** cao cấp cho phép bạn khoe thành quả rèn luyện của mình với bạn bè chỉ với một click chuột:

*   **Điểm kích hoạt chia sẻ:**
    *   Biểu tượng **Share** được tích hợp ngay cạnh tiêu đề **Consistency Heatmap** trên trang Thống kê.
    *   Mỗi thẻ badge trong feed **Key Milestones** đều có nút **Share** riêng.
    *   Trang chi tiết nhóm thói quen hỗ trợ nút **Share Team** để khoe tiến độ tập thể.
*   **Hộp thoại Share Modal:**
    *   Khi kích hoạt, một modal kính mờ nổi lên hiển thị bản preview dạng thẻ (Card) vô cùng bắt mắt.
    *   Mẫu thẻ được vẽ tự động bằng **HTML5 Canvas API** với độ phân giải lớn 1200x630px (chuẩn ảnh chia sẻ của Facebook/Twitter), kết hợp hình ảnh huy hiệu (cúp vàng hoặc ngọn lửa lớn), tên của bạn, mô tả thành tích và logo Momentum.
*   **Các tùy chọn chia sẻ một chạm:**
    1.  **Download High-Res PNG:** Tải ảnh chất lượng cao trực tiếp về máy.
    2.  **Share via Devices (Web Share API):** Trên các thiết bị di động/máy tính hỗ trợ, nút này sẽ gọi trình chia sẻ mặc định của hệ điều hành giúp bạn gửi ảnh qua Zalo, Messenger, AirDrop, v.v.
    3.  **Copy Share Message:** Sao chép thông điệp thành tích kèm link giới thiệu vào bộ nhớ đệm.
    4.  **Facebook & Twitter:** Nhấn nút mạng xã hội để chuyển hướng nhanh đến màn hình đăng bài kèm thông điệp khích lệ soạn sẵn.

---

## 11. Theo dõi Bạn bè & Feed hoạt động (Friends)

Tính năng **Theo dõi Bạn bè** giúp bạn kết nối với những người dùng khác để cùng nhau tạo động lực rèn luyện.

*   **Tìm kiếm và Theo dõi:**
    1.  Truy cập trang **Bạn bè** qua biểu tượng 👥 trên thanh điều hướng.
    2.  Nhập tên hoặc email của người bạn muốn tìm vào thanh tìm kiếm.
    3.  Kết quả sẽ hiển thị Level và Chuỗi ngày (Streak) cao nhất của họ.
    4.  Nhấn **Theo dõi** để bắt đầu kết nối. Nút sẽ chuyển thành **Đang theo dõi**.
*   **Feed hoạt động (Hoạt động bạn bè):**
    1.  Tại màn hình **Dashboard**, bạn sẽ thấy khung **"Bạn bè hôm nay"**.
    2.  Khung này hiển thị tối đa 5 hoạt động check-in mới nhất từ những người bạn đang theo dõi.
    3.  Thông tin hiển thị bao gồm: Tên bạn bè, mục tiêu họ vừa hoàn thành và thời gian thực hiện.
*   **Quản lý Quyền riêng tư:**
    1.  Nếu bạn không muốn hoạt động của mình xuất hiện trên feed của người khác, hãy vào **Cài đặt**.
    2.  Tìm mục **"Hiển thị hoạt động trong Feed bạn bè"** và tắt nó đi.
    3.  Lưu ý: Bạn vẫn có thể xem hoạt động của người khác nếu đang theo dõi họ, nhưng họ sẽ không thấy hoạt động của bạn.
*   **Xem chỉ số Follow:**
    1.  Trong trang **Cài đặt**, dưới phần thông tin cá nhân, bạn có thể xem số lượng người bạn đang theo dõi (**Đang theo dõi**) và số người đang theo dõi bạn (**Người theo dõi**).

---

## 12. Phòng Kỷ Luật (Discipline Room)

Phòng Kỷ Luật (Discipline Room) là tính năng mô phỏng không gian học tập và làm việc chung, ứng dụng trí tuệ nhân tạo (AI Camera Coach) để giám sát và đánh giá sự tập trung của bạn trong thời gian thực. Hiện tại tính năng đang ở phiên bản Demo.

*   **Tạo phòng (Create Room):**
    1.  Truy cập trang **Phòng Kỷ Luật** qua thanh điều hướng (Sidebar hoặc BottomNav).
    2.  Nhập tên mục tiêu cho phiên làm việc.
    3.  Chọn chế độ làm việc (Study hoặc Deep Work).
    4.  Lựa chọn thời gian phiên (5, 15, hoặc 25 phút).
    5.  Nhấn nút **Tạo phòng**.
*   **Chờ partner (Waiting Room):**
    *   Hệ thống sẽ cấp cho bạn một **Mã mời (Invite Code)** để chia sẻ cho bạn bè.
    *   Trong bản Demo, hệ thống sẽ tự động giả lập có một partner tham gia phòng sau 3 giây.
    *   Nhấn **Start Demo Session** để bắt đầu phiên.
*   **Phiên tập trung (Active Session):**
    *   Bạn cần cấp quyền truy cập Camera cho trình duyệt để AI có thể đánh giá mức độ tập trung. (Lưu ý: Video không được lưu trữ hoặc gửi lên server).
    *   Trong quá trình đếm ngược, AI Coach (giả lập) sẽ tự động phân tích và hiển thị trạng thái của bạn (Focused, Away).
    *   Hệ thống tự động cập nhật **Focus Score** và **Presence Score**.
*   **Báo cáo phiên (Session Report):**
    *   Sau khi hết thời gian (hoặc khi bạn nhấn Kết thúc sớm), hệ thống sẽ tính toán **XP Earned** dựa trên độ tập trung của bạn.
    *   Bạn sẽ nhận được những lời khuyên (Insight) hữu ích từ AI Coach để cải thiện trong các phiên tiếp theo.

---

## 13. Các Câu Hỏi Thường Gặp (FAQs)


**Q: Tại sao tôi vào trang tạo thói quen lại báo "Yêu cầu kết nối mạng" dù tôi vẫn đang online?**
> **A:** Một số trình duyệt có thể báo nhầm trạng thái kết nối mạng (false offline). Trong trường hợp này, Momentum cung cấp một nút **"Tôi vẫn đang online, cho tôi tiếp tục"** ở ngay màn hình thông báo lỗi đó. Hãy bấm vào nút này để bỏ qua cảnh báo và tiếp tục thiết lập thói quen. Lưu ý: Khi lưu mục tiêu, bạn vẫn cần có kết nối mạng thực tế để dữ liệu được gửi lên máy chủ thành công.

**Q: Làm sao để duy trì ngọn lửa Streak của thói quen?**

> Bạn chỉ cần thực hiện check-in thói quen đạt chỉ tiêu tối thiểu trong ngày trước khi ngày đó kết thúc theo múi giờ bạn đã cài đặt. Chuỗi Streak sẽ tăng lên 1 sau mỗi ngày hoàn thành liên tục.

**Q: Tại sao tôi vừa check-in thói quen thành công nhưng nó lại biến mất trên Dashboard?**
> Đây là tính năng tự động ẩn mục tiêu hoàn thành của Dashboard giúp giao diện gọn gàng hơn. Khi thói quen đạt chỉ tiêu trong ngày, thẻ sẽ hiển thị đếm ngược 5 giây kèm nút **Undo** để bạn hoàn tác nếu bấm nhầm. Sau 5 giây, thẻ sẽ ẩn đi. Bạn vẫn có thể xem lại mục tiêu này trong trang `/goals` hoặc xem lịch sử check-in tại trang `/timeline`.

**Q: Việc thay đổi múi giờ (Timezone) trong Settings ảnh hưởng như thế nào đến Streak?**
> Khi bạn đổi múi giờ, thuật toán **Streak Engine** sẽ lập tức tính toán lại toàn bộ lịch sử check-in theo mốc giờ mới của bạn. Điều này đảm bảo tính trung thực của chuỗi ngày liên tục kể cả khi bạn di chuyển sang các quốc gia khác nhau.

**Q: Tôi có thể sử dụng ứng dụng ngoại tuyến (Offline) không?**
> **HOÀN TOÀN CÓ THỂ!** Momentum hiện tại đã là một Progressive Web App (PWA) đầy đủ. Bạn có thể cài đặt ứng dụng lên màn hình chính điện thoại hoặc máy tính. Khi mất kết nối mạng:
> 1. Giao diện ứng dụng vẫn tải bình thường nhờ Service Worker cache.
> 2. Dữ liệu thói quen và dashboard được khôi phục từ cơ sở dữ liệu IndexedDB của trình duyệt.
> 3. Bạn có thể bấm check-in hoặc hoàn tác (Undo) bình thường. Bản ghi sẽ được xếp vào hàng đợi chờ đồng bộ. Trạng thái giao diện luôn hiển thị mượt mà và không lo bị gửi đúp log nhờ cơ chế khóa click dồn dập và cơ chế UUID định danh.
> 4. Khi thiết bị có mạng trở lại, hệ thống sẽ tự động đồng bộ hóa an toàn (chỉ một tab xử lý đồng bộ nhờ Web Locks API) và gửi dữ liệu check-in lên máy chủ với đúng giờ giấc ban đầu bạn thực hiện, đảm bảo chuỗi Streak của bạn không bao giờ bị đứt gãy! Giao diện cũng sẽ tự động hợp nhất hàng đợi ngoại tuyến nên không hề có hiện tượng giật lag giật lại trạng thái cũ!

**Q: Làm thế nào để thêm phím tắt "Check-in nhanh" ngoài màn hình chính điện thoại?**
> **A:** 
> 1. Hãy truy cập trang web bằng trình duyệt trên điện thoại (Chrome cho Android hoặc Safari cho iOS).
> 2. Chọn menu cài đặt trình duyệt (hoặc nút Chia sẻ trên iOS) và chọn **"Thêm vào Màn hình chính"** (Add to Home screen) để cài đặt ứng dụng dưới dạng PWA.
> 3. Sau khi ứng dụng đã cài đặt xong:
>    - **Đối với các launcher di động hỗ trợ Shortcuts:** Bạn chỉ cần nhấn và giữ biểu tượng ứng dụng ngoài màn hình chính. Một menu lối tắt sẽ hiện lên, hãy chọn **"Check-in nhanh"** để truy cập tức thì màn hình tối giản. Bạn cũng có thể nhấn giữ lối tắt này và kéo thả ra màn hình làm một phím tắt độc lập.
>    - **Đối với mọi thiết bị khác:** Bạn có thể mở ứng dụng, truy cập màn hình **Settings** -> cuộn xuống mục **Mobile PWA Widget & Shortcuts** và nhấn **"Mở ngay"** để bookmark trực tiếp liên kết check-in nhanh (`/#/quick-checkin`) ra màn hình chính của thiết bị.

---
*Chúc bạn có những trải nghiệm tuyệt vời và duy trì được kỷ luật bản thân xuất sắc cùng **Momentum**!*
## Bổ sung 2026-06-09: Cách dùng và test Streak Freeze / AI Coach

### Streak Freeze / Freeze Token
Tính năng **Streak Freeze** giúp bảo vệ streak của một goal khi người dùng chưa kịp hoàn thành trong ngày.

Điều kiện để nút `Protect Streak` hiển thị:
- Người dùng đã đăng nhập.
- Goal chưa hoàn thành trong ngày hiện tại.
- Goal đang có `current_streak > 0`.
- Đã tới giờ mở tính năng đóng băng. Mặc định ban đầu là từ 18:00 trở đi.
- Tài khoản còn Freeze Token trong tháng.

Cách test nhanh trên giao diện:
1. Chọn một goal có streak lớn hơn 0.
2. Không check-in goal đó trong ngày test.
3. Đợi tới giờ mở Freeze Token, hoặc tạm đổi ngưỡng giờ test trong `src/components/GoalCard.tsx`.
4. Mở Dashboard hoặc Goals.
5. Bấm `Protect Streak`.
6. Kết quả đúng: nút chuyển sang trạng thái protected, token giảm 1, và ngày hiện tại được lưu vào danh sách ngày đóng băng.

Đổi giờ test sang 13:30 trong `GoalCard.tsx`:

```ts
const now = new Date();
const currentMinutes = now.getHours() * 60 + now.getMinutes();
const freezeStartMinutes = 13 * 60 + 30;

const showFreezeButton =
  currentMinutes >= freezeStartMinutes && !isCompleted && currentStreak > 0;
```

API liên quan:
- `GET /api/freeze/tokens`: xem số token còn lại trong tháng.
- `POST /api/freeze/activate`: dùng 1 token để bảo vệ streak cho goal.
- `GET /api/freeze/dates?goal_id=...`: xem danh sách ngày đã đóng băng của goal.

Lỗi thường gặp khi test:
- Không thấy nút: chưa tới giờ mở tính năng, goal chưa có streak, hoặc goal đã hoàn thành hôm nay.
- Báo hết token: tài khoản đã dùng đủ 3 token trong tháng.
- Bấm lại cùng ngày không được: mỗi goal chỉ được đóng băng một lần cho một ngày.
- Lỗi database operation: kiểm tra DB đã có cột `User.last_freeze_reminder_date`, bảng `StreakFreeze`, bảng `FreezeToken`.

### AI Coach
AI Coach dùng Gemini API ở phía backend. Nếu giao diện trả fallback như "Mình đang gặp chút khó khăn khi kết nối AI", cần kiểm tra:
- `.env` có `GEMINI_API_KEY`.
- Key Gemini còn quota.
- Backend đã restart sau khi đổi `.env`.
- Route `/api/ai/chat` và `/api/ai/report` đã được đăng ký trong Express.

Trường hợp key hợp lệ nhưng Gemini trả `429 RESOURCE_EXHAUSTED`, đây là lỗi quota của Google/Gemini, không phải lỗi giao diện chat.

### Khi web bị trắng trang hoặc treo ở localhost
Các nguyên nhân đã gặp:
- `localStorage.user` bị hỏng JSON làm app crash ngay khi khởi động.
- Service worker cache bản JS/app shell cũ ở `localhost`.
- Database schema chưa đồng bộ với Prisma schema.

Cách xử lý nhanh:
1. Bấm `Ctrl + F5` để hard refresh.
2. Nếu vẫn trắng, clear site data cho `localhost:3000`.
3. Restart dev server bằng `npm run dev`.
4. Kiểm tra backend trả HTML ở `http://localhost:3000/login#/login`.
5. Nếu login báo lỗi database, kiểm tra migration/schema DB.
l.
- `GET /api/freeze/dates?goal_id=...`: xem danh sách ngày đã đóng băng của goal.

Lỗi thường gặp khi test:
- Không thấy nút: chưa tới giờ mở tính năng, goal chưa có streak, hoặc goal đã hoàn thành hôm nay.
- Báo hết token: tài khoản đã dùng đủ 3 token trong tháng.
- Bấm lại cùng ngày không được: mỗi goal chỉ được đóng băng một lần cho một ngày.
- Lỗi database operation: kiểm tra DB đã có cột `User.last_freeze_reminder_date`, bảng `StreakFreeze`, bảng `FreezeToken`.

### AI Coach
AI Coach dùng Gemini API ở phía backend. Nếu giao diện trả fallback như "Mình đang gặp chút khó khăn khi kết nối AI", cần kiểm tra:
- `.env` có `GEMINI_API_KEY`.
- Key Gemini còn quota.
- Backend đã restart sau khi đổi `.env`.
- Route `/api/ai/chat` và `/api/ai/report` đã được đăng ký trong Express.

Trường hợp key hợp lệ nhưng Gemini trả `429 RESOURCE_EXHAUSTED`, đây là lỗi quota của Google/Gemini, không phải lỗi giao diện chat.

### Khi web bị trắng trang hoặc treo ở localhost
Các nguyên nhân đã gặp:
- `localStorage.user` bị hỏng JSON làm app crash ngay khi khởi động.
- Service worker cache bản JS/app shell cũ ở `localhost`.
- Database schema chưa đồng bộ với Prisma schema.

Cách xử lý nhanh:
1. Bấm `Ctrl + F5` để hard refresh.
2. Nếu vẫn trắng, clear site data cho `localhost:3000`.
3. Restart dev server bằng `npm run dev`.
4. Kiểm tra backend trả HTML ở `http://localhost:3000/login#/login`.
5. Nếu login báo lỗi database, kiểm tra migration/schema DB.
