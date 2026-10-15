# Sổ Xe Tổ Chức 4.8.3

- Đồng bộ phiên bản Web, Android native, Windows Portable và iOS Web App.
- Admin kết nối Google lưu dữ liệu Admin mới, rồi Google lưu dữ liệu NSD mới.
- Thêm “Phục hồi từ hai Google cũ” trong **Tổ chức → Sao lưu & Phục hồi** trên Web và Android. Chọn bản sao lưu đầy đủ ZIP/JSON đã tạo bằng Admin trên hai Google cũ, kiểm tra thông tin và xác nhận hai Google đích.
- Chuyển dữ liệu, phân công/bàn giao, lịch sử, tài khoản và tệp đính kèm; giữ tên đăng nhập và mật khẩu tại thời điểm sao lưu. Không thay đổi dữ liệu trên hai Google cũ.
- Android đọc được cả bản sao lưu JSON và ZIP từ Web.
- Khi chọn “Phục hồi từ hai Google cũ”, Web và Android bắt buộc chọn lại lần lượt Google Admin mới và Google NSD mới trước khi đọc bản sao lưu; không tự dùng hai phiên Google đã nhớ.
- Android: làm mờ xe đã bàn giao; in đậm toàn dòng thời gian đang quản lý; hiển thị tiến trình đăng nhập. Khi chọn Google Admin mới, yêu cầu chọn lại Google NSD.
- Kiểm tra NSD thấy xe được phân công dù chưa có giao dịch, giữ thông tin xe và lịch bàn giao sau khi chuyển người quản lý.
- Phần **Xe** của NSD hiển thị đầy đủ cảnh báo bảo dưỡng, phụ tùng, bảo hiểm, đăng kiểm và phí đường bộ của xe đang quản lý giống Admin, kể cả cảnh báo được nhập bởi tài khoản khác. Dữ liệu cảnh báo được tách riêng nên NSD vẫn không xem/sửa/xóa giao dịch của người khác; cảnh báo tự mất khi bàn giao xe.
- Sửa đăng nhập Web cho Admin bổ sung (`admin2`): nếu metadata tên tài khoản trên Drive bị cũ, ứng dụng xác minh hồ sơ Admin bằng dữ liệu tổ chức và đăng nhập đúng tài khoản hiện hành.
- Sửa đăng nhập Admin/Admin bổ sung trên APK qua đúng hai Google; APK kiểm tra rõ vai trò Admin và hoàn tất mở nhật ký cùng dữ liệu tổ chức.
- Sửa kết nối Google trên APK: lưu ngay tài khoản vừa chọn trước khi xin quyền Drive, giữ đúng vị trí Google Admin/NSD khi màn hình cấp quyền làm Activity được tạo lại và bỏ lượt gọi Drive thừa khiến lựa chọn không được lưu.
- APK giữ yêu cầu đăng nhập đang chờ trong bộ nhớ vòng đời khi chuyển qua màn hình Google; sau khi cấp quyền sẽ tự tiếp tục đăng nhập thay vì dừng im lặng. Mật khẩu chờ không ghi vào tệp hoặc SharedPreferences.
- APK giữ đồng thời hai token Google ngắn hạn trong bộ nhớ vòng đời, tránh vòng lặp xin lại Google Admin sau khi vừa cấp quyền Google NSD.
- APK đọc dữ liệu đăng nhập Google Drive bằng kết nối HTTPS native có giới hạn thời gian, tránh WebView đứng mãi ở “Đang đăng nhập…” và trả thông báo rõ nếu mạng/Drive không phản hồi.
- APK lấy access token bằng Google Play Services native; màn hình cấp quyền chỉ mở khi cần, tránh đứng mãi ở “Đang xử lý, vui lòng chờ…” trước khi đọc Drive.
- Sửa lại kết nối Google APK bằng `AuthorizationClient` chính thức, giới hạn chờ 30 giây và hiển thị mã lỗi chính xác thay vì luôn quy lỗi cho OAuth Client.
- APK đọc kết quả form cấp quyền Google ngay cả khi một số thiết bị trả mã Activity không chuẩn; không còn chớp form rồi âm thầm quay về trang đăng nhập. Tên đăng nhập và mật khẩu đang chờ được giữ trong bộ nhớ để tự tiếp tục hoặc thử lại.
- Android dùng trực tiếp màn hình chọn tài khoản của `AuthorizationClient` để chọn Google và cấp quyền Drive trong một lượt; bỏ AccountPicker và Credential Manager từng gây `INTERNAL_ERROR (8)`, `Account reauth failed` hoặc `No credentials available`, đồng thời vẫn tách riêng Google Admin/NSD.
- Cho phép chụp và quay màn hình APK để lưu báo cáo và gửi ảnh hỗ trợ.
- Tối ưu đăng nhập Web/APK: hồ sơ tài khoản dùng PBKDF2 nhẹ hơn; dữ liệu nghiệp vụ lưu JSON trực tiếp. Dữ liệu mã hóa cũ vẫn đọc được và tự chuyển đổi sau lần đăng nhập thành công.
- APK 4.8.3 được GitHub Actions ký bằng đúng khóa đã ký APK 4.7 và chỉ phát hành khi SHA-1 chứng thư khớp `23:5B:9D:D6:4A:92:6C:F7:FC:F7:8F:79:1D:33:C7:38:E9:F7:CC:E7`. Không dùng khóa mới vì sẽ đổi chữ ký cập nhật và cấu hình OAuth.

Windows và iOS sử dụng bản Web được công bố. Bản iOS là hồ sơ Web App, không phải IPA native.
