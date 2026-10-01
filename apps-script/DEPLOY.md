# Triển khai Sổ Xe Tổ Chức trên Google Drive

Bản web v2 dùng Google Apps Script cho giao diện và dịch vụ. Dữ liệu nghiệp vụ, tài khoản, xe, phân công, giao dịch và tệp đính kèm chỉ nằm trong một file mã hóa `so-xe-to-chuc-v2.enc.json` tại thư mục Drive bạn chọn. Không dùng Supabase, không dùng tài khoản Drive của lái xe, không lưu bản dữ liệu hay tên đăng nhập trong trình duyệt.

## 1. Chuẩn bị dưới tài khoản chủ thư mục

1. Đăng nhập Google bằng tài khoản sở hữu hoặc có quyền chỉnh sửa thư mục dùng chung.
2. Mở https://script.google.com và chọn **New project / Dự án mới**. Đặt tên **So Xe To Chuc**.
3. Thay nội dung file **Code.gs** bằng nội dung `Code.gs` trong gói này.
4. Nhấn **+ → Script**, đặt tên **Crypto**, dán nội dung `Crypto.gs`. Thư viện mã hóa được đóng gói sẵn, không phải cài thêm thư viện.
5. Nhấn **+ → HTML**, đặt tên **Index**, dán nội dung `Index.html`.
6. Mở **Project Settings / Cài đặt dự án**, bật **Show appsscript.json manifest file in editor**. Trở lại trình soạn thảo, thay nội dung `appsscript.json` bằng file tương ứng trong gói này.
7. Lưu dự án.

**Không đổi `Crypto.gs` thành HTML. Không dán khóa hoặc mật khẩu cá nhân vào mã nguồn.**

## 2. Khởi tạo và cấp quyền một lần

1. Trong trình soạn thảo, chọn hàm **initializeDeployment_** rồi bấm **Run / Chạy**.
2. Chọn **Review permissions / Xem xét quyền**, chọn đúng tài khoản chủ thư mục và cấp quyền Drive cho dự án vừa tạo.
3. Nếu Google hiển thị **Ứng dụng chưa được xác minh**, chỉ tiếp tục khi đây chính là dự án Apps Script bạn vừa tạo và bạn đang dùng tài khoản chủ dự án: **Advanced / Nâng cao → Go to So Xe To Chuc / Đi tới So Xe To Chuc → Allow / Cho phép**. Nếu chính sách đơn vị chặn, cần quản trị viên Workspace cho phép; không yêu cầu lái xe vượt màn hình này.
4. Trong **Execution log / Nhật ký thực thi**, sao chép **Mã thiết lập một lần**. Giữ mã này riêng cho Admin ban đầu.
5. Không chạy lại bước khởi tạo và không xóa Script Properties. Khóa mã hóa ở Script Properties phải được giữ để đọc dữ liệu Drive về sau.

Mã thiết lập giúp ngăn người khác chiếm quyền tạo Admin khi họ biết mật khẩu mặc định `123456`.

## 3. Phát hành bản web

1. Nhấn **Deploy / Triển khai → New deployment / Bản triển khai mới**.
2. Chọn loại **Web app / Ứng dụng web**.
3. **Execute as / Thực thi dưới quyền:** **Me / Tôi**, tức tài khoản chủ thư mục.
4. **Who has access / Ai có quyền truy cập:** **Anyone / Bất kỳ ai**. Không chọn **Anyone with Google account** vì lái xe cần vào không có Google.
5. Nhấn **Deploy**, sao chép URL kết thúc bằng **/exec**. Đây là địa chỉ app dùng cho mọi người.
6. Mở URL bằng cửa sổ ẩn danh và kiểm tra không xuất hiện yêu cầu đăng nhập Google. Nếu không có lựa chọn **Anyone**, tài khoản Workspace có thể bị chính sách tổ chức hạn chế; phải giải quyết chính sách này trước.

Tài liệu Google: https://developers.google.com/apps-script/guides/web

## 4. Admin tạo tổ chức

1. Mở URL web app, đăng nhập ban đầu với tên **admin**, mật khẩu **123456** và mã thiết lập một lần.
2. Nhập link thư mục dùng chung, bấm **Lưu thư mục và tiếp tục**. Dùng link thư mục của bạn; link thật không được đưa vào mã nguồn công khai.
3. Tạo mật khẩu Admin mới, ít nhất 8 ký tự, khác mật khẩu mặc định.
4. Nhập tên tổ chức và tên Admin. Bấm **Tạo tổ chức trên Drive**. Dịch vụ kiểm tra truy cập thư mục, tạo file mã hóa rồi mở app.
5. Vào **Người sử dụng**, tạo tài khoản, chọn vai trò. Mật khẩu ban đầu của tài khoản được cấp là **11223344**.
6. File đăng nhập mã hóa tự tải xuống. Gửi **URL web app + file này** riêng cho đúng người nhận. App không tự gửi email/Zalo.
7. Vào **Xe**, thêm xe; sau đó chọn **Phân công** và người quản lý/lái xe.

Admin tạo thêm Admin hoặc Admin chỉ xem bằng cùng quy trình. Nếu cấp lại file, file cũ và các phiên của tài khoản đó bị vô hiệu; mật khẩu hiện tại giữ nguyên.

## 5. Người quản lý/lái xe sử dụng

1. Mở URL web app do Admin gửi.
2. Chọn file thông tin đăng nhập mã hóa. Dịch vụ điền tên đăng nhập; không hiển thị link Drive.
3. Đăng nhập lần đầu bằng **11223344**, đổi mật khẩu ngay khi app yêu cầu.
4. Mỗi phiên mới cần nhập lại file và mật khẩu. App không ghi nhớ tên theo thiết bị.
5. Nhập/sửa/xóa giao dịch khi có Internet. App báo lỗi nếu ghi thất bại; không coi dữ liệu là đã lưu ngoại tuyến.
6. Được xem giao dịch mình nhập (kể cả nhập hộ) và tất cả giao dịch của xe hiện được phân công. Chỉ sửa/xóa giao dịch mình nhập. Admin chỉ xem không được sửa hoặc xóa.

## 6. Giới hạn và bảo quản

- Tệp đính kèm nằm bên trong file dữ liệu mã hóa: tối đa **2 MB/tệp**, **5 tệp/xe hoặc giao dịch**; toàn bộ file mã hóa giới hạn **15 MB** ở bản này. Phù hợp tổ chức nhỏ; chưa phù hợp lưu số lượng lớn ảnh/video.
- Bản này có các loại chi phí cơ bản và tệp đính kèm. Chưa chuyển các tính năng nhắc hạn, bàn giao và khôi phục tự phục vụ của bản cũ vào giao diện mới.
- Apps Script có hạn mức và thời gian chạy của Google, không phải dịch vụ không giới hạn. Hạn mức: https://developers.google.com/apps-script/guides/services/quotas
- Không cần bật quyền công khai cho folder. Giữ folder chỉ chia sẻ cho Admin/chủ dịch vụ. Địa chỉ folder không phải thông tin cấp quyền ghi.
- Admin chỉ xem được xem toàn bộ dữ liệu qua app, nhưng không được xem cấu hình link Drive. Chỉ Admin được xem/đổi link, sửa tên tổ chức hoặc xóa tổ chức.
- Xóa giao dịch/xe loại bỏ cả tệp đính kèm trong dữ liệu hiện hành. Các bản sao lưu và lịch sử phiên bản Drive cũ có thể còn nội dung; Drive Trash cần chủ tài khoản dọn nếu muốn xóa vĩnh viễn.
- Xóa tổ chức yêu cầu tên tổ chức và mật khẩu Admin, đưa **file riêng của app** vào Trash, khóa dịch vụ. Không xóa folder hay các file khác của bạn. Muốn tạo tổ chức mới, dùng dự án dịch vụ mới.
- Khóa mã hóa và ID cấu hình nằm trong **Script Properties**, không nằm trong folder chia sẻ hoặc mã JavaScript của người dùng. Đây là bí mật cấu hình của dịch vụ, không phải bản sao dữ liệu nghiệp vụ.
- Chủ dịch vụ có quyền giải mã, vì dịch vụ phải kiểm tra quyền và phục vụ dữ liệu. Người có quyền chỉnh sửa dự án Apps Script cũng có thể đọc khóa; chỉ chia sẻ dự án cho quản trị viên đáng tin cậy.
- File đăng nhập mã hóa chứa định danh tổ chức, tên đăng nhập, link folder và bí mật cấp quyền; dịch vụ giải mã. Ai có cả file và mật khẩu ban đầu có thể chiếm tài khoản chưa đổi mật khẩu. Gửi riêng và yêu cầu người nhận đổi ngay.

## 7. Sao lưu và chuyển dịch vụ

Trong app, Admin chọn **Tổ chức → Tải bản sao mã hóa**. File gồm dữ liệu và tệp đính kèm. Để có thể phục hồi, chủ dịch vụ cần lưu riêng các Script Properties ở **Project Settings → Script Properties**, đặc biệt **SX_KEY**, trong trình quản lý mật khẩu hoặc nơi bí mật. Không gửi khóa trong hội thoại, không đưa vào GitHub hoặc folder chia sẻ.

Khi phục hồi kỹ thuật sang dự án Apps Script mới: sao chép 4 file mã, khôi phục **SX_KEY** chính xác; đưa bản sao mã hóa về folder, đặt tên `so-xe-to-chuc-v2.enc.json`, cấu hình **SX_FILE** là ID file mới, **SX_FOLDER** là ID folder, **SX_ORG** là giá trị cũ và **SX_STATE=ready**. Không chạy `initializeDeployment_` vì nó sinh khóa mới. Triển khai dưới chủ folder. Nếu URL dịch vụ đổi, Admin cần gửi URL mới cùng file đăng nhập; file vẫn dùng được nếu khóa/tổ chức được giữ. Quy trình này chưa có nút khôi phục trong app.

Bản dữ liệu v1 dùng mật khẩu mã hóa chung không tương thích v2. App từ chối tạo tổ chức v2 trong folder có file v1 để tránh ghi đè; cần sao lưu và di trú riêng. Không có công cụ chuyển đổi tự động trong gói này.

## 8. Kiểm tra sau triển khai

Kiểm tra trên Drive thật trước khi nhập dữ liệu thật:

1. Admin tạo xe và hai tài khoản lái xe, phân công hai xe khác nhau.
2. Đăng nhập lái xe bằng cửa sổ ẩn danh, nhập file, đổi mật khẩu; không có màn hình Google.
3. Lái xe A nhập một giao dịch xe mình và một giao dịch nhập hộ xe B.
4. Lái xe B thấy giao dịch nhập hộ của xe B; lái xe A không thấy giao dịch khác của xe B do người khác nhập.
5. Lái xe không sửa/xóa giao dịch người khác; Admin chỉ xem không sửa/xóa được.
6. Tải lại trang, đăng nhập lại và kiểm tra giao dịch còn trên Drive. Tệp trong folder là JSON chứa ciphertext, không có tên người hoặc nội dung giao dịch rõ.
7. Thử xóa người đã được phân công xe: dịch vụ từ chối. Thử hai Admin sửa cùng giao dịch: bản cũ bị yêu cầu tải lại.
8. Thử xóa tệp, giao dịch và xe trên dữ liệu thử; xác nhận file dữ liệu hiện hành đã loại bỏ nội dung liên quan.

Kiểm thử tự động trong repository mô phỏng dịch vụ Drive/Apps Script; không thay thế bước cấp quyền, kiểm tra triển khai ẩn danh và hạn mức trên Google thật.
