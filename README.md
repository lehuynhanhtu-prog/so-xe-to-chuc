# Sổ Xe Tổ Chức

Bản web/PWA nằm trong `docs/`. Tổ chức lưu `so-xe-organization-data.json` và tệp đính kèm trong một thư mục Google Drive được cấu hình bằng đường dẫn thư mục. Mặc định màn hình khởi tạo gợi ý thư mục do chủ dự án cung cấp; Admin có thể đổi trong mục Tổ chức. Trước khi đổi, cần tự chuyển tệp và thư mục đính kèm từ thư mục cũ.

## Tài khoản và vai trò

- Lần đầu, đăng nhập `admin` với mật khẩu tạm `123456`, bắt buộc đổi mật khẩu (tối thiểu 8 ký tự) trước khi nhập tên tổ chức và cấu hình mã hóa/Drive. Mật khẩu tạm không được lưu vào dữ liệu tổ chức.
- Admin tạo tên đăng nhập và chọn vai trò `Admin`, `Admin · chỉ xem`, hoặc `Người quản lý/lái xe`. Người dùng đặt mật khẩu ở lần đăng nhập đầu tiên. Không dùng file mời hay email riêng cho từng tài khoản ứng dụng. Admin có thể xóa tài khoản chưa từng được phân công xe và không liên quan đến giao dịch hoặc biên bản bàn giao; xóa được lưu bằng dấu xóa để đồng bộ giữa thiết bị mà không tạo lại tài khoản.
- Admin tạo xe trước, sau đó phân công lái xe. Admin thấy toàn bộ giao dịch và được sửa dữ liệu. Admin chỉ xem thấy toàn bộ nhưng không có quyền sửa/xóa qua giao diện. Lái xe thấy giao dịch do mình nhập và toàn bộ giao dịch của xe hiện được phân công, kể cả giao dịch người khác nhập hộ; chỉ sửa/xóa giao dịch do mình nhập.
- Trên thiết bị mới, chọn **Đăng nhập tổ chức đã có**, nhập tên đăng nhập và mật khẩu ứng dụng trước; sau đó cung cấp URL thư mục và mật khẩu mã hóa để đồng bộ và xác minh tài khoản. Nếu chưa có tổ chức, chọn **Tạo tổ chức mới** để dùng tài khoản Admin tạm. Tên đăng nhập không được ghi nhớ trên thiết bị; cần nhập lại mỗi phiên.

- Admin được sửa tên tổ chức. Khi xóa tổ chức, cần nhập đúng tên và xác nhận; ứng dụng xóa tệp đính kèm trong thư mục của ứng dụng, thay file dữ liệu bằng dấu xóa không chứa nội dung tổ chức để ngăn thiết bị khác đồng bộ ngược dữ liệu cũ. Nếu thiếu kết nối Drive hoặc xóa tệp lỗi, ứng dụng giữ dữ liệu cục bộ để Admin thử lại.

## Giới hạn cần biết

GitHub Pages là trang tĩnh. URL thư mục chia sẻ không cấp quyền ghi Drive. Mỗi trình duyệt vẫn phải kết nối một phiên Google có quyền ghi thư mục. Bản web chỉ xin quyền `drive.file` với các tệp do ứng dụng tạo hoặc được chọn qua Google Picker. Link thư mục có sẵn tự nó không cấp quyền truy cập tệp cho ứng dụng; để dùng thư mục có sẵn cần tích hợp Google Picker với API key dự án Google Cloud hoặc triển khai máy chủ đồng bộ, dù tài khoản **trong ứng dụng** không cần email Google riêng. Ứng dụng không lưu mật khẩu Google. Không nhập mật khẩu Google vào ô mật khẩu ứng dụng.

Dữ liệu dùng chung là một file JSON, bao gồm mã băm SHA-256 của mật khẩu ứng dụng. Phân quyền ở phía trình duyệt, chưa có máy chủ xác thực và thực thi quyền truy cập. Người có quyền truy cập trực tiếp vào thư mục Drive có thể đọc/sửa toàn bộ file bất kể vai trò trong giao diện. Không dùng cho dữ liệu nhạy cảm hoặc xem đây là cơ chế bảo mật thực sự. Để bỏ hoàn toàn phiên Google trên thiết bị lái xe và cưỡng chế phân quyền, cần triển khai máy chủ có xác thực, lưu bí mật Drive ở máy chủ và API lọc dữ liệu theo quyền.

## Nền tảng

- Web/PWA: `docs/`
- Windows portable: đóng gói từ bản Web
- Android: cần cấu hình khóa ký cố định trước khi phát hành chính thức.

Bản Sổ Xe cá nhân ở repository `so-xe-android` không bị thay đổi.

## Mã hóa dữ liệu

File JSON và tệp đính kèm mới trên Drive được mã hóa AES-256-GCM. Khóa sinh từ mật khẩu mã hóa chung của tổ chức bằng PBKDF2-SHA256; mật khẩu chỉ giữ trong bộ nhớ phiên, không ghi vào Drive hoặc localStorage. Admin phải cung cấp mật khẩu này riêng cho các thành viên. Mất mật khẩu thì không khôi phục được dữ liệu. Dữ liệu ngoại tuyến trong localStorage và bản ZIP/JSON tải về hiện vẫn ở dạng rõ; hãy bảo vệ thiết bị và bản sao lưu.

File JSON/tệp đính kèm tạo trước bản mã hóa vẫn ở dạng rõ. Ứng dụng từ chối đồng bộ file JSON cũ. Admin cần tải thủ công bản sao file JSON và thư mục tệp đính kèm từ Drive trước, rồi dùng nút **Mã hóa dữ liệu Drive cũ** trong mục Tổ chức. Công cụ tạo bản mã hóa mới và kiểm tra giải mã được trước khi xóa file JSON cũ và các tệp cũ được tham chiếu. Nếu chuyển đổi lỗi, kiểm tra thư mục Drive trước khi thử lại; các tệp không được tham chiếu cần kiểm tra và xóa thủ công.
