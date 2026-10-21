# Sổ Xe Tổ Chức — Android 4.8.4 Native

APK 4.8.4 dùng Android Views cho toàn bộ màn hình nghiệp vụ. WebView ẩn chỉ chạy mô-đun JavaScript đóng gói trong APK để dùng chung phép tính nhắc hạn và báo cáo; ứng dụng không nhúng hoặc mở giao diện Web.

## Kết nối dữ liệu

- Android gửi JSON qua HTTPS tới đúng deployment Apps Script một Google đã cấu hình trong `LedgerEngine.java`.
- NSD đăng nhập bằng tên đăng nhập/mật khẩu ứng dụng và không cấp quyền Google.
- Apps Script kiểm tra phiên, vai trò và quyền trên từng thao tác trước khi đọc/ghi Drive của chủ dữ liệu.
- Token phiên chỉ nằm trong bộ nhớ tiến trình. Nếu bật sinh trắc học, tên đăng nhập và mật khẩu được mã hóa bằng Android Keystore qua `BiometricVault`.
- Chỉ cho phép HTTPS tới `script.google.com` và `script.googleusercontent.com`; WebView cục bộ chặn mọi yêu cầu mạng.

## Phiên bản và ký APK

- package: `vn.soxe.organization`
- `versionCode`: 485
- `versionName`: 4.8.4
- Android tối thiểu: 7.0 (API 24)
- Chứng thư phát hành SHA-1: `23:5B:9D:D6:4A:92:6C:F7:FC:F7:8F:79:1D:33:C7:38:E9:F7:CC:E7`

Workflow `.github/workflows/build-android.yml` build, lint, chạy kiểm thử thiết bị ảo, ký và phát hành `So-Xe-To-Chuc-Android-4.8.4-Native.apk` ở tag `android-v4.8.4`.

## Quay lui

Release `platform-v4.8.3` và các tệp của nó không bị sửa. Do Android không cho cài đè ứng dụng có `versionCode` thấp hơn, hãy sao lưu dữ liệu, gỡ 4.8.4 rồi cài lại 4.8.3 nếu thật sự cần quay lui.
