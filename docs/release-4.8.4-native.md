# Sổ Xe Tổ Chức 4.8.4 Native

- Cần cài bản nâng cấp này một lần để nhận cơ chế cấu hình động (`versionCode 486`). Từ các lần đổi Google chủ sau, không cần cài lại APK.
- Android 7+; giao diện nghiệp vụ chạy bằng Android Views, không mở trình duyệt khi sử dụng.
- Đăng nhập bằng tên đăng nhập và mật khẩu do Admin cấp; NSD không cần tài khoản Google.
- Dữ liệu đi qua API HTTPS của Apps Script và được thực thi dưới tài khoản Google chủ dữ liệu.
- Cho phép xóa NSD sau khi Admin đã xóa toàn bộ xe và dữ liệu nghiệp vụ liên quan; nhật ký kiểm toán vẫn được giữ để truy vết nhưng không còn chặn thu hồi tài khoản.
- Thêm công cụ chuyển Google chủ theo từng phần, không phụ thuộc giới hạn gói sao lưu 64 MB; dữ liệu mới chỉ được kích hoạt sau khi tất cả tệp đã xác nhận đủ.
- APK đọc URL Apps Script từ cấu hình ổn định trên GitHub Pages, xác minh chữ ký RSA bằng khóa công khai nhúng trong ứng dụng và chỉ chấp nhận URL chính thức thuộc `script.google.com`.
- Khi đổi Google chủ, workflow **Update Android service endpoint** ký và phát hành URL mới; NSD mở lại ứng dụng, không cần tải hoặc cài lại APK.
- Cấu hình sai chữ ký, revision cũ hoặc dịch vụ mới không vượt qua kiểm tra health sẽ bị bỏ qua; APK dùng lại địa chỉ hợp lệ gần nhất.
- Giữ nguyên package `vn.soxe.organization` và khóa ký từ 4.7/4.8.3 để cài cập nhật đè.
- Phiên đăng nhập chỉ giữ trong bộ nhớ ứng dụng; thông tin đăng nhập sinh trắc học được bảo vệ bằng Android Keystore.
- Có xe, chi phí, bàn giao, phân công, cảnh báo, báo cáo, tệp đính kèm, sao lưu/phục hồi và quản lý NSD theo phân quyền phía máy chủ.

## Phương án quay lui

Bản `platform-v4.8.3` được giữ nguyên trên GitHub Releases. Nếu cần quay lại, sao lưu dữ liệu trước; Android có thể yêu cầu gỡ 4.8.4 trước khi cài APK có `versionCode` thấp hơn.
