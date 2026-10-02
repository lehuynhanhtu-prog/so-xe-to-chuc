# Sổ Xe Tổ Chức — Web 3.0

Bản web dùng Google Drive API trực tiếp, lời mời mã hóa và chia sẻ từng file cho tài khoản Google của mỗi người.

- [Mở ứng dụng](https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/)
- [Thiết lập Google Cloud dùng chung với Sổ Xe cá nhân](https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/setup.html)

OAuth Client ID và project number dùng chung đã điền trong `web/google-config.js`. Picker API key cần được thêm trong giao diện cấu hình từ cùng dự án. Không đưa Client Secret vào bản web.

## Hoạt động

Admin tạo tổ chức, tài khoản và lời mời bằng đúng email Google. NSD nhận file lời mời và mật khẩu mở file, đăng nhập Google, chọn file được chia sẻ qua Picker, đặt mật khẩu mã hóa riêng. Cấu hình Google công khai được kèm trong lời mời.

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
