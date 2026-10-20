# Triển khai Sổ Xe Tổ Chức 4.8.3 — một Google

Đây là dịch vụ mới cho repo `so-xe-to-chuc`. Không ghi đè project của repo `so-xe-to-chuc-v2` và không triển khai thư mục `apps-script/` cũ.

## 1. Chuẩn bị và cấp quyền bằng Google chủ

1. Đăng nhập Google sẽ sở hữu dữ liệu, tạo **project Apps Script riêng** tại https://script.google.com/.
2. Sau `npm ci && npm run build`, đưa bốn tệp `Code.gs`, `Core.gs`, `Crypto.gs`, `Index.html` trong thư mục này vào project. Bật hiển thị manifest trong Project Settings, thay `appsscript.json` bằng tệp cùng tên của gói.
3. Trong editor, chọn **initializeDeployment_**, bấm Run và cấp quyền Drive ngay. Chỉ chủ Google thực hiện bước này; không chờ NSD đăng nhập để cấp quyền.
4. Giữ riêng **mã thiết lập một lần** trong Execution log. Không đưa mã này vào GitHub. Không chạy lại hàm khởi tạo để đổi khóa.
5. Deploy → New deployment → Web app. **Execute as: Me**, **Who has access: Anyone** (cho phép cả người chưa đăng nhập Google). Một số chính sách Workspace có thể cấm truy cập ẩn danh; phải kiểm tra bằng cửa sổ ẩn danh.
6. Dùng URL `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`. Không dùng `/dev` hoặc URL chứa `/u/5/`.

`initializeDeployment_` chỉ lưu khóa dịch vụ và mã thiết lập. Thư mục Drive riêng và dữ liệu được tạo khi tạo tổ chức/nhập bản sao lưu. Không chia sẻ thư mục dữ liệu cho NSD và không bật quyền công khai cho tệp.

Nếu dùng clasp: chạy `clasp login` bằng Google chủ, rồi `clasp create --type standalone` trong bản sao thư mục triển khai và `clasp push`. Không commit `.clasp.json`, OAuth token hoặc mã thiết lập. Cần cấu hình Web app và cấp quyền trong editor như trên.

## 2. Chọn một trong hai cách bắt đầu

**Chuyển dữ liệu 4.8.3 đang dùng (khuyến nghị):**

1. Dừng nhập liệu ở bản cũ. Mở Admin trên hai Google cũ, đồng bộ hoàn tất, xử lý thao tác bị từ chối/chờ trước khi sao lưu.
2. Tổ chức → Sao lưu & Phục hồi → tải bản sao lưu **đầy đủ ZIP**, giữ mật khẩu riêng. Có thể mở bản cũ tại `legacy-two-google.html` trên Pages sau khi cập nhật trang mở ứng dụng.
3. Mở URL `/exec` mới. Chọn **Chuyển bản sao lưu 4.8.3 / một Google**; nhập mã thiết lập, chọn ZIP/JSON và mật khẩu bản sao.
4. Kiểm tra số xe, tài khoản, giao dịch, tệp; nhập đúng tên tổ chức để xác nhận. Dịch vụ từ chối bản sao thiếu hồ sơ, thiếu tệp hoặc còn nhật ký chưa đồng bộ.
5. Đăng nhập bằng tên và mật khẩu ở thời điểm sao lưu. Tài khoản chưa đổi mật khẩu lần đầu vẫn bắt buộc đổi. Sau lần đăng nhập thành công đầu tiên, hồ sơ mã hóa cũ được thay bằng giá trị kiểm tra mật khẩu mới.
6. Dữ liệu nguồn trên hai Google được giữ nguyên. Không nhập song song vào hai bản; không có đồng bộ hai chiều.

**Tạo tổ chức trống:** dùng mã thiết lập, tên tổ chức, họ tên Admin và mật khẩu Admin tự đặt. Tên đăng nhập đầu tiên là `admin`. Không có mật khẩu mặc định công khai. Sau khi tổ chức tồn tại, mã thiết lập không còn dùng được.

## 3. Kiểm tra trước khi chuyển sử dụng

- Thử cửa sổ ẩn danh: mở `/exec`, đăng nhập NSD mà không đăng nhập Google.
- Admin và Admin bổ sung tạo/sửa dữ liệu, cấp tài khoản, phân công, bàn giao, sao lưu/phục hồi được.
- Admin chỉ xem xem dữ liệu và xuất báo cáo, bị chặn mọi thao tác ghi và sao lưu/phục hồi dữ liệu gốc.
- NSD chỉ thấy giao dịch mình nhập; chỉ sửa/xóa khi còn quản lý xe đó. Cảnh báo dành cho xe đang quản lý.
- Sau bàn giao, NSD cũ vẫn xem lịch sử mình nhập nhưng mất cảnh báo, quyền sửa/xóa/bàn giao. Nhận lại xe phục hồi quyền.
- Kiểm tra chi phí xe điện, bảo hiểm/đăng kiểm/phí đường bộ có ngày hết hạn, bảo dưỡng/phụ tùng theo km/tháng, báo cáo Excel và tệp đính kèm.
- Tạo backup mới, thử phục hồi trên deployment thử nghiệm. Phục hồi thu hồi toàn bộ phiên, tăng phiên bản bản ghi và tạo lại tệp đính kèm.
- Đo tốc độ với số tài khoản và dữ liệu thật. Apps Script có hạn mức của Google; kiểm thử mô phỏng không xác nhận quota, quyền hoặc tính sẵn sàng của Google thật.

## 4. Gắn URL cho Web, Android, Windows, iOS

Điền URL `/exec` mới vào `web/cloud-config.js`, chạy `npm run build`, commit và cập nhật GitHub Pages. Người dùng bấm **Mở ứng dụng một Google**. URL cũng có thể được nhập riêng trên thiết bị trong mục thiết lập địa chỉ.

APK 4.8.3 hiện tại mở trang Pages bằng trình duyệt hệ thống; Windows/iOS cũng sử dụng trang Web. Không cần đưa mật khẩu Google hoặc token vào các bản này. Chỉ gắn URL sản xuất sau khi kiểm tra deployment mới. Chức năng vân tay phụ thuộc hỗ trợ WebAuthn PRF và quyền iframe/trình duyệt; đăng nhập bằng mật khẩu luôn dùng được khi thiết bị không hỗ trợ.

## 5. Vận hành

- Phiên app sống tối đa 8 giờ, token chỉ giữ trong bộ nhớ tab. Reload phải đăng nhập lại. Đăng xuất thu hồi phiên tương ứng; đặt lại mật khẩu thu hồi mọi phiên của tài khoản.
- Dịch vụ khóa đọc/sửa/ghi, kiểm tra phiên bản bản ghi và lưu mã thao tác để chống gửi lặp. Không tự thử lại thao tác ghi khi chưa xác định kết quả.
- Dữ liệu nghiệp vụ là JSON riêng tư, mật khẩu PBKDF2-SHA256 100.000 vòng có salt; không trả thông tin kiểm tra mật khẩu hoặc ID tệp Drive cho NSD.
- Tệp tối đa 2 MB, 5 tệp/bản ghi. JSON tối đa 32 MB; gói nhập tối đa 64 MB. Gói backup mã hóa có giới hạn riêng để phù hợp bộ nhớ Apps Script; dịch vụ báo lỗi trước khi thay dữ liệu nếu vượt giới hạn. Cần Internet, không có hàng đợi ngoại tuyến.
- Thư mục dữ liệu chỉ do Google chủ sở hữu. Đừng sửa JSON thủ công trong lúc có người dùng. Sao lưu thường xuyên, trước khi triển khai hoặc phục hồi.
- Xóa tổ chức khóa dữ liệu và mọi phiên; tệp riêng tư được giữ lại để chủ Google có thể phục hồi qua deployment mới từ backup. Không xóa tệp khác của chủ Google.
- Đổi Google chủ: xuất backup đầy đủ, tạo deployment mới bằng Google mới, nhập backup tại màn hình thiết lập rồi cập nhật URL. Không chuyển khóa dịch vụ hay token Google qua thiết bị NSD.
- `apps-script/` là dịch vụ lịch sử khác, được giữ để kiểm thử/tương thích; deployment mới chỉ dùng `apps-script-cloud/`.

Tài liệu Google: [Web apps](https://developers.google.com/apps-script/guides/web), [manifest access/executeAs](https://developers.google.com/apps-script/manifest/web-app-api-executable), [hạn mức](https://developers.google.com/apps-script/guides/services/quotas).
