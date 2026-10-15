# Sổ Xe Tổ Chức — Android native 4.8.3

Giao diện dùng Android Views: đăng nhập, hiện mật khẩu, Tổng quan, Xe, chi phí, phân công, NSD, bàn giao, báo cáo, tệp đính kèm, sao lưu và phục hồi. Không mở trang Web hoặc trình duyệt để sử dụng ứng dụng.

Bộ xử lý nghiệp vụ dùng chung với Web được đóng gói trong APK và chạy trong một WebView không gắn vào giao diện. Đây là bộ xử lý JavaScript cục bộ, không phải màn hình Web. OAuth dùng Google Play services; lịch, chọn tệp và xác thực sinh trắc học dùng Android. Cần kết nối Internet để đọc/lưu Drive. Cần Android 7 trở lên, Google Play services và Android System WebView được cập nhật (Chromium 74 trở lên).

## Cấu hình Google một lần

APK 4.8.3 phải được ký bằng đúng keystore đã ký bản 4.7. Android OAuth Client phải có đúng SHA-1 của khóa này; nếu không khớp, việc cấp quyền Google Drive sẽ thất bại với cả hai tài khoản.

1. Mở Google Cloud Console, chọn dự án số **862228353042** đang dùng với Sổ Xe cá nhân và Sổ Xe tổ chức.
2. Mở **Google Auth Platform → Clients** (hoặc **APIs & Services → Credentials**).
3. Chọn **Create client / Create credentials → OAuth client ID**, loại **Android**.
4. Tên: **Sổ Xe Tổ Chức Android 4.8.3**.
5. Package name: **vn.soxe.organization**.
6. SHA-1 chính xác của chứng thư ký APK 4.8.3:

   **23:5B:9D:D6:4A:92:6C:F7:FC:F7:8F:79:1D:33:C7:38:E9:F7:CC:E7**

7. Bấm **Create**. Không cần dán Client ID/Client Secret vào app; giữ nguyên Web Client đang dùng. Chờ vài phút để cấu hình OAuth được áp dụng.
8. Kiểm tra **Google Drive API** đã bật. Nếu ứng dụng đang ở trạng thái Testing, thêm cả hai tài khoản Google lưu dữ liệu vào **Audience → Test users**.
9. Trên thiết bị, chọn **ADMIN** và kết nối hai tài khoản lưu dữ liệu khác nhau: Google lưu dữ liệu Admin và Google lưu dữ liệu NSD. Khi đăng nhập vai trò **NSD** hoặc **Admin chỉ xem**, chỉ kết nối tài khoản Google lưu dữ liệu NSD. Sau khi cấp quyền thành công, dùng tên đăng nhập/mật khẩu ứng dụng hiện có. Không tạo tổ chức mới để thay cho việc kết nối dữ liệu cũ.

Nếu Android báo không kết nối được Google, kiểm tra lại package name/SHA-1 trong OAuth Android Client và Test users. Nếu hiện thông báo liên quan tới tài khoản, gửi nguyên văn lỗi (che địa chỉ email) để khoanh vùng tiếp.

Sau khi đăng nhập bằng mật khẩu, mở **Cài đặt → Bật đăng nhập bằng vân tay**. Vân tay mở thông tin đăng nhập được mã hóa bằng khóa Android Keystore yêu cầu xác thực từng lần; app vẫn kiểm tra mật khẩu và quyền trên Drive. Nếu Admin đặt lại mật khẩu hoặc đổi vân tay, đăng nhập bằng mật khẩu và bật lại.

## Tính tương thích và giới hạn

- Cùng file JSON mã hóa, cách đặt tên tệp, ETag chống ghi đè và phân quyền với Web.
- Admin toàn quyền; viewer chỉ xem; NSD sửa/xóa bản ghi do mình nhập. Báo cáo thời gian NSD chỉ chứa kỳ quản lý của chính mình.
- Đồng bộ tự động mỗi phút khi ứng dụng ở foreground; không xóa nội dung form đang nhập.
- Sao lưu đầy đủ dữ liệu và tệp; phục hồi yêu cầu xem trước, tên tổ chức và mật khẩu Admin.
- Bản native xuất CSV và Excel giao dịch chi tiết, chi phí theo tháng, thời gian quản lý; có lọc xe, loại chi phí và ngày.
- Mật khẩu thường không lưu trên thiết bị. Chỉ khi bật vân tay, thông tin đăng nhập được mã hóa với khóa thiết bị. Access token Google chỉ ở bộ nhớ.
- Bộ xử lý được bundle và chuyển đổi cú pháp cho Chromium 74, kèm tương thích structuredClone/UUID. Mã hóa vẫn dùng Web Crypto AES-GCM/PBKDF2.
- Đăng nhập OAuth Android và vân tay cần cấu hình/kiểm tra trên thiết bị thật.

## Kiểm tra và build

GitHub Actions chạy Gradle assembleRelease, lintRelease và kiểm thử Android emulator API 29 cho giao diện native, khởi động bộ xử lý cục bộ và phân quyền giao diện. Các kiểm thử nghiệp vụ Drive dùng chung nằm ở tests/dual-drive.test.mjs, tests/handovers.test.mjs và tests/backup-web-ui.test.mjs.

APK 4.8.3 dùng khóa phát hành hiện dùng, nên có thể cập nhật đè các APK trước đó được ký bằng cùng khóa. Nếu bản đang cài dùng khóa khác hoặc không rõ nguồn, hãy sao lưu dữ liệu rồi gỡ bản đó trước khi cài. Giữ keystore phát hành an toàn để dùng cho các bản Android sau. Khóa riêng và mật khẩu ký không được đưa vào repository.
