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
8. [Chia Sẻ Thành Tích Một Chạm (Social Sharing)](#8-chia-sẻ-thành-tích-một-chạm-social-sharing)
9. [Các Câu Hỏi Thường Gặp (FAQs)](#9-các-câu-hỏi-thường-gặp-faqs)

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

---

## 3. Quản Lý Danh Sách Mục Tiêu (My Goals)

Trang Quản lý mục tiêu (`/goals`) được thiết kế dưới dạng lưới bento tối tân hiển thị tất cả các thói quen của bạn.

### 3.1. Tạo Thói Quen Mới (`/new-goal`)
Click vào nút **Add Goal** trên header để mở giao diện tạo thói quen. Bạn có thể thiết lập:
- **Title (Tiêu đề)**: Ví dụ "Đọc sách", "Chạy bộ", "Uống nước".
- **Category (Danh mục)**: Chọn các danh mục có sẵn như Health, Work, Fitness, Learning hoặc tự tạo danh mục riêng.
- **Type (Loại mục tiêu)**:
  - `Binary` (Nhị phân): Chỉ có trạng thái Đã hoàn thành hoặc Chưa hoàn thành (Có/Không).
  - `Quantity` (Định lượng): Thiết lập mục tiêu theo số lượng cụ thể trong ngày (ví dụ: 8 cốc, 10 km). Bạn cần điền thêm đơn vị (**Unit**) và chỉ tiêu cần đạt (**Target Count**).
- **Priority (Độ ưu tiên)**: Low (Thấp), Medium (Trung bình), High (Cao). Thói quen độ ưu tiên cao sẽ có viền sáng động nổi bật.

### 3.2. Tìm Kiếm, Lọc & Sắp Xếp Nâng Cao
Tại trang `/goals`, bạn có các công cụ mạnh mẽ:
- **Tìm kiếm**: Gõ từ khóa để lọc nhanh tiêu đề thói quen.
- **Lọc theo trạng thái**: Click các nút lựa chọn để xem danh sách mục tiêu `All` (Tất cả), `Active` (Đang hoạt động), hoặc `Paused` (Đang tạm dừng).
- **Sắp xếp**:
  - `Priority`: Đẩy thói quen có độ ưu tiên cao lên trước.
  - `Recent`: Sắp xếp theo thói quen được tạo hoặc cập nhật gần nhất.
  - `Streak`: Sắp xếp theo thứ tự chuỗi ngày hoàn thành liên tục từ cao xuống thấp.

### 3.3. Menu Hành Động Nhanh trên Goal Card
Mỗi thẻ mục tiêu có một nút menu hành động nhanh (biểu tượng 3 chấm hoặc tùy chọn góc phải):
- **Tạm dừng/Kích hoạt lại (Pause/Resume)**: Giúp bạn đóng băng thói quen khi đi du lịch hoặc nghỉ ngơi mà không làm mất lịch sử cũ hay ảnh hưởng đến thống kê ngày hiện tại.
- **Chỉnh sửa (Edit)**: Thay đổi tiêu đề, chỉ tiêu, danh mục thói quen bất kỳ lúc nào.
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
*   **Bảng xếp hạng nhóm (Leaderboard):**
    *   Trang chi tiết của nhóm hiển thị trực quan danh sách các thành viên cùng tiến trình check-in hôm nay của từng người (ví dụ: `1/1 Completed` hoặc `0/2 Active`).
    *   Chuỗi ngày Streak hiện tại của từng thành viên cũng được hiển thị kèm biểu tượng lửa 🔥.
*   **Rời và xóa nhóm:**
    *   Nếu muốn dừng tham gia, bạn có thể nhấn **Leave Group** ở cuối trang chi tiết nhóm. Hệ thống sẽ tự động xóa mục tiêu liên kết trên Dashboard của bạn.
    *   Nếu bạn là người tạo nhóm, bạn có quyền nhấn **Delete Group** để giải tán nhóm thói quen chung.

---

## 8. Chia Sẻ Thành Tích Một Chạm (Social Sharing)

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

## 9. Các Câu Hỏi Thường Gặp (FAQs)

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

---
*Chúc bạn có những trải nghiệm tuyệt vời và duy trì được kỷ luật bản thân xuất sắc cùng **Momentum**!*
