# Sổ Xe Tổ Chức — Đa nền tảng 4.6

Mô hình hai Google: tài khoản thứ nhất lưu dữ liệu Admin; tài khoản TK Google lưu dữ liệu NSD lưu tài khoản, nhật ký và bản dữ liệu được xem của NSD. Mọi nội dung JSON được mã hóa trong trình duyệt. Admin tạo NSD bằng tên định danh và mật khẩu ban đầu, không cần email hoặc lời mời. NSD kết nối Google TK Google lưu dữ liệu NSD, nhập tên định danh và bắt buộc đổi mật khẩu lần đầu.

- Admin tự đồng bộ TK Google lưu dữ liệu NSD khi đăng nhập và mỗi 15 giây khi app đang mở.
- Root JSON của Admin chứa xe, NSD, phân công, giao dịch, khóa và mã file NSD.
- Tổng quan/Chi phí/Báo cáo dùng cùng danh sách chi tiết; có ODO, thông tin theo loại, người nhập và nhập hộ. Báo cáo có bộ lọc và xuất Excel.
- Admin bổ sung cần kết nối cả hai Google; vai trò chỉ xem không ghi dữ liệu.
- Không dùng Gmail/Picker trong mô hình mới, không lưu mật khẩu Google. Kết nối Google được giữ tạm trong tab đến khi token hết hạn; không lưu token trong localStorage. Mật khẩu app ít nhất 6 ký tự.
- Tất cả người đăng nhập Google TK Google lưu dữ liệu NSD đều sở hữu dữ liệu Drive TK Google lưu dữ liệu NSD: phân quyền trong app không chặn xóa file trực tiếp trên Drive. Mật khẩu riêng bảo vệ các khóa mã hóa; sao lưu thường xuyên.

Web: https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/
Hướng dẫn: https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/setup.html

Có chức năng chuyển tổ chức từ mô hình mỗi NSD dùng Google riêng sang TK Google lưu dữ liệu NSD, giữ file cũ. Bản cũ nằm ở `web/legacy-drive-v3.html` và `docs/legacy-drive-v3.html`. Không nhập tiếp ở bản cũ sau khi chuyển.

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

Luồng Admin: mã thiết lập chủ dịch vụ → lưu link Drive → tạo mật khẩu Admin → nhập tên tổ chức → thêm người dùng với mật khẩu ban đầu do Admin chọn → gửi URL web app và file thông tin đăng nhập mã hóa → nhập xe → phân công xe.

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
Chọn ADMIN/NSD trước Google; NSD gõ tên đăng nhập. Đăng xuất app giữ phiên Google trong bộ nhớ. Admin sửa họ tên/tên đăng nhập NSD mà không đổi mật khẩu hoặc lịch sử. Giao dịch theo hàng ngang. Không tạo lời mời mã hóa ở TK Google lưu dữ liệu NSD; bỏ dẫn xuất mật khẩu lặp lúc đăng nhập và tạo tổ chức. Ghi dùng AES native, cache theo từng thao tác và ETag chống ghi đè; phát bản dữ liệu song song theo nhóm bốn file.

## Bản 4.2

Màn hình NSD sau kết nối TK Google lưu dữ liệu NSD chỉ còn biểu mẫu đăng nhập; Admin bổ sung vào từ màn hình ADMIN sau kết nối cả hai Google. Tổng quan và Xe hiển thị bảo hiểm TNDS, đăng kiểm, phí đường bộ (cảnh báo trước 45 ngày), bảo dưỡng/phụ tùng theo chu kỳ km hoặc tháng. Hạn trong 5 ngày và ODO đã đến/vượt được nhấn mạnh. Bấm cảnh báo để xem giao dịch. Tính toán chỉ dùng dữ liệu được phép xem, không phát sinh thêm yêu cầu Drive.

Tổng quan kế thừa Sổ xe cá nhân: chi tháng này, năng lượng/bảo dưỡng, bảng tổng hợp xe, biểu đồ sáu tháng, nhóm nhắc bảo dưỡng/bảo hiểm/đăng kiểm-phí đường bộ và giao dịch gần đây. Xe của tôi có động cơ, năm, ODO, người quản lý, thời hạn và giấy xe. Tiền xăng giữ tổng tiền, tính số lít từ đơn giá hoặc tính đơn giá từ số lít. Admin tự nhập mật khẩu khởi tạo NSD; không điền sẵn mật khẩu công khai, tài khoản cũ giữ nguyên.

## Bản 4.3

Ẩn cấu hình Google ở màn hình đăng nhập. Admin đã có tổ chức chỉ thấy nút Đăng nhập; chưa có tổ chức đi thẳng sang khởi tạo. Kho `two-google-v2` bắt đầu dữ liệu mới, không tự đọc kho 4.2. File JSON dùng AES native với khóa phiên tái sử dụng; file tài khoản mới dẫn xuất khóa 100.000 vòng, không dẫn xuất mật khẩu mỗi lần lưu giao dịch. Ngày nhập/hiển thị theo dd/mm/yyyy, dữ liệu nội bộ vẫn dùng ISO để lọc/sắp xếp đúng. Admin có thể đặt lại mật khẩu NSD trong Sửa; phiên cũ bị thu hồi và NSD phải đổi mật khẩu lần tiếp theo. Mật khẩu khởi tạo công khai theo yêu cầu là `000000`, bắt buộc đổi trước khi dùng.

## Bản 4.4

NSD chỉ sửa giao dịch do chính mình nhập (kể cả nhập hộ); Admin sửa tất cả, Admin chỉ xem không sửa. Nhập chi phí mặc định chọn xe đang quản lý đầu tiên; bật Nhập hộ để chọn xe khác. Cảnh báo Tổng quan/Xe kèm người quản lý/lái xe hiện tại. Mọi ô ngày có lịch chọn ngày, tháng, năm và vẫn hiển thị dd/mm/yyyy. Lưu tiếp tục dùng AES native với khóa phiên, không dẫn xuất mật khẩu khi lưu; không ghi lại bản dữ liệu NSD có nội dung không thay đổi, kể cả sau lần đăng nhập Admin mới. Giữ nguyên kho dữ liệu 4.3.

## Bản 4.4.1

Tải lại cùng tab giữ kết nối Google còn hiệu lực, mở thẳng form đăng nhập ADMIN/NSD đã chọn. Không giữ mật khẩu app, tên đăng nhập NSD hay khóa giải mã. Google Admin và Google dữ liệu NSD được lưu tách biệt trong sessionStorage theo app/client/loại tài khoản; token hết hạn được bỏ, chỉ giữ email gợi ý để xin lại quyền trên đúng tài khoản. Đăng xuất app giữ kết nối Google; ngắt kết nối Google xóa phiên của cả hai tài khoản.

## Bản 4.5

- Bàn giao xe giữa hai người quản lý/lái xe: người giao/nhận có thể nhập bàn giao mình tham gia, Admin nhập mọi bàn giao. Lưu ngày giờ, ODO, ghi chú và người nhập; chỉ người nhập hoặc Admin sửa/xóa. Bàn giao chuyển người quản lý; nhật ký NSD được Admin đồng bộ như chi phí.
- Lịch sử phân công cũ được giữ lại và dùng tính thời gian. Sửa/xóa bàn giao tính lại các giai đoạn; nếu làm sai chuỗi bàn giao sau đó, thao tác bị từ chối, giữ dữ liệu cũ.
- Báo cáo có thời gian quản lý từng/tất cả NSD, lọc xe và ngày, giai đoạn đang quản lý, tổng thời gian theo từng xe, xuất Excel. Metadata phân công được cung cấp cho báo cáo; giao dịch chi phí vẫn lọc theo quyền cũ.
- Khi đã kết nối Google trước đó, chỉ nhập tên user và mật khẩu; phiên Google hết hạn được xin lại trên tài khoản đã kết nối khi bấm Đăng nhập; không chọn tài khoản app trong danh sách. Tên đăng nhập xác định vai trò. Nhiều tổ chức cùng tên user được phân biệt bằng mật khẩu; nếu trùng cả hai, cần dùng mật khẩu riêng cho từng tổ chức.
- Tổng quan có danh sách giao dịch gọn; nhấp để xem chi tiết, sửa/xóa theo quyền. Bàn giao cũng xuất hiện trong giao dịch gần đây.
- Tạo/sửa/đăng nhập dùng chung cách chuẩn hóa tên: chữ có dấu được chấp nhận, khoảng trắng thành gạch dưới, bỏ ký tự vô hình khi sao chép. Form tạo hiển thị tên sẽ lưu; Admin bổ sung dùng cùng quy tắc NSD. Mật khẩu NSD mới vẫn 000000 và bắt buộc đổi lần đầu.

Giữ nguyên kho dữ liệu 4.3/4.4; không cần khởi tạo lại.

Gợi ý email Google và loại đăng nhập được giữ trên thiết bị để mở lại app chỉ thấy form user/mật khẩu. Token chỉ ở phiên tab, không lưu lâu dài; mật khẩu app, tên user NSD và khóa giải mã không lưu theo thiết bị. Ngắt kết nối Google xóa cả gợi ý và token. Google có thể yêu cầu xác nhận quyền khi Đăng nhập xin lại token đã hết hạn.

## Bản đa nền tảng 4.6.0

[Tải ứng dụng](https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/downloads.html).

- Android: APK `vn.soxe.organization`, Android 7+, mở Web bằng trình duyệt hệ thống. Google OAuth chạy trong trình duyệt, không nhúng vào WebView. Không cần OAuth Android riêng.
- Windows Portable: EXE/BAT mở cùng Web HTTPS; không chạy máy chủ localhost, không yêu cầu thêm origin localhost.
- iOS: hồ sơ Web Clip hoặc Safari → Thêm vào Màn hình chính, tương tự Sổ Xe cá nhân. Không phải IPA native.
- Web: bản trực tuyến và gói ZIP cho tự host. Cần HTTPS và cấu hình OAuth origin nếu đổi nơi host.

Tất cả dùng cùng dữ liệu Drive và chức năng 4.5. Cần mạng để đăng nhập và đồng bộ. Gợi ý Google lưu theo trình duyệt; không lưu tên đăng nhập/mật khẩu app. Bản Web mới tự áp dụng khi mở ứng dụng.

Build Android unsigned: Gradle 8.9, JDK 17, SDK 35, `cd android && gradle :app:assembleRelease :app:lintRelease`. APK phát hành được ký riêng ngoài repo; không đưa khóa riêng vào git. Giữ khóa ký để cập nhật cài đè; không thay bằng debug key. CI cung cấp APK unsigned và apksigner.jar để ký. Workflow Windows xuất ZIP, iOS, Web và APK đã ký nếu có vào release `platform-v4.6.0`.

Gói Web: `npm run package:web`. Kiểm tra: `npm test`, `npm run check`, `npm run test:ui`.

Ký APK tải từ artifact Android với khóa riêng đã sao lưu:

```sh
python3 tools/sign-android.py --apk app-release-unsigned.apk --apksigner-jar apksigner.jar --keystore /private/so-xe-to-chuc-release.jks --password-file /private/password.txt --output docs/downloads/So-Xe-To-Chuc-Android-4.6.0.apk
```

Không đặt khóa hoặc mật khẩu trong repo. Trước khi phát hành, kiểm tra package/version bằng aapt và chữ ký bằng apksigner; giữ nguyên khóa cho lần cập nhật sau. APK đã ký được workflow Windows đính kèm vào release chung.
