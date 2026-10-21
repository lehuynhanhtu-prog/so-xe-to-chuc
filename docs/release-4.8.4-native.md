# Sổ Xe Tổ Chức 4.8.4 Native

- Android 7+; giao diện nghiệp vụ chạy bằng Android Views, không mở trình duyệt khi sử dụng.
- Đăng nhập bằng tên đăng nhập và mật khẩu do Admin cấp; NSD không cần tài khoản Google.
- Dữ liệu đi qua API HTTPS của Apps Script và được thực thi dưới tài khoản Google chủ dữ liệu.
- Giữ nguyên package `vn.soxe.organization` và khóa ký từ 4.7/4.8.3 để cài cập nhật đè.
- Phiên đăng nhập chỉ giữ trong bộ nhớ ứng dụng; thông tin đăng nhập sinh trắc học được bảo vệ bằng Android Keystore.
- Có xe, chi phí, bàn giao, phân công, cảnh báo, báo cáo, tệp đính kèm, sao lưu/phục hồi và quản lý NSD theo phân quyền phía máy chủ.

## Phương án quay lui

Bản `platform-v4.8.3` được giữ nguyên trên GitHub Releases. Nếu cần quay lại, sao lưu dữ liệu trước; Android có thể yêu cầu gỡ 4.8.4 trước khi cài APK có `versionCode` thấp hơn.
