# Sổ Xe Tổ Chức — Android 4.8.3

APK dùng lại ranh giới đăng nhập ổn định của bản 4.7: launcher mở toàn bộ Sổ Xe Tổ Chức trong Chrome/trình duyệt hệ thống. Giao diện, Google OAuth và dữ liệu giống trực tiếp bản Web đã phát hành.

Cần kết nối Internet và trình duyệt hiện đại để đăng nhập, đọc/lưu Drive. APK không nhúng OAuth vào WebView và không gọi Google Play Services Auth.

## Cấu hình Google một lần

APK 4.8.3 phải được ký bằng đúng keystore đã ký bản 4.7 để cài cập nhật đè. Luồng Google dùng Web OAuth Client đang hoạt động của bản Web và không phụ thuộc Android OAuth Client/package SHA-1.

1. Mở Google Cloud Console, chọn dự án số **862228353042** đang dùng với Sổ Xe cá nhân và Sổ Xe tổ chức.
2. Kiểm tra **Google Drive API** đã bật. Nếu ứng dụng đang ở trạng thái Testing, thêm cả hai tài khoản Google lưu dữ liệu vào **Audience → Test users**.
3. Trên thiết bị, chọn **ADMIN** và kết nối hai tài khoản lưu dữ liệu khác nhau: Google lưu dữ liệu Admin và Google lưu dữ liệu NSD. Khi đăng nhập vai trò **NSD** hoặc **Admin chỉ xem**, chỉ kết nối tài khoản Google lưu dữ liệu NSD. Sau khi cấp quyền thành công, dùng tên đăng nhập/mật khẩu ứng dụng hiện có. Không tạo tổ chức mới để thay cho việc kết nối dữ liệu cũ.

Phiên Web giữ riêng hai access token Google ngắn hạn trong session của trình duyệt; token không được ghi vào dữ liệu Drive hay localStorage. Gợi ý email được giữ để chọn lại đúng Google khi token hết hạn.

Nếu Android báo không kết nối được Google, kiểm tra trình duyệt, mạng và Test users. Nếu hiện thông báo liên quan tới tài khoản, gửi nguyên văn lỗi (che địa chỉ email) để khoanh vùng tiếp.

Sau khi đăng nhập bằng mật khẩu, mở **Cài đặt → Bật đăng nhập bằng vân tay**. Vân tay mở thông tin đăng nhập được mã hóa bằng khóa Android Keystore yêu cầu xác thực từng lần; app vẫn kiểm tra mật khẩu và quyền trên Drive. Nếu Admin đặt lại mật khẩu hoặc đổi vân tay, đăng nhập bằng mật khẩu và bật lại.

## Tính tương thích và giới hạn

- Cùng định dạng dữ liệu JSON trực tiếp, cách đặt tên tệp, ETag chống ghi đè và phân quyền với Web. Hồ sơ tài khoản/mật khẩu vẫn được mã hóa cơ bản.
- Admin toàn quyền; viewer chỉ xem; NSD sửa/xóa bản ghi do mình nhập. Báo cáo thời gian NSD chỉ chứa kỳ quản lý của chính mình.
- Đồng bộ và giao diện dùng trực tiếp bản Web hiện hành.
- Sao lưu đầy đủ dữ liệu và tệp; phục hồi yêu cầu xem trước, tên tổ chức và mật khẩu Admin.
- Xuất CSV/Excel, vân tay/passkey và chọn tệp dùng khả năng của trình duyệt hệ thống.
- APK mở toàn bộ app Web như bản 4.7, không phụ thuộc Google Play Services nên loại bỏ nhánh lỗi `INTERNAL_ERROR (8)`, `Account reauth failed` và `No credentials available`.
- APK cho phép chụp và quay màn hình để người dùng lưu báo cáo hoặc gửi thông tin hỗ trợ.
- Chỉ hồ sơ tài khoản dùng AES-GCM/PBKDF2 nhẹ 10.000 vòng; dữ liệu tổ chức, xe, giao dịch, nhật ký và dữ liệu được xem là JSON không mã hóa để giảm thời gian mở và đồng bộ. Dữ liệu cũ vẫn đọc được và tự chuyển đổi.
- Đăng nhập OAuth trình duyệt và vân tay/passkey cần kiểm tra trên thiết bị thật.

## Kiểm tra và build

GitHub Actions chạy Gradle assembleRelease, lintRelease và kiểm thử Android emulator API 29 cho giao diện native, khởi động bộ xử lý cục bộ và phân quyền giao diện. Các kiểm thử nghiệp vụ Drive dùng chung nằm ở tests/dual-drive.test.mjs, tests/handovers.test.mjs và tests/backup-web-ui.test.mjs.

APK 4.8.3 dùng khóa phát hành hiện dùng, nên có thể cập nhật đè các APK trước đó được ký bằng cùng khóa. Nếu bản đang cài dùng khóa khác hoặc không rõ nguồn, hãy sao lưu dữ liệu rồi gỡ bản đó trước khi cài. Giữ keystore phát hành an toàn để dùng cho các bản Android sau. Khóa riêng và mật khẩu ký không được đưa vào repository.
