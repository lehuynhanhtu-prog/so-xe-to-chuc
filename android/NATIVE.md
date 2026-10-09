# Sổ Xe Tổ Chức — Android native 4.8.0

Giao diện dùng Android Views: đăng nhập, hiện mật khẩu, Tổng quan, Xe, chi phí, phân công, NSD, bàn giao, báo cáo, tệp đính kèm, sao lưu và phục hồi. Không mở trang Web hoặc trình duyệt để sử dụng ứng dụng.

Bộ xử lý nghiệp vụ dùng chung với Web được đóng gói trong APK và chạy trong một WebView không gắn vào giao diện. Đây là bộ xử lý JavaScript cục bộ, không phải màn hình Web. OAuth dùng Google Play services; lịch, chọn tệp và xác thực sinh trắc học dùng Android. Cần kết nối Internet để đọc/lưu Drive. Cần Android 7 trở lên, Google Play services và Android System WebView được cập nhật (Chromium 74 trở lên).

## Cấu hình Google một lần

1. Mở Google Cloud Console, chọn dự án số **862228353042** đang dùng với Sổ Xe cá nhân và Sổ Xe tổ chức.
2. Mở **Google Auth Platform → Clients** (hoặc **APIs & Services → Credentials**).
3. Chọn **Create client / Create credentials → OAuth client ID**, loại **Android**.
4. Tên: **Sổ Xe Tổ Chức Android**.
5. Package name: **vn.soxe.organization**.
6. SHA-1 của APK được ký để phát hành:

   **23:5B:9D:D6:4A:92:6C:F7:FC:F7:8F:79:1D:33:C7:38:E9:F7:CC:E7**

7. Bấm **Create**. Không cần dán Client ID/Client Secret vào app. Giữ nguyên Web Client đang dùng.
8. Kiểm tra **Google Drive API** đã bật. Nếu dự án ở Testing, thêm cả hai tài khoản lưu dữ liệu vào **Audience → Test users**.
9. Cài APK, chọn ADMIN hoặc NSD. ADMIN kết nối Google lưu dữ liệu Admin và TK Google lưu dữ liệu NSD; NSD/Admin chỉ xem chỉ kết nối TK Google lưu dữ liệu NSD. Dùng tên đăng nhập/mật khẩu hiện có. Kết nối đã cấp quyền được tái sử dụng; chỉ hỏi lại khi quyền hết hiệu lực hoặc Google yêu cầu.
10. Sau khi đăng nhập bằng mật khẩu, mở **Tài khoản → Bật đăng nhập bằng vân tay**. Vân tay mở thông tin đăng nhập được mã hóa bằng khóa Android Keystore yêu cầu xác thực từng lần; app vẫn kiểm tra mật khẩu và quyền trên Drive. Nếu Admin đặt lại mật khẩu hoặc đổi vân tay, đăng nhập bằng mật khẩu và bật lại.

Nếu chưa thấy dữ liệu tạo từ Web, kiểm tra app đang dùng đúng dự án Cloud, đúng hai tài khoản và mô hình dữ liệu hai Google hiện tại. Không tạo tổ chức mới để thay cho việc kết nối dữ liệu cũ.

## Tính tương thích và giới hạn

- Cùng file JSON mã hóa, cách đặt tên tệp, ETag chống ghi đè và phân quyền với Web.
- Admin toàn quyền; viewer chỉ xem; NSD sửa/xóa bản ghi do mình nhập. Báo cáo thời gian NSD chỉ chứa kỳ quản lý của chính mình.
- Đồng bộ tự động mỗi phút khi ứng dụng ở foreground; không xóa nội dung form đang nhập.
- Sao lưu đầy đủ dữ liệu và tệp; phục hồi yêu cầu xem trước, tên tổ chức và mật khẩu Admin.
- Bản native xuất giao dịch CSV; các mẫu Excel chi tiết hiện vẫn ở bản Web.
- Mật khẩu thường không lưu trên thiết bị. Chỉ khi bật vân tay, thông tin đăng nhập được mã hóa với khóa thiết bị. Access token Google chỉ ở bộ nhớ.
- Bộ xử lý được bundle và chuyển đổi cú pháp cho Chromium 74, kèm tương thích structuredClone/UUID. Mã hóa vẫn dùng Web Crypto AES-GCM/PBKDF2.
- Chưa có xác minh đăng nhập Google và vân tay trên thiết bị thật của chủ dự án; cần cấu hình OAuth Android ở trên và kiểm tra với tài khoản của bạn.

## Kiểm tra và build

GitHub Actions chạy Gradle assembleRelease, lintRelease và kiểm thử Android emulator API 29 cho giao diện native, khởi động bộ xử lý cục bộ và phân quyền giao diện. Các kiểm thử nghiệp vụ Drive dùng chung nằm ở tests/dual-drive.test.mjs, tests/handovers.test.mjs và tests/backup-web-ui.test.mjs.

APK phát hành được ký bằng khóa hiện có, cùng package để cập nhật từ bản Android launcher 4.7.0 mà không phải gỡ app. Khóa ký không nằm trong repository.
