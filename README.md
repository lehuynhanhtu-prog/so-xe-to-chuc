# Sổ Xe Tổ Chức — Web 4.1

Mô hình hai Google: tài khoản thứ nhất lưu dữ liệu Admin; tài khoản TK2 lưu tài khoản, nhật ký và bản dữ liệu được xem của NSD. Mọi nội dung JSON được mã hóa trong trình duyệt. Admin tạo NSD bằng tên định danh và mật khẩu ban đầu, không cần email hoặc lời mời. NSD kết nối Google TK2, chọn tên định danh và bắt buộc đổi mật khẩu lần đầu.

- Admin tự đồng bộ TK2 khi đăng nhập và mỗi 15 giây khi app đang mở.
- Root JSON của Admin chứa xe, NSD, phân công, giao dịch, khóa và mã file NSD.
- Tổng quan/Chi phí/Báo cáo dùng cùng danh sách chi tiết; có ODO, thông tin theo loại, người nhập và nhập hộ. Báo cáo có bộ lọc và xuất Excel.
- Admin bổ sung cần kết nối cả hai Google; vai trò chỉ xem không ghi dữ liệu.
- Không dùng Gmail/Picker trong mô hình mới, không lưu token hoặc mật khẩu Google. Mật khẩu app ít nhất 6 ký tự.
- Tất cả người đăng nhập Google TK2 đều sở hữu dữ liệu Drive TK2: phân quyền trong app không chặn xóa file trực tiếp trên Drive. Mật khẩu riêng bảo vệ các khóa mã hóa; sao lưu thường xuyên.

Web: https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/
Hướng dẫn: https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/setup.html

Có chức năng chuyển tổ chức từ mô hình mỗi NSD dùng Google riêng sang TK2, giữ file cũ. Bản cũ nằm ở `web/legacy-drive-v3.html` và `docs/legacy-drive-v3.html`. Không nhập tiếp ở bản cũ sau khi chuyển.

## Phát triển

`npm ci`, `npm test`, `npm run check`, `npm run test:ui`.
Nguồn hiện tại: `web/dual-drive.mjs`, `web/dual-service.mjs`, `web/index.html`, `web/reports.mjs`. `web/service.mjs` là lõi giao dịch, phân công, lọc quyền và xử lý nhật ký. Build ra `docs/`, các module có mã phiên bản để tránh cache cũ.

## Lịch sử bản 3.1 và Apps Script

# Sổ Xe Tổ Chức — Web 3.0

Bản web dùng Google Drive API trực tiếp, lời mời mã hóa và chia sẻ từng file cho tài khoản Google của mỗi người.

- [Mở ứng dụng](https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/)
- [Thiết lập Google Cloud dùng chung với Sổ Xe cá nhân](https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/setup.html)

OAuth Client ID và project number dùng chung đã điền trong `web/google-config.js`. Picker API key cần được thêm trong giao diện cấu hình từ cùng dự án. Không đưa Client Secret vào bản web.

## Hoạt động

Admin tạo tổ chức, tài khoản và lời mời bằng đúng email Google. Admin cấp quyền Gmail để tự gửi lời mời JSON mã hóa. NSD dùng nút nhận lời mời qua email, cấp quyền Gmail readonly, nhập mật khẩu Admin gửi qua kênh riêng, chọn file được chia sẻ qua Picker, đặt mật khẩu mã hóa riêng. Cấu hình Google công khai được kèm trong lời mời.

Tổ chức và các bản dữ liệu được xem thuộc Drive Admin tạo chúng. Nhật ký và file tài khoản của NSD thuộc Drive NSD. Admin chọn nhật ký NSD qua Picker một lần. Các thay đổi NSD nằm trong nhật ký đến khi Admin mở app và đồng bộ để phát bản dữ liệu mới; app không có máy chủ chạy nền. Admin bổ sung cần chọn các nhật ký và file được xem qua Picker.

Dữ liệu dùng AES-256-GCM; mật khẩu dùng PBKDF2-SHA256 600.000 vòng. ETag/If-Match ngăn ghi đè đồng thời; operation ID ngăn lặp giao dịch. Driver nhận bản dữ liệu mã hóa đã lọc và chỉ sửa giao dịch mình nhập. Viewer chỉ xem. NSD từng có phân công hoặc hoạt động không được xóa. Xóa tổ chức cần xác nhận tên/mật khẩu của Admin sở hữu; không thể xóa file riêng trong Drive của NSD.

## Build và kiểm tra

```sh
npm ci
npm test
npm run check
npx playwright install --with-deps chromium --only-shell
npm run test:ui
```

`web/` là mã nguồn hiện tại; `npm run build` tạo bản tĩnh trong `docs/`. GitHub Pages phát hành `docs/`. Kiểm tra tích hợp mô phỏng quyền Drive, chia sẻ, ETag và dữ liệu mã hóa; kiểm tra Chromium chạy luồng Admin/NSD thực với transport Google mô phỏng. Chưa có kiểm tra end-to-end bằng tài khoản Google thực trong môi trường build này.

## Chuyển từ bản cũ

Bản Apps Script được giữ để tham khảo và duy trì dữ liệu cũ. Không tự động chuyển file hoặc mật khẩu sang mô hình v3. Sao lưu trước khi chuyển. Bản mới có xuất sao lưu mã hóa; chưa có giao diện phục hồi hoặc đặt lại mật khẩu bị quên.

<details><summary>Tài liệu phiên bản Apps Script cũ</summary>

# Sổ Xe Tổ Chức — Web dùng Google Drive

Bản web mới nằm trong `apps-script/`: giao diện và dịch vụ Google Apps Script chạy dưới tài khoản chủ thư mục, mọi dữ liệu nghiệp vụ và tệp đính kèm nằm trong một file mã hóa AES-256-GCM tại folder Drive do Admin chọn. Người quản lý/lái xe không cần tài khoản Google. Không dùng Supabase.

**Cần triển khai Apps Script một lần trước khi có URL web hoạt động.** Mã nguồn hoặc trang GitHub Pages tự nó không cấp quyền ghi Drive.

## Thiết lập

Đọc [hướng dẫn triển khai đầy đủ](apps-script/DEPLOY.md), hoặc tải [gói web Drive](docs/downloads/so-xe-drive-web.zip).

Luồng Admin: `admin` / `123456` + mã thiết lập chủ dịch vụ → lưu link Drive → tạo mật khẩu Admin → nhập tên tổ chức → thêm người dùng với mật khẩu ban đầu `11223344` → gửi URL web app và file thông tin đăng nhập mã hóa → nhập xe → phân công xe.

Mã thiết lập một lần giúp ngăn chiếm Admin bằng mật khẩu công khai. Mọi tài khoản được cấp phải đổi mật khẩu mặc định trước khi dùng. File đăng nhập được mã hóa bằng khóa chỉ dịch vụ giữ, không chứa khóa dữ liệu; Admin gửi file riêng cho người nhận.

## Phân quyền phía dịch vụ

- Admin: mọi dữ liệu, quản lý xe/tài khoản/phân công/cấu hình Drive.
- Admin chỉ xem: xem toàn bộ dữ liệu, không sửa/xóa, không xem link Drive.
- Người quản lý/lái xe: xem giao dịch mình nhập và mọi giao dịch của xe hiện được phân công; chỉ sửa/xóa giao dịch mình nhập. Có thể nhập hộ xe khác.
- Không xóa tài khoản đang đăng nhập, đã được phân công xe hoặc có giao dịch/hoạt động liên quan.
- Sửa/xóa tổ chức chỉ dành cho Admin. Xóa yêu cầu tên tổ chức và mật khẩu; chỉ đưa file app vào Trash, không đụng các file khác trong folder.

## Lưu trữ và giới hạn

Tài khoản, phân công, giao dịch và tệp nằm trong `so-xe-to-chuc-v2.enc.json`. Không lưu dữ liệu hay tên đăng nhập trong trình duyệt. Script Properties giữ khóa mã hóa và các ID cấu hình, không chứa dữ liệu nghiệp vụ. Mật khẩu được băm PBKDF2-SHA256 với salt riêng, 600.000 vòng. Phiên có chữ ký, hết hạn sau 8 giờ và bị thu hồi khi đổi mật khẩu/cấp lại file. Khóa tách theo mục đích mã hóa file đăng nhập và ký phiên.

Dịch vụ khóa thao tác đọc/sửa/ghi, kiểm tra phiên bản từng bản ghi và chặn ghi đè từ bản cũ. Giới hạn bản đầu: 2 MB/tệp, 5 tệp/bản ghi và tổng file mã hóa 15 MB; yêu cầu Internet, không có hàng đợi ngoại tuyến. Google Apps Script có hạn mức của Google.

Bản web mới chưa có đầy đủ nhắc hạn/bàn giao của bản cũ. File dữ liệu v1 không tương thích, không tự di trú. Bản v1 trong lịch sử git dùng Google OAuth trên trình duyệt; không dùng nó cho yêu cầu lái xe không có Google. Trang `docs/index.html` của bản mới chỉ mở URL dịch vụ đã triển khai.

## Phát triển và kiểm thử

```sh
npm ci
npm test
npm run check
npx playwright install chromium --only-shell
npm run test:ui
python tools/package.py
```

`npm run build` đóng gói thư viện mã hóa MIT từ @noble/ciphers và @noble/hashes vào `Crypto.gs`. Test dùng dịch vụ Drive/Apps Script mô phỏng, kiểm tra mật khẩu, file đăng nhập, vai trò, tệp, xung đột và xóa. Cần kiểm tra riêng quyền Google, triển khai ẩn danh và hoạt động trên Drive thật theo hướng dẫn.

Dự án Sổ Xe cá nhân ở `so-xe-android` không thay đổi.

</details>

### Bản 3.1 — lời mời Gmail và thư mục Drive
Bật thêm Gmail API; cấu hình gmail.send và gmail.readonly trong Google Auth Platform → Data Access. Quyền gửi là nhạy cảm, quyền đọc là hạn chế và có thể yêu cầu xác minh Google khi phát hành rộng rãi. Admin lưu file JSON mã hóa tại “Sổ xe tổ chức”; NSD tại “NSD-Sổ xe tổ chức”. App chỉ chia sẻ từng file. Xem hướng dẫn đầy đủ tại docs/setup.html.

## Bản 4.1
Chọn ADMIN/NSD trước Google; NSD gõ tên đăng nhập. Đăng xuất app giữ phiên Google trong bộ nhớ. Admin sửa họ tên/tên đăng nhập NSD mà không đổi mật khẩu hoặc lịch sử. Giao dịch theo hàng ngang. Không tạo lời mời mã hóa ở TK2; bỏ dẫn xuất mật khẩu lặp lúc đăng nhập và tạo tổ chức. Ghi dùng AES native, cache theo từng thao tác và ETag chống ghi đè; phát bản dữ liệu song song theo nhóm bốn file.
