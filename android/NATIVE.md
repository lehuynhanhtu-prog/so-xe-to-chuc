# Sổ Xe Tổ Chức — Android 4.8.4 Native

APK 4.8.4 dùng Android Views cho toàn bộ màn hình nghiệp vụ. WebView ẩn chỉ chạy mô-đun JavaScript đóng gói trong APK để dùng chung phép tính nhắc hạn và báo cáo; ứng dụng không nhúng hoặc mở giao diện Web.

## Kết nối dữ liệu

- Android lấy URL deployment từ tệp cấu hình ổn định trên GitHub Pages, kiểm tra chữ ký trước khi sử dụng rồi gửi JSON qua HTTPS.
- NSD đăng nhập bằng tên đăng nhập/mật khẩu ứng dụng và không cấp quyền Google.
- Apps Script kiểm tra phiên, vai trò và quyền trên từng thao tác trước khi đọc/ghi Drive của chủ dữ liệu.
- Token phiên chỉ nằm trong bộ nhớ tiến trình. Nếu bật sinh trắc học, tên đăng nhập và mật khẩu được mã hóa bằng Android Keystore qua `BiometricVault`.
- Chỉ cho phép HTTPS tới `script.google.com` và `script.googleusercontent.com`; WebView cục bộ chặn mọi yêu cầu mạng.

### Đổi Google chủ mà không build lại APK

APK nhúng URL hiện tại chỉ làm địa chỉ khởi tạo cho lần cài đầu. Địa chỉ vận hành nằm trong `docs/android-service-config.json`, được ký bằng khóa phát hành Android. Sau khi công cụ **Chuyển Google chủ** hoàn tất:

Người đang dùng APK `versionCode 485` cần cài bản `versionCode 486` này một lần. Cơ chế không build/cài lại áp dụng cho mọi lần đổi Google chủ sau đó.

1. Vào Actions của repo, chạy workflow **Update Android service endpoint**.
2. Nhập URL chính thức `https://script.google.com/macros/s/DEPLOYMENT_ID_MOI/exec`.
3. Workflow tự tăng revision, ký cấu hình và triển khai GitHub Pages.
4. NSD mở lại app. APK kiểm tra chữ ký, gọi health trên dịch vụ mới rồi mới chuyển và lưu URL.

APK chỉ chấp nhận đúng host `script.google.com`, HTTPS, đường dẫn `/macros/s/.../exec`, không chấp nhận query, fragment, user-info, cổng riêng hoặc tên miền gần giống. Cấu hình sai chữ ký, revision cũ hoặc dịch vụ mới lỗi không thay thế URL đã hoạt động. APK giữ cả địa chỉ hiện tại và địa chỉ hợp lệ trước đó để dự phòng. Không cần build/cài lại APK trong các lần đổi Google chủ sau.

## Phiên bản và ký APK

- package: `vn.soxe.organization`
- `versionCode`: 486
- `versionName`: 4.8.4
- Android tối thiểu: 7.0 (API 24)
- Cần Chrome/Android System WebView đã cập nhật để dùng cầu nối Apps Script trong frame ẩn; thiết bị cũ vẫn có đường dự phòng JSON khi deployment có `doPost`.
- Chứng thư phát hành SHA-1: `23:5B:9D:D6:4A:92:6C:F7:FC:F7:8F:79:1D:33:C7:38:E9:F7:CC:E7`

Workflow `.github/workflows/build-android.yml` build, lint, chạy kiểm thử thiết bị ảo, ký và phát hành `So-Xe-To-Chuc-Android-4.8.4-Native.apk` ở tag `android-v4.8.4`.

Workflow `.github/workflows/update-android-endpoint.yml` chỉ cập nhật cấu hình đã ký và GitHub Pages; không build APK. Khóa bí mật vẫn chỉ nằm trong GitHub Secrets, APK và repo chỉ chứa khóa công khai.

## Quay lui

Release `platform-v4.8.3` và các tệp của nó không bị sửa. Do Android không cho cài đè ứng dụng có `versionCode` thấp hơn, hãy sao lưu dữ liệu, gỡ 4.8.4 rồi cài lại 4.8.3 nếu thật sự cần quay lui.
