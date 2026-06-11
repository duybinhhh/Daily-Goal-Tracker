### 3.2 Nội dung file `docs/CHANGELOG.md`
*File này theo dõi tiến độ phát triển, ghi nhận các tính năng đã/sẽ hoàn thiện theo từng Sprint.*

# Changelog

## [Sprint 11] - 2026-06-11

### 🚀 Discipline Room - Nâng cấp trải nghiệm học tập & làm việc cùng nhau

#### ✨ AI Camera Coach v2

* Nâng cấp AI Camera Coach với khả năng phân tích nhiều trạng thái hơn:

  * Focused
  * Reading/Writing
  * Looking Away
  * Head Down
  * Away
  * Low Confidence
* Thêm AI Event Timeline ghi lại toàn bộ diễn biến trong phiên tập trung.
* Bổ sung Smart Alerts và Manual Checkpoint giúp đánh giá chính xác hơn theo từng ngữ cảnh học tập hoặc làm việc.
* Cải thiện Focus Score dựa trên thời lượng tập trung thực tế thay vì chỉ đếm số lần mất tập trung.
* Toàn bộ xử lý camera vẫn chạy 100% trên trình duyệt, không gửi ảnh hoặc video lên server.

---

#### 👥 Public Waiting Room

* Thêm danh sách phòng chờ công khai để người dùng có thể tìm và tham gia phòng ngay cả khi không có bạn bè sử dụng ứng dụng.
* Hỗ trợ tạo phòng Public hoặc Private.
* Bổ sung bộ lọc theo chế độ học tập/làm việc và thời lượng phiên.
* Tự động cập nhật danh sách phòng chờ theo thời gian thực.

---

#### 💬 Mini Chat & Partner Stats

* Thêm Mini Chat trong Discipline Room để hai thành viên có thể trao đổi trong suốt phiên tập trung.
* Hỗ trợ System Messages tự động thông báo các sự kiện quan trọng như:

  * Partner tham gia phòng
  * Partner Away
  * Partner quay lại Focused
  * Partner kết thúc phiên
* Thêm bảng Partner Stats hiển thị các chỉ số tập trung của người đồng hành theo thời gian thực.
* Cải thiện trải nghiệm xem camera partner với chế độ phóng to và giao diện trực quan hơn.

---

#### 🎯 Pre-Session Lobby & Ready Check

* Thêm giai đoạn chuẩn bị trước phiên tập trung thay vì bắt đầu ngay khi đủ người.
* Hai thành viên có thể:

  * Trò chuyện trước phiên
  * Đặt mục tiêu cá nhân
  * Chuẩn bị tài liệu và môi trường làm việc
* Bổ sung cơ chế Ready Check:

  * Mỗi người xác nhận đã sẵn sàng
  * Phiên chỉ bắt đầu khi cả hai cùng đồng ý
* Thêm Countdown 3-2-1 trước khi khởi động Camera AI và bộ đếm thời gian.
* Cập nhật flow để sau khi đủ 2 người, phòng chuyển vào sảnh trao đổi và không bật camera AI ngay.
* Chỉ khi cả hai bấm `Tôi đã hiểu và sẵn sàng`, hệ thống mới chuyển phòng sang `ACTIVE`, đếm ngược và bắt đầu camera AI.
* Sửa lỗi bị kẹt ở màn chờ sau khi partner tham gia bằng cách đồng bộ trạng thái phòng ngay khi tạo/join và trong heartbeat.
* Chặn endpoint start cũ không còn chuyển thẳng sang `ACTIVE`; endpoint này chỉ mở Lobby khi phòng đã đủ 2 người.
* Cải thiện nội dung Lobby với thông báo rõ camera AI chưa chạy, checklist chuẩn bị, mục tiêu từng người và trạng thái xác nhận của cả hai.
* Sửa lỗi ô `Mục tiêu phiên của bạn` chỉ nhập được vài ký tự do heartbeat ghi đè dữ liệu khi người dùng đang gõ.
* Tránh gửi system message rỗng kiểu `đã đặt mục tiêu: ""` khi mục tiêu chưa có nội dung.
* Sửa lỗi text chat/system message bị mã hóa sai trong màn Lobby, đồng thời normalize các message cũ bị lỗi khi hiển thị.

---

#### 🎨 Cải thiện giao diện Discipline Room

* Thiết kế lại bố cục phiên tập trung giúp camera trở thành trung tâm trải nghiệm.
* Tối ưu khu vực chat, bảng thống kê và thông tin partner để dễ theo dõi hơn.
* Việt hóa giao diện và cải thiện khả năng hiển thị trên màn hình desktop.
* Bổ sung các chỉ số nhanh giúp người dùng nắm được trạng thái phiên tập trung ngay lập tức.
* Bổ sung tùy chọn thời gian **1 phút** khi tạo phòng ký luật (và trong bộ lọc danh sách phòng chờ công khai) để người dùng dễ dàng thử nghiệm nhanh hoặc tham gia các phiên tập trung siêu ngắn.

#### 📊 Tối ưu Báo cáo Phiên (Session Report UX & Partner Comparison)

* **Thiết kế giao diện 2 cột tinh tế**: Chuyển đổi giao diện báo cáo từ một cột kéo dài ("phình to") sang dạng Dashboard 2 cột trên desktop. Cột trái dành cho các chỉ số tổng hợp, biểu đồ phân bổ thời gian học tập, và nhận xét AI Coach; Cột phải dành cho phân tích chi tiết hành vi và so sánh đối phương.
* **Đánh giá điểm mạnh/cải thiện thông minh**: Tự động phân tích sâu dữ liệu camera thực tế (ví dụ: tư thế cúi đầu, hướng chú ý của mắt, thời gian vắng mặt, sự tập trung liên tục, thời gian đọc sách/ghi chép) để xuất ra danh sách điểm tốt và điểm cần cải thiện cụ thể, thực tế.
* **Bảng so sánh đối kháng/đồng hành (Partner Comparison)**:
  * Huy hiệu phân định kết quả thắng, thua hoặc hòa dựa trên Focus Score.
  * Hiển thị song song mục tiêu học tập (Session Goals) của bạn và partner đặt ra trước phiên.
  * Biểu đồ thanh so sánh kép (Focus Score & Sự hiện diện) hiển thị trực quan tỷ lệ tương quan giữa hai thành viên.
  * So sánh đối chiếu số lần rời camera (Away Count) trực tiếp.
* **Dòng thời gian thu gọn**: Giới hạn chiều cao và bọc dòng thời gian sự kiện bằng thanh cuộn mượt mà để tránh đẩy trang xuống quá dài.
* **Khắc phục lỗi biên dịch**: Sửa các lỗi cú pháp JSX lồng nhau bị lỗi trước đó trong hàm renderReport, đảm bảo dự án chạy ổn định 100%.

---

### 🎯 Kết quả

Discipline Room đã được nâng cấp từ một phòng tập trung đơn giản thành một hệ thống **AI Accountability Room**, nơi người dùng có thể:

* Tìm partner công khai.
* Trò chuyện và thống nhất mục tiêu trước phiên.
* Cùng xác nhận bắt đầu.
* Được AI theo dõi mức độ tập trung theo thời gian thực.
* Theo dõi trạng thái của partner.
* Nhận báo cáo và đánh giá chi tiết sau mỗi phiên.


## [Sprint 10] - 2026-06-10

### Discipline Room — Full-stack Integration & AI Camera Breakthrough

---

## Đã thêm

### Discipline Room — Phòng Kỷ Luật
* Nâng cấp **Discipline Room** từ bản demo local thành một tính năng có dữ liệu thật, API thật và được tích hợp trực tiếp vào hệ thống **Daily Goal Tracker**.
* Người dùng có thể tạo phòng kỷ luật, mời partner bằng mã phòng, bắt đầu phiên tập trung, theo dõi trạng thái trong phiên và nhận báo cáo sau khi hoàn thành.
* Discipline Room giúp sản phẩm không chỉ dừng lại ở việc tạo mục tiêu, tick hoàn thành, streak và XP, mà mở rộng thành trải nghiệm **cam kết tập trung có AI hỗ trợ giám sát và phản hồi**.
* Tính năng này tạo điểm khác biệt lớn cho sản phẩm bằng cách kết hợp giữa:

  * Goal Tracking
  * Accountability Partner
  * Gamification
  * AI Camera Coach
  * Session Report sau phiên

---

### AI Camera Coach — Nhận diện trạng thái tập trung bằng camera

* Tích hợp **AI Camera Coach** vào phiên Discipline Room để phân tích trạng thái hiện diện và mức độ tập trung của người dùng trong quá trình thực hiện mục tiêu.
* Hệ thống sử dụng **camera face detection chạy trực tiếp trên trình duyệt** để nhận diện trạng thái cơ bản của người dùng, ( sẽ còn update thêm) ví dụ:

  * `Focused`: người dùng đang hiện diện trước camera và duy trì phiên tập trung.
  * `Away`: người dùng rời khỏi khung hình hoặc không còn được camera phát hiện trong một khoảng thời gian.
* Chức năng này đóng vai trò như một **người giám sát kỷ luật ảo**, giúp phiên tập trung không còn chỉ dựa vào việc người dùng tự báo cáo, mà có thêm dữ liệu thực tế để đánh giá quá trình thực hiện.
* AI Camera Coach giúp hệ thống tính toán các chỉ số quan trọng như:

  * **Presence Score**: tỷ lệ thời gian người dùng xuất hiện trước camera.
  * **Focus Score**: điểm tập trung tổng hợp dựa trên mức độ hiện diện và số lần bị gián đoạn.
  * **Away Count**: số lần người dùng rời khỏi camera trong phiên.
* Các chỉ số này được sử dụng để tạo **Session Report** sau phiên, giúp người dùng hiểu rõ hơn về mức độ tập trung của mình thay vì chỉ biết “đã hoàn thành” hay “chưa hoàn thành”.
* Lợi ích chính của AI Camera Coach:

  * Tăng tính cam kết khi người dùng tham gia phiên tập trung.
  * Giảm tình trạng rời bàn hoặc bỏ dở giữa phiên.
  * Giúp người dùng nghiêm túc hơn khi thực hiện mục tiêu.
  * Tạo cảm giác có accountability giống như đang học/làm việc cùng một người giám sát.
  * Làm cho sản phẩm khác biệt hơn so với các ứng dụng goal tracker thông thường.
* Để đảm bảo quyền riêng tư, toàn bộ quá trình nhận diện camera được xử lý **local trên trình duyệt**:

  * Không lưu video.
  * Không lưu ảnh.
  * Không gửi camera frame lên server.
  * Backend chỉ nhận các dữ liệu thống kê tổng hợp như `Presence Score`, `Focus Score` và `Away Count`.

---

### Luồng phòng kỷ luật hoàn chỉnh

* Bổ sung flow đầy đủ cho Discipline Room:

  * Tạo phòng.
  * Sinh mã mời.
  * Partner tham gia phòng.
  * Creator bắt đầu phiên.
  * Camera AI theo dõi trạng thái tập trung.
  * Gửi heartbeat để đồng bộ trạng thái phiên.
  * Kết thúc phiên.
  * Lưu báo cáo sau phiên.
* Người dùng có thể tạo Discipline Room với:

  * Tên phiên.
  * Chế độ tập trung.
  * Thời lượng phiên.
* Hệ thống tự động sinh **mã mời 6 ký tự độc nhất** để partner có thể tham gia phòng.
* Phiên bản MVP hiện tại hỗ trợ tối đa **2 người trong một phòng**, gồm:

  * Creator
  * Partner
* Partner có thể tham gia phòng thông qua invite code.
* Creator có thể bắt đầu phiên sau khi phòng được tạo.
* Partner được tự động điều hướng vào phiên khi creator bắt đầu.
* Sau khi phiên kết thúc, hệ thống hiển thị báo cáo gồm:

  * Duration
  * Presence Score
  * Focus Score
  * Away Count
  * XP Earned
  * AI Coach Insight

---

### Hệ thống API mới cho Discipline Room

* Thêm bộ API mới để hỗ trợ toàn bộ luồng Discipline Room:

| Method | Endpoint                             | Mô tả                                                    |
| ------ | ------------------------------------ | -------------------------------------------------------- |
| `POST` | `/api/discipline-room/create`        | Tạo phòng mới và sinh invite code độc nhất               |
| `POST` | `/api/discipline-room/join`          | Tham gia phòng bằng mã mời                               |
| `GET`  | `/api/discipline-room/:id`           | Lấy thông tin phòng, trạng thái và danh sách participant |
| `POST` | `/api/discipline-room/:id/start`     | Bắt đầu phiên tập trung                                  |
| `POST` | `/api/discipline-room/:id/heartbeat` | Gửi trạng thái phiên định kỳ                             |
| `POST` | `/api/discipline-room/:id/end`       | Kết thúc phiên, tính XP và lưu báo cáo                   |
| `GET`  | `/api/discipline-room/:id/report`    | Lấy báo cáo sau phiên                                    |

* Các API được thiết kế để phục vụ đầy đủ flow:

  * Create Room
  * Join Room
  * Start Session
  * Active Session Heartbeat
  * End Session
  * Session Report

---

### Tích hợp XP thật

* Kết nối Discipline Room với hệ thống XP hiện có của người dùng.
* XP không còn là dữ liệu mock mà được tính và cập nhật thật sau khi người dùng hoàn thành phiên.
* XP được tính dựa trên **Focus Score** sau phiên.
* Người dùng có thể nhận tối đa **180 XP** nếu hoàn thành phiên với mức tập trung cao.
* Sau khi nhận XP, hệ thống tự động cập nhật:

  * Tổng XP của user.
  * Level hiện tại của user.
  * Tiến trình phát triển của user trong hệ thống gamification.
* Việc tích hợp XP thật giúp Discipline Room trở thành một phần có giá trị trong vòng lặp động lực của sản phẩm:

  * Tham gia phiên.
  * Duy trì tập trung.
  * Nhận XP.
  * Tăng level.
  * Có động lực tiếp tục sử dụng.

---

### Session Report lưu trữ bền vững

* Thêm khả năng lưu trữ báo cáo phiên làm việc vào database thông qua model `SessionReport`.
* Mỗi phiên sau khi kết thúc sẽ có một báo cáo riêng, giúp người dùng có thể xem lại hiệu suất tập trung của mình.
* Báo cáo bao gồm:

  * Thời lượng phiên.
  * Presence Score.
  * Focus Score.
  * Away Count.
  * XP Earned.
  * AI Coach Insight.
* AI Coach Insight được xử lý ở backend dựa trên dữ liệu hiệu suất thực tế của phiên.
* Session Report giúp người dùng không chỉ biết mình có hoàn thành phiên hay không, mà còn hiểu được chất lượng của phiên tập trung.

---

### AI Coach Insight

* Bổ sung AI Coach Insight sau mỗi phiên Discipline Room.
* Insight được tạo dựa trên các chỉ số như:

  * Focus Score
  * Presence Score
  * Away Count
  * XP Earned
* AI Coach Insight giúp người dùng nhận được phản hồi sau phiên, ví dụ:

  * Khen khi duy trì tập trung tốt.
  * Nhắc nhở khi rời khỏi camera nhiều lần.
  * Gợi ý cải thiện cho phiên tiếp theo.
* Chức năng này giúp Discipline Room có cảm giác giống một **AI Accountability Coach**, không chỉ ghi nhận dữ liệu mà còn đưa ra phản hồi có ý nghĩa.

---

### Cải tiến UI/UX

* Thêm giao diện tạo Discipline Room trực quan và dễ sử dụng.
* Thêm giao diện nhập invite code để partner tham gia phòng.
* Cải thiện màn hình Waiting Room để hiển thị:

  * Tên phòng.
  * Invite code.
  * Trạng thái partner.
  * Trạng thái chờ bắt đầu phiên.
* Cải thiện màn hình Active Session với:

  * Camera preview.
  * Timer.
  * AI status.
  * Presence Score.
  * Focus Score.
  * Away Count.
  * Partner/session status.
* Cải thiện Session Report để hiển thị kết quả rõ ràng sau phiên.
* Bổ sung loading state cho các thao tác:

  * Tạo phòng.
  * Tham gia phòng.
  * Bắt đầu phiên.
  * Gửi heartbeat.
  * Kết thúc phiên.
* Bổ sung error handling khi thao tác API thất bại.
* Thêm thông báo quyền riêng tư cho camera để người dùng hiểu rõ dữ liệu camera được xử lý như thế nào.

---

## Kỹ thuật

### Database

* Thêm các model mới trong Prisma để hỗ trợ Discipline Room:

| Model             | Vai trò                            |
| ----------------- | ---------------------------------- |
| `DisciplineRoom`  | Lưu thông tin phòng kỷ luật        |
| `RoomParticipant` | Lưu thông tin người tham gia phòng |
| `SessionReport`   | Lưu báo cáo sau phiên              |

* Các model mới giúp hệ thống lưu trữ:

  * Thông tin phòng.
  * Creator.
  * Partner.
  * Invite code.
  * Trạng thái phòng.
  * Thời gian bắt đầu/kết thúc.
  * Kết quả phiên.
  * XP nhận được.
  * AI Coach Insight.

---

### Backend

* Triển khai `disciplineRoomController.ts` để xử lý toàn bộ logic nghiệp vụ của Discipline Room.
* Mở rộng `PrismaDB` wrapper trong `server/db.ts` để hỗ trợ các thao tác phức tạp liên quan đến room, participant và session report.
* Đăng ký route mới cho Discipline Room trong hệ thống Express.
* Bổ sung các kiểm tra quan trọng:

  * Chỉ user đã đăng nhập mới được tạo/tham gia phòng.
  * Phòng chỉ cho phép join khi đang ở trạng thái `WAITING`.
  * Mỗi phòng MVP chỉ hỗ trợ tối đa 2 participant.
  * Invite code phải độc nhất.
  * Creator là người có quyền bắt đầu phiên.
  * Backend không nhận hoặc lưu ảnh/video từ camera.
* API end session đảm nhiệm:

  * Nhận dữ liệu thống kê từ frontend.
  * Tính XP.
  * Cập nhật XP/level cho user.
  * Lưu Session Report.
  * Trả về kết quả để frontend hiển thị.

---

### Frontend

* Thay thế dữ liệu mock bằng API thật cho các luồng chính:

  * Create Room
  * Join Room
  * Start Session
  * Heartbeat
  * End Session
  * Session Report
* Tích hợp cơ chế heartbeat/polling để đồng bộ trạng thái phiên giữa creator và partner.
* Giữ AI Face Detection chạy local trên browser.
* Frontend chỉ gửi các dữ liệu thống kê tổng hợp lên server:

  * `Presence Score`
  * `Focus Score`
  * `Away Count`
  * `Status`
* Bổ sung loading state và error state cho các thao tác quan trọng.
* Tăng độ ổn định khi chuyển giữa các màn hình:

  * Create Room
  * Waiting Room
  * Active Session
  * Session Report

---

### Bảo mật và quyền riêng tư

* Camera AI được thiết kế theo hướng privacy-first.
* Hệ thống không lưu trữ dữ liệu nhạy cảm từ camera.
* Các nguyên tắc đã áp dụng:

  * Không lưu video.
  * Không lưu ảnh.
  * Không gửi camera frame lên server.
  * Không nhận diện danh tính khuôn mặt.
  * Không dùng camera để xác thực danh tính người dùng.
  * Chỉ xử lý face detection local trên browser.
  * Backend chỉ nhận dữ liệu thống kê tổng hợp.
* Cách làm này giúp giảm rủi ro quyền riêng tư nhưng vẫn giữ được giá trị cốt lõi của AI Camera Coach.

---

## Giá trị nổi bật

* Discipline Room giúp Daily Goal Tracker trở nên khác biệt so với các app quản lý mục tiêu thông thường.
* Tính năng này biến trải nghiệm theo dõi mục tiêu từ dạng thụ động sang dạng chủ động:

  * Không chỉ tick hoàn thành.
  * Không chỉ xem streak.
  * Không chỉ nhận XP.
  * Mà còn có phiên tập trung được AI hỗ trợ theo dõi.
* AI Camera Coach giúp người dùng có thêm cảm giác trách nhiệm trong quá trình thực hiện mục tiêu.
* Session Report giúp người dùng nhìn lại chất lượng phiên làm việc thay vì chỉ biết kết quả cuối cùng.
* XP thật và level thật giúp tăng động lực quay lại sử dụng sản phẩm.
* Kiến trúc hiện tại đã sẵn sàng để phát triển tiếp các chức năng nâng cao như:

  * Socket.io realtime.
  * Partner status realtime.
  * AI Coach API thật.
  * Activity history.
  * Focus analytics.
  * Camera AI nâng cao theo từng mode.

---

## Ghi chú

* Phiên bản hiện tại đã chuyển Discipline Room từ demo local sang tính năng full-stack cơ bản.
* Camera AI vẫn được xử lý local trên trình duyệt để đảm bảo quyền riêng tư.
* Cơ chế đồng bộ hiện tại sử dụng polling/heartbeat.
* Socket.io realtime có thể được triển khai ở phase tiếp theo để đồng bộ trạng thái partner mượt hơn.
* AI Coach Insight hiện được xử lý dựa trên logic backend, chưa tích hợp AI API nâng cao.
* Camera AI hiện mới tập trung vào nhận diện trạng thái cơ bản như `Focused/Away`; các trạng thái nâng cao như `Reading/Writing`, `Looking Away`, `Head Down`, `Low Confidence` có thể được phát triển ở sprint sau.


## [Sprint 9] - 2026-06-10 (Friends Follow & Activity Feed)
### Đã thêm
- **Theo dõi bạn bè & Feed hoạt động (US-29)**:
  - Trang `/friends` mới để tìm kiếm và theo dõi người dùng khác.
  - Thanh tìm kiếm theo tên hoặc email với cơ chế debounce tối ưu.
  - Hệ thống theo dõi 1 chiều (không cần duyệt).
  - Khung "Bạn bè hôm nay" trên Dashboard hiển thị 5 hoạt động check-in mới nhất từ bạn bè.
  - Toggle quyền riêng tư trong Settings để ẩn/hiện hoạt động cá nhân trên feed người khác.
  - Hiển thị số lượng "Đang theo dõi" và "Người theo dõi" trong trang Settings.
  - Cập nhật Sidebar và Bottom Nav để truy cập nhanh trang Bạn bè.
  - Optimistic updates cho các hành động theo dõi/hủy theo dõi.

### Kỹ thuật
- **Prisma Schema:** Thêm model `Follow` và trường `show_activity_in_feed` vào model `User`.
- **API Endpoints:**
  - `GET /api/friends/search`: Tìm kiếm người dùng.
  - `POST /api/friends/follow`: Theo dõi người dùng.
  - `DELETE /api/friends/follow`: Hủy theo dõi người dùng.
  - `GET /api/friends/feed`: Lấy feed hoạt động của bạn bè.
  - `GET /api/friends/stats`: Lấy số lượng follow.
  - `PATCH /api/friends/privacy`: Cập nhật thiết lập quyền riêng tư.
- **Frontend:**
  - `src/pages/FriendsPage.tsx`: Trang quản lý bạn bè.
  - `src/components/friends/`: Các component search, card và follow button.
  - `src/components/dashboard/FriendsTodayCard.tsx`: Card feed hoạt động trên Dashboard.
  - Cập nhật `authStore` để quản lý trạng thái quyền riêng tư.

## [Sprint 9] - 2026-06-10 (Group Invite & Member Management)
### Đã thêm
* **Mời thành viên qua Link (Group Invite Link):**
  - Cho phép người tạo nhóm (Admin) tạo link mời duy nhất để chia sẻ cho bạn bè.
  - Mã mời (Invite Code) ngẫu nhiên 8 ký tự, đảm bảo tính duy nhất.
  - Link mời có hiệu lực trong **7 ngày**. Link cũ tự động vô hiệu khi admin tạo link mới.
  - Tích hợp nút **📋 Sao chép** (Clipboard API) và **📤 Chia sẻ** (Web Share API) giúp gửi link nhanh chóng.
* **Luồng Tham gia nhóm (Join Flow):**
  - Trang tham gia nhóm chuyên dụng: `/join/{invite_code}`.
  - Hiển thị thông tin nhóm (Tên, số lượng thành viên) trước khi xác nhận tham gia.
  - Tự động xử lý luồng đăng nhập: Nếu chưa đăng nhập, user được chuyển hướng tới Login và tự động quay lại trang Join sau khi thành công.
  - Kiểm tra điều kiện tham gia: Link còn hạn, nhóm chưa đầy, user chưa phải là thành viên.
* **Giới hạn số lượng thành viên:**
  - Thiết lập giới hạn tối đa **20 thành viên/nhóm**.
  - Tự động vô hiệu hóa link mời và chặn tham gia khi nhóm đã đạt giới hạn.
  - Thông báo rõ ràng "Nhóm đã đầy" trên giao diện Join Page.
* **Quản lý thành viên (Member Management):**
  - Tích hợp **GroupInvitePanel** vào trang chi tiết nhóm dành riêng cho Admin.
  - Đảm bảo tính năng xóa thành viên hiện có vẫn hoạt động ổn định và không bị ảnh hưởng bởi luồng mời mới.

### Kỹ thuật
* **Prisma Schema:** Cập nhật model `HabitGroup` thêm `invite_code`, `invite_expires_at`, và `max_members`.
* **API Endpoints:**
  - `POST /api/groups/:groupId/invite`: Tạo mã mời mới.
  - `GET /api/groups/invite/:inviteCode`: Lấy thông tin nhóm từ mã mời.
  - `POST /api/groups/join/:inviteCode`: Tham gia nhóm qua mã mời.
* **Frontend:**
  - `src/pages/JoinGroupPage.tsx`: Trang join công khai.
  - `src/components/groups/GroupInvitePanel.tsx`: Panel quản lý mời thành viên cho Admin.
  - Cập nhật `authStore` và `LoginPage` để hỗ trợ redirect sau login (`?redirect=...`).

## [Sprint 9] - 2026-06-10 (Groups Page UI Refactor)
### Cải tiến
* **Tối ưu hóa không gian hiển thị (Compact UI):** Refactor toàn bộ giao diện trang Nhóm thói quen để khắc phục tình trạng giao diện bị phình to, giúp người dùng bao quát thông tin tốt hơn.
* **Bố cục tổng thể (Layout Optimization):**
  - Giảm chiều rộng tối đa (`max-width`) của trang và header từ 1500px xuống 1400px.
  - Thu hẹp thanh bên (sidebar) từ 430px xuống còn 380px.
  - Giảm các khoảng cách (`gap`) và lề (`padding`) trên toàn bộ trang.
* **Thành phần giao diện (Component Refinement):**
  - **GroupCard:** Thu nhỏ biểu tượng, font chữ tiêu đề (13px) và nội dung. Compact lại khối thông tin mục tiêu chung.
  - **MemberRow:** Thu nhỏ Avatar, đơn giản hóa bảng chỉ số (Tiến độ, Chuỗi, Trạng thái) và thanh progress bar (độ dày 1.5px).
  - **Chi tiết nhóm (Active Group View):** Thu gọn các khối thống kê (Đã đạt, Tiến độ TB), tối ưu lại header và khu vực bảng xếp hạng.
  - **Modal tạo nhóm:** Giảm chiều rộng (`max-width-2xl`), thu nhỏ các ô nhập liệu và khu vực preview.
* **Hệ thống thảo luận (Chat UI Refactor):**
  - Giảm chiều cao khung chat từ 500px xuống 400px.
  - Thu nhỏ Avatar thành viên (8x8), bong bóng chat và các biểu tượng cảm xúc (reactions).
  - Tối ưu font chữ tin nhắn (11px) để phù hợp với giao diện tinh gọn mới.

## [Sprint 9] - 2026-06-10 (Group Comments & Chat)
### Đã thêm
* **Bình luận & Chat nhóm (Group Chat):** Tích hợp hệ thống thảo luận trực tiếp trong từng nhóm thói quen để các thành viên có thể động viên và giữ trách nhiệm cho nhau.
* **Hiển thị tin nhắn:** Hiển thị tối đa 30 tin nhắn gần nhất với đầy đủ thông tin: Avatar (2 ký tự tên), tên người gửi, nội dung tin nhắn và thời gian gửi tương đối (vừa xong, 5 phút trước...).
* **Phản ứng Emoji (Reactions):** Hỗ trợ 5 emoji phản ứng nhanh (🔥 💪 👏 ❤️ 😂) cho mỗi tin nhắn. Người dùng có thể toggle reaction và xem số lượng phản ứng của cả nhóm.
* **Gửi tin nhắn thông minh:** Hỗ trợ gửi tin bằng nút "Gửi" hoặc phím "Enter" (Shift+Enter để xuống dòng). Giới hạn nội dung tối đa 200 ký tự.
* **Cập nhật tức thì (Optimistic UI):** Áp dụng kỹ thuật optimistic update giúp tin nhắn và reaction xuất hiện ngay lập tức trên giao diện trước khi có phản hồi từ server.
* **Quyền quản trị & Moderation:** 
  - Người tạo nhóm (Owner) có quyền xóa bất kỳ tin nhắn nào trong nhóm.
  - Thành viên thường có thể xóa tin nhắn của chính mình.
  - Chặn các hành động xóa trái phép từ phía API.
* **Quản lý thành viên (Member Management):**
  - Người tạo nhóm (Owner/Admin) có quyền xóa thành viên khỏi nhóm.
  - Khi xóa thành viên, hệ thống tự động xóa mục tiêu thói quen và chuỗi streak liên quan của người đó trong nhóm.
  - Tích hợp nút xóa (`person_remove`) trực quan ngay trên bảng xếp hạng thành viên dành cho Admin.
  - Có thông báo xác nhận trước khi thực hiện hành động xóa để tránh nhầm lẫn.
* **Thông báo đẩy (Push Notifications):**
  - Tự động gửi push notification đến tất cả thành viên trong nhóm khi có tin nhắn mới (loại trừ người gửi).
  - **Giới hạn chống spam:** Mỗi người dùng chỉ nhận tối đa 3 thông báo chat nhóm mỗi ngày để tránh làm phiền.
  - Hệ thống log thông báo (`GroupChatNotificationLog`) để kiểm soát hạn ngạch hàng ngày.
* **Giao diện tối ưu:**
  - Thiết kế card chat đồng bộ với phong cách Glassmorphism của ứng dụng.
  - Tự động cuộn xuống tin nhắn mới nhất.
  - Tối ưu hiển thị trên Mobile, xử lý vùng an toàn (safe areas) và bàn phím ảo.
  - Hỗ trợ đầy đủ Light Mode và Dark Mode.
  - Đa ngôn ngữ (Tiếng Việt & Tiếng Anh).

### Kỹ thuật
* **Prisma Schema:** Thêm model `GroupMessage`, `MessageReaction` và `GroupChatNotificationLog`.
* **API Endpoints:**
  - `GET /api/groups/:groupId/messages`
  - `POST /api/groups/:groupId/messages`
  - `POST /api/groups/:groupId/messages/:messageId/reactions`
  - `DELETE /api/groups/:groupId/messages/:messageId`
  - `DELETE /api/groups/:id/members/:userId`: Endpoint xóa thành viên khỏi nhóm.
* **Real-time Refresh:** Tự động làm mới danh sách tin nhắn mỗi 30 giây để đảm bảo tính cập nhật.

## [Sprint 8] - 2026-06-10 (Pomodoro Timer Integration)
### Đã thêm
* **Hẹn giờ Pomodoro (Pomodoro Timer):** Tích hợp bộ hẹn giờ Pomodoro trực tiếp vào ứng dụng để tăng cường sự tập trung.
* **Tùy chỉnh thời gian Pomodoro (Configurable Durations):** Cho phép người dùng tự setup thời gian Tập trung, Nghỉ ngắn và Nghỉ dài thay vì cố định như trước.
* **Cài đặt Pomodoro trong Settings:** Bổ sung khu vực cấu hình thời gian Pomodoro trong trang Cài đặt.
* **Cài đặt nhanh trên Widget:** Thêm biểu tượng răng cưa trên Pomodoro Widget để điều chỉnh nhanh thời gian mà không cần rời khỏi Dashboard.
* **Pomodoro Floating Widget:** Widget nổi cố định ở góc màn hình, hiển thị tên mục tiêu, chế độ (Tập trung, Nghỉ ngắn, Nghỉ dài) và đồng hồ đếm ngược. Hỗ trợ Pause, Resume, Stop và thu nhỏ (minimize).
* **Nút Pomodoro trên GoalCard:** Thêm nút khởi chạy Pomodoro cho từng mục tiêu đang hoạt động. Có cảnh báo xác nhận khi chuyển đổi giữa các mục tiêu.
* **Chu kỳ Pomodoro chuẩn:** 25 phút Tập trung -> 5 phút Nghỉ ngắn (lặp lại 4 lần) -> 15 phút Nghỉ dài.
* **Ghi nhận tiến độ thông minh:** Sau mỗi phiên tập trung 25 phút, hệ thống tự động hỏi người dùng có muốn ghi nhận (log) tiến độ cho mục tiêu đó không.
* **Âm thanh thông báo nâng cao:** Nâng cấp âm thanh kết thúc chu kỳ thành chuỗi "Ding-Dong" (2 nốt) êm ái và rõ ràng hơn bằng Web Audio API.
* **Thông báo hệ thống (Browser Notifications):** Tích hợp thông báo đẩy trên trình duyệt khi kết thúc phiên Tập trung hoặc Nghỉ ngơi, giúp người dùng nhận biết ngay cả khi đang ở tab khác hoặc ứng dụng khác.
* **Thống kê Pomodoro trên Dashboard:** Hiển thị số phiên Pomodoro đã hoàn thành trong ngày ngay trên Dashboard.
* **Đa ngôn ngữ:** Hỗ trợ đầy đủ tiếng Việt và tiếng Anh cho giao diện và nội dung thông báo Pomodoro.

### Cải tiến
* **Timer chính xác:** Sử dụng thuật toán dựa trên timestamp (`Date.now()`) để loại bỏ tình trạng sai lệch thời gian (drift) sau nhiều chu kỳ.
* **Lưu trữ bền vững:** Thống kê Pomodoro được lưu trữ cục bộ qua `localStorage` (Zustand persist), đảm bảo không mất dữ liệu khi refresh trang.
* **Giao diện Responsive:** Widget được tối ưu hiển thị trên cả Mobile và Desktop, hỗ trợ Light Mode và Dark Mode.

## [Sprint 8] - 2026-06-10 (Archive & Bulk Actions)
### Đã thêm
* **Lưu trữ mục tiêu (Archive):** Thêm khả năng lưu trữ các mục tiêu cũ. Mục tiêu được lưu trữ sẽ biến mất khỏi Dashboard và các tính toán thống kê nhưng vẫn giữ nguyên log cũ trong database.
* **Tab "Đã lưu trữ":** Bổ sung tab riêng biệt trên trang Quản lý Mục Tiêu (`/goals`) để xem và khôi phục các mục tiêu đã lưu trữ.
* **Thao tác hàng loạt (Bulk Actions):** Kích hoạt chế độ "Chọn nhiều" để người dùng thực hiện Lưu trữ, Tạm dừng, Khôi phục, hoặc Xóa hàng loạt mục tiêu chỉ với 1 click.
* **Floating Action Bar (FAB):** Thanh công cụ trượt lên thông minh khi đang trong chế độ chọn nhiều, tích hợp các action thao tác hàng loạt.
* **Bulk Delete Modal:** Thêm modal xác nhận liệt kê các mục tiêu sắp bị xóa để chống rủi ro thao tác nhầm.

### Cải tiến
* **Schema Database:** Thêm trường `is_archived` (Boolean) và `archived_at` (DateTime) vào model `Goal`.
* **API Hiệu suất cao:** Thêm các endpoint `PUT /bulk/archive`, `PUT /bulk/pause`, `POST /bulk/delete` để cập nhật đồng thời nhiều bản ghi.
* **Vá lỗi tự động Reset (`syncAndResetGoalProgress`):** Hàm reset chu kỳ giờ đây tôn trọng và bảo vệ trạng thái "paused" của mục tiêu, không tự động kích hoạt lại các thói quen đang bị đóng băng.

## [Sprint 8] - 2026-06-10 (Trend Comparison - Realtime Daily Summary)
### Đã thêm
* **Trend Comparison trên Stats Dashboard:** Thêm widget so sánh xu hướng hiệu suất thói quen theo ngày, tuần và tháng ngay sau Bento Grid.
* **API thống kê xu hướng:** Thêm endpoint `GET /api/stats/trend` hỗ trợ `period=day|week|month` và `goalId` tùy chọn để lọc theo từng mục tiêu.
* **Chế độ xem tất cả mục tiêu:** Thêm 2 chế độ hiển thị khi chọn `Tất cả mục tiêu`: `Tổng thể` để xem biểu đồ chung và `Chi tiết` để xem từng mục tiêu theo hàng ngang.
* **Tổng kết theo ngày:** Thêm bảng `Hôm qua` và `Hôm nay` hiển thị số mục tiêu đã đạt target và chưa đạt target.
* **Gợi ý cải thiện theo ngày:** Thêm khối gợi ý dựa trên các mục tiêu hôm qua/hôm nay chưa đạt target.

### Cải tiến
* **Dữ liệu realtime và thực tế hơn:** API đọc trực tiếp từ `GoalLog`, chống cache bằng `Cache-Control: no-store` và tính toán lại theo dữ liệu hiện tại.
* **So sánh tuần theo tuần lịch:** Chế độ tuần dùng tuần lịch Monday-Sunday và so sánh với tuần lịch liền trước, không còn dùng cách lấy hôm nay trừ 7 ngày.
* **Logic bảng Hôm qua/Hôm nay chính xác hơn:** Bảng ngày không còn tính goal là hoàn thành chỉ vì có ít nhất 1 log; hiện tại goal chỉ được tính `Đã đạt` khi số log trong ngày lớn hơn hoặc bằng `target_count`.
* **Hiển thị tiếng Việt có dấu:** Chuẩn hóa text trong widget sang tiếng Việt, bao gồm `Tổng thể`, `Chi tiết`, `Kỳ trước`, `Hiện tại`, `Đã đạt`, `Chưa đạt`.
* **UX khi lọc mục tiêu:** Khi chọn một mục tiêu cụ thể, widget hiển thị rõ tên mục tiêu đang lọc; khi xem tất cả mục tiêu, widget ghi rõ đang xem tổng thể hay chi tiết.
* **Thứ tự so sánh trực quan hơn:** `Kỳ trước` hiển thị bên trái, `Hiện tại` hiển thị bên phải trong biểu đồ và thẻ chi tiết.

## [Sprint 8] - 2026-06-10 (Trend Comparison & Goal Comparison)
### Thêm mới & Cải tiến (Added & Improved)
* **Widget Trend Comparison (So sánh xu hướng):** Thêm component `TrendComparison` trong `src/components/stats/` sử dụng `recharts` để vẽ biểu đồ cột đôi (Grouped Bar Chart). Tích hợp trực tiếp vào màn hình `Stats Dashboard` ngay bên dưới khối Bento Grid.
* **So sánh hiệu suất đa khung hình:** Hỗ trợ so sánh hiệ2u suất thói quen theo 3 mốc thời gian: `Ngày vs Ngày`, `Tuần này vs Tuần trước`, và `Tháng này vs Tháng trước`. Hiển thị tỷ lệ phần trăm thay đổi (tăng/giảm) trực quan bằng màu sắc (xanh/đỏ) trong chế độ so sánh Tháng.
* **Bộ lọc và Hiển thị chi tiết:** Cung cấp bộ lọc dropdown cho phép người dùng xem dữ liệu theo "Tất cả mục tiêu" hoặc chọn một mục tiêu cụ thể. Tích hợp Custom Tooltip hiển thị chi tiết tên mốc thời gian, giá trị kỳ hiện tại, giá trị kỳ trước và tên mục tiêu.
* **API Endpoint Trend Comparison:** Thêm mới route `GET /api/stats/trend` trong `src/routes/stats.ts`. Hỗ trợ các query parameter `period` (`day`, `week`, `month`) và `goalId` (tùy chọn).
* **Xử lý Logic Backend:** Xây dựng logic trong `statsController.ts` tính toán tổng hiện tại, kỳ trước, tỷ lệ phần trăm thay đổi và format dữ liệu phù hợp với `recharts`.

## [Đã hoàn thành] - Sprint 8 - Hoàn thiện nhắc hẹn trong app và gỡ thông báo thử - 2026-06-09 (GMT+7)

### Đã thêm & cải tiến
* **Bổ sung cơ chế nhắc hẹn trong app theo logic giống Zalo:**
  - Thêm `src/components/InAppReminderCenter.tsx` để hiển thị popup/toast nhắc hẹn trực tiếp trong giao diện khi app đang mở.
  - Popup nhắc hẹn hoạt động độc lập với Web Push của Chrome/Windows, giúp người dùng vẫn nhận được nhắc nhở ngay cả khi notification hệ điều hành bị chặn hoặc không hiển thị.
  - Tự kiểm tra các mục tiêu `active`, có `reminder_time`, chưa hoàn thành đủ `target_count`, và chỉ nhắc đúng phút đã cài đặt.
  - Thêm cơ chế chống nhắc trùng trong cùng ngày bằng key lưu trong `localStorage`.
  - Popup có nút **Hoàn thành** để check-in nhanh và nút **Mở mục tiêu** để chuyển tới trang mục tiêu.
  - Thêm âm báo nhẹ bằng Web Audio API khi tới giờ nhắc, với fallback an toàn nếu trình duyệt chặn audio.
  - Vẫn thử hiển thị system notification qua browser/service worker nếu quyền notification đang được bật, nhưng không phụ thuộc vào nó.

* **Tích hợp nhắc hẹn vào layout chính:**
  - Gắn `InAppReminderCenter` vào `AppLayout` trong `src/App.tsx` để bộ nhắc hoạt động trên toàn bộ app: Dashboard, Goals, Settings, Stats, Timeline, Groups.

* **Cải thiện Service Worker cho thông báo thật:**
  - Giữ Service Worker hoạt động trên localhost để hỗ trợ Web Push khi test nhắc hẹn.
  - Không dùng tag cố định `active-reminder-tag` nữa; mỗi notification có tag riêng để tránh Chrome gộp hoặc ghi đè thông báo cũ.
  - Thêm `requireInteraction: true` cho push notification để thông báo khó bị tự ẩn quá nhanh.

### Đã gỡ bỏ
* **Gỡ chức năng gửi thông báo thử:**
  - Xóa nút **Gửi thông báo thử** khỏi trang Settings.
  - Xóa state, handler và thông báo thành công/lỗi chỉ phục vụ test trong `SettingsPage.tsx`.
  - Xóa endpoint backend `POST /api/auth/test-notification`.
  - Xóa controller `sendTestNotification` khỏi `authController.ts`.
  - Xóa các helper test notification không còn dùng trong `pushNotification.ts`.

### Kiểm tra
* `npm run lint`: pass.
* `npm run build`: pass.
* Restart dev server thành công.
* `GET /api/health`: trả `200`.
* `POST /api/auth/test-notification`: trả `404`, xác nhận endpoint test đã được gỡ.

## [Đã hoàn thành] - Sprint 8 - Cập nhật sửa lỗi XP & Cấp độ (US-21) - 2026-06-09 (GMT+7)

### Đã sửa lỗi
* **Sửa lỗi không nhận được thông báo popup (nhắc nhở từng mục tiêu):**
  - **Tránh kẹt Promise do Service Worker:** Trong `InAppReminderCenter.tsx` và `pushNotification.ts`, hàm hiển thị thông báo từng mục tiêu bị kẹt vô hạn ở `await navigator.serviceWorker.ready` khi chạy trên localhost hoặc khi Service Worker chưa sẵn sàng. Đã tối ưu bằng cách bọc `ready` qua `Promise.race` kèm thời gian chờ (safety timeout) 1.5 - 3 giây, đồng thời ưu tiên tạo thông báo trực tiếp qua `new Notification(...)` trên môi trường Desktop để hiển thị tức thời mà không cần chờ Service Worker.
  - **Sửa lỗi lọc thông báo và crash DB Helper:** Hàm `db.notifications.findMany()` trong `server/db.ts` bị lỗi `TypeError` khi gọi không tham số. Đã sửa điều kiện `where` thành tùy chọn (`where?: ...`) để kiểm tra an toàn trước khi truy vấn database.
  - **Tránh bỏ lỡ mốc giờ do lệch nhịp giây:** Cập nhật tần suất quét của scheduler (`startReminderScheduler`) từ 60 giây thành 30 giây để đảm bảo quét kịp mốc giờ người dùng cài đặt, kết hợp cơ chế ghi nhận đệm đã có để loại trừ trùng lặp thông báo.
* **Sửa lỗi trắng màn sau khi thêm hệ thống XP & Cấp độ:**
  - `Sidebar.tsx` đang render các biến `currentLevelData`, `totalXP`, `xpToNext`, `progressPercent` nhưng chưa khai báo/import, làm React/TypeScript lỗi và khiến app trắng màn. Đã bổ sung import từ `xpSystem` và tính toán các giá trị này trước khi render.
  - `LevelUpModal` có thể crash nếu `toLevel` vượt ngoài danh sách `LEVELS`. Đã clamp level trong khoảng 1-10 trước khi lấy dữ liệu level.
  - Đồng bộ Prisma Client sau khi cập nhật schema để backend nhận các field XP mới.

### Backend & Database
* **Backend XP API:**
  - Thêm `src/controllers/xpController.ts` để xử lý cộng XP cho user đã đăng nhập.
  - Thêm `src/routes/xp.ts`.
  - Đăng ký `/api/xp` trong `src/express-app.ts`.
  - Thêm endpoint `POST /api/xp/award`.
  - Validate XP amount là số nguyên dương và giới hạn amount tối đa để tránh cộng XP bất thường.

* **Database & Auth:**
  - Thêm `total_xp Int @default(0)` và `level Int @default(1)` vào model `User`.
  - Đồng bộ Supabase bằng SQL, thêm cột `User.total_xp` và `User.level` với default tương ứng.
  - Cập nhật response register/login/update profile để trả `total_xp` và `level`, giúp frontend render XP ngay sau khi xác thực.

### Kiểm tra
* `npm run lint`: pass.
* `npm run build`: pass.
* Restart dev server thành công.
* `GET /api/health`: trả `200`.
* `GET /login#/login`: trả `200`.
* `POST /api/xp/award` khi chưa đăng nhập trả `401`, xác nhận route tồn tại và được bảo vệ bởi auth middleware.
* Prisma đọc được user với `total_xp` và `level`.

### Thông tin còn thiếu / cần hoàn thiện
* Chưa có migration file chính thức trong `prisma/migrations` cho `User.total_xp` và `User.level`; hiện Supabase đã được bổ sung thủ công bằng SQL.
* Chưa có cơ chế chống cộng XP trùng lặp theo từng action/log ở backend. Hiện frontend gọi fire-and-forget, nên cần bổ sung idempotency nếu muốn chặt chẽ.
* Một số copy XP/Level đang hardcoded tiếng Việt/Anh, cần đưa vào i18n.
* Cần test thực tế luồng check-in, hoàn thành ngày, tham gia nhóm và mốc streak để xác nhận XP cộng đúng từng case.

## [Đã hoàn thành] - Sprint 8 - Hệ thống XP & Cấp độ (US-21) - 2026-06-09 (GMT+7)

### Đã thêm & Cải tiến (Added & Improved)
* **Hệ thống XP & Cấp độ (XP & Level System):**
  - **Cơ chế cộng XP (AC-1):** Tự động cộng điểm cho các hành động: Check-in (+10), Hoàn thành mục tiêu ngày (+25), Mốc streak (7 ngày: +100, 30 ngày: +300...), Tham gia nhóm (+30).
  - **Hệ thống 10 Cấp độ (AC-2):** Xây dựng lộ trình từ 🌱 Beginner đến 👑 Legend với icon và tên cấp độ riêng biệt.
  - **Giao diện Sidebar mới (AC-3):** Thay thế dòng "Pro Member" bằng Badge Level và thanh tiến trình XP trực quan ngay dưới tên người dùng.
  - **Màn hình Chúc mừng Level Up (AC-4):** Hiệu ứng full-screen với Confetti khi người dùng đạt cấp độ mới, tự động đóng sau 5 giây.
  - **Widget XP & Level trong Thống kê (AC-5):** Thêm khu vực Dashboard chi tiết trong trang Stats hiển thị XP tổng, lộ trình cấp độ và bảng quy tắc cộng điểm.
  - **Lưu trữ & Bảo toàn XP (AC-6):** XP được lưu vào database (total_xp, level) và không bị trừ khi người dùng xóa lịch sử nhật ký.

### Tệp mới (New Files)
- `src/lib/xpSystem.ts`: Định nghĩa levels, rules và các hàm tính toán XP thuần túy.
- `src/store/xpStore.ts`: Zustand store quản lý trạng thái XP, action awardXP và level up.
- `src/components/LevelUpModal.tsx`: Component hiển thị màn hình chúc mừng lên cấp.

## [Đã hoàn thành] - Sprint 7 - Ổn định hệ thống, AI Coach và Streak Freeze - 2026-06-09 (GMT+7)

### Đã thêm & cải tiến
* **Hệ thống Mẫu mục tiêu (Goal Templates):**
  - Tạo mới component `GoalTemplateModal.tsx` cho phép người dùng chọn nhanh các thói quen mẫu từ thư viện có sẵn.
  - Xây dựng danh mục mẫu đa dạng: Sức khỏe, Học tập, Thể lực, Công việc, Tài chính và Thói quen hàng ngày (`goalTemplates.ts`).
  - Tích hợp nút "Chọn từ Template" vào trang tạo mục tiêu (`GoalFormPage.tsx`), hỗ trợ pre-fill thông tin tiêu đề, mô tả, danh mục, mục tiêu và tần suất.
  - Hỗ trợ tìm kiếm template theo từ khóa và lọc theo danh mục ngay trong modal.

* **Hệ thống XP & Cấp độ (XP & Level System - US-21):**
  - Triển khai cơ chế cộng điểm kinh nghiệm (XP) cho các hành động: Check-in (+10), Hoàn thành ngày (+25), Mốc streak đặc biệt (+50 đến +1000), Tham gia nhóm (+30), Mời bạn (+20).
  - Hệ thống 10 cấp độ từ 🌱 Beginner đến 👑 Legend với icon và tên riêng biệt (`src/lib/xpSystem.ts`).
  - Cập nhật Sidebar hiển thị Avatar kết hợp Badge Level và thanh tiến độ XP thay cho dòng "Pro Member".
  - Tạo mới component `LevelUpModal.tsx` hiển thị màn hình chúc mừng full-screen kèm hiệu ứng Confetti khi người dùng lên cấp.
  - Thêm widget "XP & Level" chi tiết vào trang Thống kê (Stats.tsx) hiển thị lộ trình 10 cấp độ và bảng quy tắc cộng điểm.
  - Lưu trữ bền vững `total_xp` và `level` trong cơ sở dữ liệu, đảm bảo XP chỉ tăng và không bị trừ khi xóa nhật ký lịch sử.

* **Nhắc nhở riêng từng mục tiêu (US-19):**
  - Thêm trường tùy chọn "Nhắc nhở lúc" (Time picker HH:mm) vào trang tạo và chỉnh sửa mục tiêu.
  - Hiển thị giờ nhắc nhở nhỏ dưới tên mục tiêu trên GoalCard.
  - Cải tiến Scheduler scan DB mỗi phút, bắn push notification đúng giờ đã cài và đúng timezone của người dùng.
  - Nội dung thông báo cá nhân hóa: `⏰ [{Goal Title}] — Đừng quên mục tiêu của bạn hôm nay!`.
  - Tự động bỏ qua thông báo nếu mục tiêu đã hoàn thành trước giờ nhắc.
  - Tối ưu hệ thống nhắc chung 21h: Tự động loại trừ các mục tiêu đã cài đặt giờ nhắc riêng để tránh làm phiền người dùng quá nhiều.

* **Cải tiến xử lý lỗi kết nối (Goal Form):**
  - Thêm tùy chọn "Tôi vẫn đang online, cho tôi tiếp tục" để người dùng có thể bỏ qua cảnh báo offline của trình duyệt trong trường hợp nhận diện nhầm.
  - Tối ưu logic hiển thị: Không tự động chặn toàn màn hình khi người dùng đã bắt đầu nhập liệu, giúp tránh mất dữ liệu khi mạng chập chờn.
  - Cập nhật bộ lọc từ khóa tiếng Việt giúp nhận diện chính xác các lỗi kết nối từ máy chủ.

* **AI Coach Drawer:**
  - Thêm drawer AI Coach mở trực tiếp từ Sidebar và BottomNav, không cần route riêng.
  - Thêm store `aiCoachStore` để điều khiển trạng thái mở/đóng drawer.
  - Thêm backend route `/api/ai/report` và `/api/ai/chat`, gọi Gemini ở phía server để không lộ API key ra client.
  - Bổ sung fallback message khi Gemini lỗi quota, timeout, thiếu key hoặc không kết nối được.
  - Ghi nhận tình trạng thực tế: API key Gemini có thể hợp lệ nhưng vẫn trả `429 RESOURCE_EXHAUSTED` nếu project/key chưa có quota.

* **Streak Freeze / Freeze Token:**
  - Thêm model Prisma `StreakFreeze` và `FreezeToken`.
  - Thêm cột `User.last_freeze_reminder_date` để hỗ trợ nhắc nhở đóng băng streak.
  - Thêm API `/api/freeze/tokens`, `/api/freeze/activate`, `/api/freeze/dates`.
  - Thêm logic bảo vệ streak khi người dùng bỏ lỡ 1 ngày nhưng đã dùng Freeze Token.
  - Thêm UI nút `Protect Streak` trên `GoalCard` khi đủ điều kiện: goal chưa hoàn thành, streak > 0, và đã tới giờ mở tính năng.
  - Thêm dấu ngày đóng băng vào các màn thống kê/timeline để phân biệt với ngày check-in thật.

* **Ổn định đăng nhập và màn trắng:**
  - Sửa `authStore` để không crash nếu `localStorage.user` bị hỏng JSON; app tự xóa session lỗi và quay về login.
  - Tắt đăng ký service worker trên `localhost` để tránh dev server bị cache app shell hoặc JS cũ.
  - Cập nhật `sw.js` để khi chạy local, service worker tự xóa cache, tự unregister và không intercept request.
  - Gỡ request Freeze Token tự động khỏi Sidebar để tránh gọi API phụ khi database chưa migrate đầy đủ.

* **Đồng bộ database Supabase:**
  - Xác minh DB thật thiếu `User.last_freeze_reminder_date`, bảng `StreakFreeze`, bảng `FreezeToken`.
  - Bổ sung các cột/bảng thiếu bằng SQL an toàn, không xóa dữ liệu hiện có.
  - Kiểm tra lại Prisma đọc được user thật và API login không còn trả lỗi schema/database.

### Thông tin còn thiếu / cần hoàn thiện
* Chưa có migration file chính thức trong `prisma/migrations` cho phần Streak Freeze; hiện database Supabase đã được bổ sung thủ công bằng SQL.
* Cần tạo migration chuẩn để team khác hoặc môi trường deploy mới không bị thiếu bảng/cột.
* Giờ mở nút Freeze Token hiện đang nằm ở UI `GoalCard.tsx`; API `/api/freeze/activate` chưa enforce giờ ở backend.
* Copy/UI của Freeze Token còn cần i18n đầy đủ cho tiếng Việt/tiếng Anh.
* Cần kiểm thử lại AI Coach sau khi Gemini API key có quota thật.
* Cần rotate các secret đã từng bị paste vào chat: `DATABASE_URL`, `VAPID_PRIVATE_KEY`, `GEMINI_API_KEY` nếu key thật đã dùng.

Tất cả các thay đổi lớn của dự án sẽ được ghi nhận và cập nhật theo từng Sprint tại đây.


## [Đã hoàn thành] - Sprint 7 - AI Habit Coach (US-16) - 2026-06-09 (GMT+7)

### Đã thêm & Cải tiến (Added & Improved)
* **AI Coach Drawer:**
  - Tạo mới component [AICoachDrawer.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/components/AICoachDrawer.tsx) dạng slide-in drawer từ bên phải, có backdrop overlay, header với icon Brain, nút đóng, skeleton loading và giao diện responsive trên mobile/desktop.
  - Bổ sung banner cảnh báo nguy cơ mất streak trong khung giờ 18:00-21:00, ưu tiên hiển thị thói quen chưa hoàn thành có streak cao nhất.
  - Hiển thị báo cáo tuần gồm tỷ lệ hoàn thành, top thói quen mạnh, top thói quen cần cải thiện, thông điệp động viên và danh sách gợi ý hành động cụ thể từ AI.
* **Chatbot AI Coach:**
  - Thêm giao diện chat tự do trong drawer với bubble user/AI, typing indicator, input cố định cuối drawer và nút gửi icon Send.
  - Không lưu lịch sử chat vào `localStorage` hay server; tin nhắn chỉ tồn tại trong state của component.
  - Bổ sung timeout 15 giây cho request chat/report, kèm thông báo lỗi thân thiện khi AI bận hoặc mất kết nối mạng.
  - Thêm giới hạn 10 lượt chat/ngày bằng `localStorage` với key `ai_coach_usage` và counter hiển thị số lượt còn lại.
* **Điều hướng mở AI Coach:**
  - Tạo mới Zustand store [aiCoachStore.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/store/aiCoachStore.ts) quản lý trạng thái mở/đóng drawer.
  - Cập nhật [Sidebar.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/components/Sidebar.tsx) thêm nút "AI Coach" với icon Brain, dùng cùng style navigation hiện có và không tạo route mới.
  - Cập nhật [BottomNav.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/components/BottomNav.tsx) thêm tab "AI Coach" cho mobile, mở drawer trực tiếp thay vì điều hướng route.
  - Render `<AICoachDrawer />` trong `AppLayout` tại [App.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/App.tsx) để overlay phủ đúng toàn bộ giao diện.
* **Backend Gemini an toàn:**
  - Tạo mới controller [aiController.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/controllers/aiController.ts) gọi `@google/genai` với model `gemini-2.0-flash` ở phía server.
  - Tạo route bảo vệ bằng xác thực tại [ai.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/routes/ai.ts), gồm `POST /api/ai/report` và `POST /api/ai/chat`.
  - Đăng ký route `/api/ai` trong [express-app.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/express-app.ts).
  - Xây dựng context AI ở server-side từ goals, streak và thống kê tổng hợp; không gửi email, id người dùng, password, token hoặc API key lên client.
  - Bổ sung fallback report/reply khi Gemini timeout, lỗi kết nối hoặc thiếu `GEMINI_API_KEY`, giúp UI vẫn nhận response đúng schema và không bị vỡ trải nghiệm.

## [Đã hoàn thành] - Sprint 7 - Tính Năng Chọn Ngôn Ngữ i18n (US-16) - 2026-06-09 10:45 (GMT+7)

### Đã thêm & Cải tiến (Added & Improved)
* **Hệ thống đa ngôn ngữ thuần React (i18n Context & Custom Hook):**
  - Xây dựng hệ thống dịch i18n không dùng thư viện ngoài tại [index.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/i18n/index.tsx), hỗ trợ dịch dựa trên React Context và custom hook `useTranslation()`.
  - Triển khai file từ điển tiếng Việt [vi.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/i18n/vi.ts) và tiếng Anh [en.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/i18n/en.ts) với cấu trúc key-value khớp nhau 100% để đảm bảo an toàn kiểu dữ liệu (`TranslationKeys = typeof vi`).
  - Hỗ trợ nội suy tham số động (dynamic string interpolation) như `{name}`, `{sec}`, `{days}`, `{count}`, `{cat}`.
  - Tự động lưu lựa chọn ngôn ngữ của người dùng vào `localStorage` dưới khóa `setting_language` và tự động áp dụng khi tải lại trang.
* **Tích hợp và địa phương hóa toàn bộ Giao diện (Full Page Localization):**
  - Refactor toàn bộ các trang và component lớn để chuyển các chuỗi text cứng sang hàm dịch `t()` động:
    - **Trang Cài đặt (SettingsPage.tsx):** Thêm phần "Ngôn ngữ / Language" cho phép người dùng chuyển đổi tức thì giữa 🇻🇳 Tiếng Việt và 🇬🇧 English.
    - **Trang Dashboard & Danh mục (DashboardPage.tsx, GoalsPage.tsx):** Địa phương hóa lịch tuần, chỉ số, nhãn danh mục, và bộ lọc.
    - **Trang Onboarding (OnboardingPage.tsx):** Refactor toàn bộ 4 bước hướng dẫn, các thẻ danh mục, form tạo mục tiêu đầu tiên và thông điệp chào mừng theo ngôn ngữ hoạt động.
    - **Trang Thống kê & Chia sẻ (Stats.tsx, ShareModal.tsx):** Chuyển đổi định dạng ngày tháng sang Locale tương ứng, hỗ trợ dịch milestone động và badge chia sẻ.
    - **Trang Nhật ký & Nhóm thói quen (TimelinePage.tsx, GroupsPage.tsx, QuickCheckInPage.tsx, LoginPage.tsx):** Dịch toàn bộ thông báo lỗi, nhãn form, xác nhận cảnh báo, các trạng thái offline, và nút CTA.
* **Cập nhật chức năng lựa chọn ngôn ngữ:**
  - Tạo component dùng chung [LanguageSwitcher.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/components/LanguageSwitcher.tsx) để tái sử dụng UI chuyển đổi ngôn ngữ giữa màn đăng nhập và trang cài đặt.
  - Bổ sung bộ chọn ngôn ngữ dạng rút gọn trên [LoginPage.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/pages/LoginPage.tsx), cho phép người dùng đổi Tiếng Việt/Tiếng Anh trước khi đăng nhập hoặc đăng ký.
  - Thay thế cụm nút chọn ngôn ngữ cũ trong [SettingsPage.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/pages/SettingsPage.tsx) bằng `LanguageSwitcher` để đồng bộ giao diện và hành vi.
  - Cải tiến [i18n/index.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/i18n/index.tsx): kiểm tra giá trị `setting_language` hợp lệ trước khi áp dụng, fallback về `vi`, cập nhật thuộc tính `html lang`, fallback chuỗi dịch thiếu về tiếng Việt, và đồng bộ thay đổi ngôn ngữ giữa các tab qua sự kiện `storage`.

## [Đã hoàn thành] - Sprint 7 - Luồng Onboarding Người Dùng Mới (US-15) - 2026-06-09 10:00 (GMT+7)

### Đã thêm & Cải tiến (Added & Improved)
* **Trang hướng dẫn người dùng mới (User Onboarding Flow):**
  - Tạo mới trang [OnboardingPage.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/pages/OnboardingPage.tsx) quản lý luồng 4 bước giúp người dùng làm quen với ứng dụng mà không bị choáng ngợp:
    - **Step 1 (Welcome):** Chào mừng người dùng mới bằng hiển thị tên động, liệt kê 3 lợi ích cốt lõi của ứng dụng (theo dõi thói quen, xem thống kê chi tiết, và nhận nhắc nhở).
    - **Step 2 (Danh mục):** Hiển thị danh sách 6 categories thói quen cố định (`health`, `learning`, `mindfulness`, `productivity`, `social`, `finance`) dưới dạng thẻ lưới (Grid) 2 cột trên Mobile / 3 cột trên Desktop, hỗ trợ tương tác chọn, highlight viền/nền và kiểm soát trạng thái nút.
    - **Step 3 (Tạo mục tiêu):** Tích hợp form rút gọn tạo mục tiêu đầu tiên (tiêu đề giới hạn tối đa 100 ký tự, tự động điền danh mục từ Step 2, và mặc định tần suất `"daily"`).
    - **Step 4 (Hoàn thành):** Kích hoạt hiệu ứng Confetti chúc mừng rực rỡ, hiển thị thông báo thành công và nút CTA điều hướng trực tiếp về Dashboard.
  - **Thanh tiến độ 4 bước (AC-7):** Thiết kế thanh progress bar sticky/fixed ở đầu trang onboarding, hiển thị rõ ràng 4 giai đoạn, sử dụng màu `var(--color-primary)` cho bước hiện tại, icon check của Material Symbols cho bước đã qua, và đường nối line ngang mượt mà.
  - **Nút Bỏ qua linh hoạt (AC-6):** Thêm nút "Bỏ qua" ở góc trên cùng bên phải từ Step 1 đến Step 3, khi nhấn sẽ lưu cờ `onboarding_completed = true` vào `localStorage` và gửi cập nhật lên server, sau đó chuyển hướng thẳng về Dashboard.
  - **Hiệu ứng Confetti thuần CSS (Confetti.tsx):** Tạo mới component [Confetti.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/components/Confetti.tsx) mô phỏng ~45 hạt giấy rơi tự do với các màu sắc ngẫu nhiên trong bảng màu ứng dụng, hoạt động bằng keyframe animation thuần CSS và tự động unmount giải phóng bộ nhớ sau 5 giây.
  - **Logic điều hướng thông minh (AC-1):** Thêm component điều phối định tuyến `RedirectHandler` trong [App.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/App.tsx) để tự động chuyển hướng người dùng mới đăng ký dưới 5 phút và chưa có thói quen nào sang `/onboarding`.

### Đã sửa đổi & Cập nhật (Changed & Updated)
* **Cơ sở dữ liệu & Server API:**
  - Cập nhật [schema.prisma](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/prisma/schema.prisma) bổ sung trường `onboarding_completed Boolean @default(false)` cho bảng `User`.
  - Cập nhật [db.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/server/db.ts) để khởi tạo và lưu trường trạng thái `onboarding_completed` cho người dùng.
  - Cập nhật file cơ sở dữ liệu mẫu [db.json](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/data/db.json) thiết lập cờ `onboarding_completed": false` mặc định cho các tài khoản test.
  - Sửa đổi hàm `updateProfile` trong [authController.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/controllers/authController.ts) cho phép cập nhật riêng lẻ cờ `onboarding_completed` mà không bắt buộc điền lại `name` và `email`.
* **Quản lý trạng thái client (Zustand Auth Store):**
  - Thêm action `completeOnboarding()` trong [authStore.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/store/authStore.ts) giúp cập nhật trạng thái client-side trong `localStorage` đồng thời đồng bộ lưu trữ về server thông qua API profile PUT.
  - Sửa đổi hàm `checkAuth()` để tự động bổ sung cờ `onboarding_completed` từ bộ nhớ cục bộ khi tải lại trang.
  - Điều chỉnh logic seeding ban đầu trong `login`/`register` chỉ tự động chèn 3 habits mẫu khi cờ `onboarding_completed` đã được bật, tránh gây xung đột với luồng onboarding của người dùng mới.
* **Cấu hình & Tích hợp:**
  - Cập nhật [types.ts](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/types.ts) khai báo đầy đủ trường `onboarding_completed` và `created_at` trong interface `User`.
  - Đăng ký route `/onboarding` bảo vệ bởi `ProtectedRoute` trong [App.tsx](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/src/App.tsx) để cô lập giao diện onboarding khỏi bố cục thanh Sidebar và BottomNav mặc định.
  - Tăng số hiệu phiên bản cache trong Service Worker [sw.js](file:///d:/Th%E1%BB%B1c%20t%E1%BA%ADp/Bai_Binh/Daily-Goal-Tracker/public/sw.js) lên `daily-goal-tracker-v2` để kích hoạt dọn dẹp các cache cũ và đảm bảo trình duyệt người dùng tải mã Javascript mới nhất.

## [Đã hoàn thành] - Mobile Quick Widget (PWA Shortcuts & Quick Check-in) - 2026-06-05 14:35 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Phím tắt check-in nhanh trên điện thoại (Mobile Quick Widget / PWA Shortcuts):**
  - Cập nhật cấu hình [manifest.json](file:///d:/Download/daily-goal-tracker/public/manifest.json) khai báo mảng `shortcuts` trỏ đến `/#/quick-checkin`.
  - Tạo mới trang [QuickCheckInPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/QuickCheckInPage.tsx) thiết kế tối giản, tối ưu cho di động, hỗ trợ rung phản hồi haptic (`navigator.vibrate`) và đếm ngược hoàn tác 5 giây.
  - Đăng ký định tuyến `/quick-checkin` trong [App.tsx](file:///d:/Download/daily-goal-tracker/src/App.tsx) bảo vệ bởi Auth Guard.
  - Thêm banner giới thiệu check-in nhanh trên Dashboard [DashboardPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/DashboardPage.tsx) và bento card hướng dẫn cài đặt PWA chi tiết trên trang Cài đặt [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx).

## [Đã hoàn thành] - Accountability Partners (Habit Groups) & Social Sharing - 2026-06-05 14:15 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Tính năng Đồng đội giám sát (Accountability Partners / Habit Groups):**
  - Cập nhật [schema.prisma](file:///d:/Download/daily-goal-tracker/prisma/schema.prisma) để thêm các bảng `HabitGroup`, `HabitGroupMember` và liên kết trường `group_id` cho thói quen `Goal`.
  - Triển khai các API backend trong [groups.ts](file:///d:/Download/daily-goal-tracker/src/routes/groups.ts) và [groupController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/groupController.ts) để quản lý nhóm thói quen chung và tính toán bảng xếp hạng tiến độ Leaderboard real-time của các thành viên.
  - Xây dựng Zustand [groupStore.ts](file:///d:/Download/daily-goal-tracker/src/store/groupStore.ts) quản lý đồng bộ trạng thái nhóm.
  - Xây dựng giao diện trang nhóm thói quen [GroupsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/GroupsPage.tsx) hiển thị các nhóm đang tham gia, khám phá nhóm mới và chi tiết nhóm kèm Leaderboard tiến độ và chuỗi ngày Streak của từng thành viên.
  - Tích hợp nhãn `👥 Group Habit` trên Dashboard [GoalCard.tsx](file:///d:/Download/daily-goal-tracker/src/components/GoalCard.tsx) để biểu diễn các thói quen thuộc nhóm.
* **Tính năng Chia sẻ thành tích một chạm (Social Sharing):**
  - Xây dựng component [ShareModal.tsx](file:///d:/Download/daily-goal-tracker/src/components/ShareModal.tsx) sử dụng HTML5 Canvas vẽ thẻ vinh danh (Breakthrough Badge Card) và bảng Heatmap đẹp mắt theo phong cách dark glassmorphism (1200x630px).
  - Tích hợp các nút Share một click trên trang thống kê [Stats.tsx](file:///d:/Download/daily-goal-tracker/src/pages/Stats.tsx) (cạnh tiêu đề Heatmap và trên từng Milestone Card) và trên trang nhóm thói quen [GroupsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/GroupsPage.tsx).
  - Hỗ trợ một chạm tải ảnh PNG, gọi Web Share API chia sẻ trên các ứng dụng di động/máy tính và mở intent đăng bài trên Facebook/Twitter.

## [Đã hoàn thành] - Active Reminders Push Notifications - 2026-06-05 13:30 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Tính năng Nhắc nhở chủ động chống đứt chuỗi (Active Reminders):**
  - Tích hợp thư viện `web-push` và tạo trình khởi tạo [vapidHelper.ts](file:///d:/Download/daily-goal-tracker/src/services/vapidHelper.ts) tự động sinh và lưu khóa VAPID vào `.env` khi khởi động dự án.
  - Xây dựng trình lập lịch nền [reminderScheduler.ts](file:///d:/Download/daily-goal-tracker/src/services/reminderScheduler.ts) quét DB mỗi phút, kiểm tra múi giờ của người dùng để đẩy thông báo lúc 21h00 local time nếu còn mục tiêu ngày chưa làm xong.
  - Hỗ trợ cơ chế tự dọn dẹp (self-cleaning) DB đối với các đăng ký đẩy hết hiệu lực (nhận lỗi 410/404 từ nhà mạng).
* **Quản lý Đăng ký và API Web Push phía Backend:**
  - Cập nhật [schema.prisma](file:///d:/Download/daily-goal-tracker/prisma/schema.prisma) thêm trường `push_subscription` và `last_reminder_sent_date` cho bảng `User`.
  - Bổ sung API `PUT /api/auth/push-subscription` đăng ký/hủy đẩy thông báo và `GET /api/auth/vapid-public-key` lấy khóa VAPID công khai.
* **Tích hợp Service Worker và UI phía Client:**
  - Service Worker [sw.js](file:///d:/Download/daily-goal-tracker/public/sw.js) bắt sự kiện `push` hiển thị thông báo "Chống đứt chuỗi! 🔥" và `notificationclick` để mở/focus ứng dụng.
  - Xây dựng tiện ích client [pushNotification.ts](file:///d:/Download/daily-goal-tracker/src/services/pushNotification.ts) xin quyền thông báo và đồng bộ khóa đẩy lên server.
  - Thêm công tắc toggle "Active Reminders" kèm luồng kích hoạt quyền trình duyệt trên màn hình cài đặt [SettingsPage.tsx](file:///d:/Download/daily-goal-tracker/src/pages/SettingsPage.tsx).

## [Đã hoàn thành] - Timezone-Aware Streak & Cycle-Aware Progress Reset Fix - 2026-06-05 11:35 (GMT+7)
### Đã thêm & Cải tiến (Added & Improved)
* **Thuật toán Tính Khoảng Cách Ngày An Toàn Theo Múi Giờ (Timezone-Safe Calendar Diff):**
  - Triển khai hàm `getCalendarDaysDiffTimezone` trong [goalController.ts](file:///d:/Download/daily-goal-tracker/src/controllers/goalController.ts) để chuyển đổi các timestamp ISO thành chuỗi ngày địa phương (`YYYY-MM-DD`) dựa trên cấu hình múi giờ (`timezone`) của người dùng trước khi tính khoảng cách ngày.
  - Sửa đổi toàn bộ hệ thống Streak Engine trong `completeGoal` và `recalculateStreak` để sử dụng cách tính này, giải quyết triệt để lỗi kẹt/mất streak (streak luôn bằng 1) do lệch múi giờ giữa client (+07:00) và server (-07:00).
* **Cơ chế Reset Tiến Độ Theo Chu Kỳ Tự Động (Cycle-Aware Progress Reset Engine):**
  - Phát triển hàm `syncAndResetGoalProgress` tự động đối chiếu các bản ghi log trong cơ sở dữ liệu đối với chu kỳ hiện tại (hàng ngày, hàng tuần, hàng tháng) dựa trên múi giờ của người dùng.
  - Nếu phát hiện đã chuyển sang chu kỳ mới, tiến độ hiện tại (`current_count`) của thói quen sẽ được tự động reset về `0` (hoặc số check-in thực tế trong chu kỳ mới) và cập nhật trạng thái mục tiêu (`status`) thành `"active"` trong cơ sở dữ liệu.
  - Đồng bộ gọi hàm reset này trong tất cả các API trả về mục tiêu hoặc thao tác dữ liệu thói quen (`getGoals`, `getGoalById`, `completeGoal`, `updateGoal`, `deleteLog`) cũng như API lấy chỉ số thống kê (`getDashboardStats`), đảm bảo số đếm hiển thị trên UI luôn chính xác và không bị tích lũy cộng dồn vô hạn qua các ngày.

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

