# Sổ Xe Tổ Chức 4.8.3

- Đồng bộ phiên bản Web, Android native, Windows Portable và iOS Web App.
- Admin kết nối Google lưu dữ liệu Admin mới, rồi Google lưu dữ liệu NSD mới.
- Thêm “Phục hồi từ hai Google cũ” trong **Tổ chức → Sao lưu & Phục hồi** trên Web và Android. Chọn bản sao lưu đầy đủ ZIP/JSON đã tạo bằng Admin trên hai Google cũ, kiểm tra thông tin và xác nhận hai Google đích.
- Chuyển dữ liệu, phân công/bàn giao, lịch sử, tài khoản và tệp đính kèm; giữ tên đăng nhập và mật khẩu tại thời điểm sao lưu. Không thay đổi dữ liệu trên hai Google cũ.
- Android đọc được cả bản sao lưu JSON và ZIP từ Web.
- Khi chọn “Phục hồi từ hai Google cũ”, Web và Android bắt buộc chọn lại lần lượt Google Admin mới và Google NSD mới trước khi đọc bản sao lưu; không tự dùng hai phiên Google đã nhớ.
- Android: làm mờ xe đã bàn giao; in đậm toàn dòng thời gian đang quản lý; hiển thị tiến trình đăng nhập. Khi chọn Google Admin mới, yêu cầu chọn lại Google NSD.
- Kiểm tra NSD thấy xe được phân công dù chưa có giao dịch, giữ thông tin xe và lịch bàn giao sau khi chuyển người quản lý.
- APK 4.8.3 mới được build unsigned trong GitHub Actions, cần ký bằng đúng khóa đã ký APK 4.7 trước khi cung cấp bản cài đặt. SHA-1 chứng thư 4.7 là `23:5B:9D:D6:4A:92:6C:F7:FC:F7:8F:79:1D:33:C7:38:E9:F7:CC:E7`. Không dùng khóa mới vì sẽ đổi chữ ký cập nhật và cấu hình OAuth. Windows/Web/iOS được phát hành riêng trong lúc chờ ký APK.

Windows và iOS sử dụng bản Web được công bố. Bản iOS là hồ sơ Web App, không phải IPA native.
