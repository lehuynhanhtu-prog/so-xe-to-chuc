# Sổ Xe Tổ Chức

Bản web/PWA nằm trong `docs/`. Tổ chức lưu `so-xe-organization-data.json` và tệp đính kèm trong một thư mục Google Drive được cấu hình bằng đường dẫn thư mục. Mặc định màn hình khởi tạo gợi ý thư mục do chủ dự án cung cấp; Admin có thể đổi trong mục Tổ chức. Trước khi đổi, cần tự chuyển tệp và thư mục đính kèm từ thư mục cũ.

## Tài khoản và vai trò

- Admin đầu tiên tạo tổ chức, tên đăng nhập và mật khẩu ứng dụng.
- Admin tạo tên đăng nhập và chọn vai trò `Admin`, `Admin · chỉ xem`, hoặc `Người quản lý/lái xe`. Người dùng đặt mật khẩu ở lần đăng nhập đầu tiên. Không dùng file mời hay email riêng cho từng tài khoản ứng dụng.
- Admin tạo xe trước, sau đó phân công lái xe. Admin thấy toàn bộ giao dịch và được sửa dữ liệu. Admin chỉ xem thấy toàn bộ nhưng không có quyền sửa/xóa qua giao diện. Lái xe thấy giao dịch do mình nhập và toàn bộ giao dịch của xe hiện được phân công, kể cả giao dịch người khác nhập hộ; chỉ sửa/xóa giao dịch do mình nhập.
- Trên thiết bị mới, nhập URL thư mục tổ chức và kết nối Drive để tải danh sách tài khoản trước khi đăng nhập.

## Giới hạn cần biết

GitHub Pages là trang tĩnh. URL thư mục chia sẻ không cấp quyền ghi Drive. Mỗi trình duyệt vẫn phải kết nối một phiên Google có quyền ghi thư mục. OAuth của bản web cần quyền Google Drive đầy đủ để chọn một thư mục tồn tại trước và đồng bộ file trong thư mục đó; cấu hình OAuth consent và xác minh ứng dụng của Google có thể cần được cập nhật trước khi tài khoản ngoài danh sách thử nghiệm sử dụng, dù tài khoản **trong ứng dụng** không cần email Google riêng. Ứng dụng không lưu mật khẩu Google. Không nhập mật khẩu Google vào ô mật khẩu ứng dụng.

Dữ liệu dùng chung là một file JSON, bao gồm mã băm SHA-256 của mật khẩu ứng dụng. Phân quyền ở phía trình duyệt, chưa có máy chủ xác thực và thực thi quyền truy cập. Người có quyền truy cập trực tiếp vào thư mục Drive có thể đọc/sửa toàn bộ file bất kể vai trò trong giao diện. Không dùng cho dữ liệu nhạy cảm hoặc xem đây là cơ chế bảo mật thực sự. Để bỏ hoàn toàn phiên Google trên thiết bị lái xe và cưỡng chế phân quyền, cần triển khai máy chủ có xác thực, lưu bí mật Drive ở máy chủ và API lọc dữ liệu theo quyền.

## Nền tảng

- Web/PWA: `docs/`
- Windows portable: đóng gói từ bản Web
- Android: cần cấu hình khóa ký cố định trước khi phát hành chính thức.

Bản Sổ Xe cá nhân ở repository `so-xe-android` không bị thay đổi.
