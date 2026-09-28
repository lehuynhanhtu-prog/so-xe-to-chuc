# Sổ Xe Tổ Chức

Phiên bản độc lập dành cho tổ chức quản lý nhiều xe, nhiều người quản lý/lái xe và lịch sử chi phí minh bạch.

## Chức năng tổ chức

- Thiết bị đầu tiên đăng ký Admin, tên tổ chức và mật khẩu ứng dụng.
- Admin tạo file mời theo email Google; ứng dụng tự chia sẻ thư mục Drive của tổ chức cho email đó.
- Người quản lý/lái xe nhập file mời, đăng ký tên và mật khẩu rồi chờ Admin duyệt.
- Thiết bị đã đăng nhập được ghi nhớ tên người dùng và có thể tiếp tục nhanh ở lần sau.
- Admin phân công xe, lập biên bản bàn giao theo ngày và ODO.
- Mọi người dùng được nhập chi phí cho mọi xe; giao dịch lưu người quản lý/lái xe, người nhập và trạng thái `Nhập hộ`.
- Báo cáo Excel chứa ODO và thông tin người quản lý/người nhập.

## Bảo mật

File mời không chứa mật khẩu Google, access token hay refresh token. Mỗi thành viên đăng nhập tài khoản Google riêng. Dữ liệu nằm trong thư mục Drive dùng chung do Admin tạo và cấp quyền.

Mật khẩu ứng dụng chỉ lưu dưới dạng SHA-256 trong dữ liệu tổ chức. Đây là lớp nhận diện nội bộ, không thay thế xác thực Google và quyền truy cập Drive.

## Nền tảng

- Web/PWA: `docs/`
- Windows portable: đóng gói từ bản Web
- Android: mã nguồn trong `app/`; cần cấu hình khóa ký cố định trước khi phát hành chính thức.

Ứng dụng Sổ Xe cá nhân tại repository `so-xe-android` không bị thay đổi và không dùng chung dữ liệu cục bộ với phiên bản này.
