### 3.2 Nội dung file `docs/CHANGELOG.md`
*File này theo dõi tiến độ phát triển, ghi nhận các tính năng đã/sẽ hoàn thiện theo từng Sprint.*

```markdown
# Changelog

Tất cả các thay đổi lớn của dự án sẽ được ghi nhận và cập nhật theo từng Sprint tại đây.

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

## [Kế hoạch] - Sprint 3: Tiến độ & Dashboard
### Sẽ bổ sung (To Be Added)
* **Ghi nhận tiến độ:**
  - API và Nút bấm UI để đánh dấu hoàn thành mục tiêu (`US-08`).
  - Logic tự động tính toán chuỗi ngày liên tục (`Streak Calculation Service`).
* **Giao diện Dashboard:**
  - API tổng hợp dữ liệu trong ngày (`US-09`).
  - Giao diện Dashboard tổng quan kèm Widget hiển thị Tỷ lệ hoàn thành và Widget hiển thị chuỗi ngày (Streak Widget).

## [Kế hoạch] - Sprint 2: Quản lý mục tiêu (Goal Management)
### Sẽ bổ sung (To Be Added)
* **Cơ sở dữ liệu:** Thêm Prisma Schema cho thực thể `Goal`.
* **Phía Backend:** Phát triển cụm API CRUD cho Goal (Create, Get List, Update, Delete).
* **Phía Frontend:** - Cài đặt React Router cho ứng dụng.
  - Thiết kế Form tạo mục tiêu (có Validate) và các Component hiển thị (`GoalCard`, `GoalList`, `GoalDetail`).
  - Xây dựng `Goal Zustand Store` quản lý State chung cho Module này.

## [Đang thực hiện] - Sprint 1: Khởi tạo dự án & Xác thực (Authentication)
### Đã thêm (Added)
* Khởi tạo cấu trúc thư mục chuẩn cho dự án (gồm `docs/`, `src/`, `tests/`).
* Thiết lập môi trường Cơ sở dữ liệu PostgreSQL kết hợp Prisma ORM (`T-01`).
* Định nghĩa cấu trúc bảng User ban đầu (`T-02`).
* Xây dựng bộ API lõi cho tính năng Xác thực: Register, Login, Logout bao gồm cơ chế mã hóa mật khẩu (`bcrypt`) và cấp phát cặp mã token (`JWT Access/Refresh Token`).
* Setup Frontend Client: Cấu hình `Zustand` quản lý trạng thái đăng nhập, viết `Axios Interceptor` để bắt và xử lý Token tự động.
* Xây dựng giao diện cơ bản (UI) cho màn hình Login và Register.
* Viết bổ sung Unit Test cho nhóm API Auth này để đảm bảo độ ổn định (`T-15`).