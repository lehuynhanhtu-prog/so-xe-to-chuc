(() => {
  'use strict';
  const STORAGE_KEY = 'so-xe-language-v1';
  const ORIGINAL_TITLE = document.title;
  const EN = {
    'Sổ Xe — Quản lý chi phí ô tô':'Sổ Xe — Vehicle expense management','Chi phí ô tô':'Vehicle expenses','Tổng quan':'Overview','Chi phí':'Expenses','Báo cáo':'Reports','Xe của tôi':'My vehicles','Cài đặt':'Settings',
    '● Chưa kết nối Drive':'● Drive not connected','Đồng bộ ngay':'Sync now','Tổng quan chi phí':'Expense overview','Tình hình xe trong tháng này':'Vehicle activity this month',
    '+ Thêm xe':'+ Add vehicle','+ Ghi chi phí':'+ Add expense','Chi phí và ODO từng xe trong tháng này':'Monthly expenses and odometer by vehicle',
    'Biển số':'License plate','Tên xe':'Vehicle name','Loại xe':'Vehicle type','Chi phí tháng này':'This month','ODO hiện tại':'Current odometer','Tổng cộng chi phí các xe':'Total vehicle expenses',
    'Chi phí 6 tháng gần nhất':'Expenses over the last 6 months','Sắp đến hạn bảo dưỡng':'Upcoming maintenance','Bảo hiểm TNDS của các xe':'Vehicle liability insurance',
    'Luôn hiển thị bảo hiểm hiện có và cảnh báo nổi bật trong vòng 45 ngày trước khi hết hạn.':'Current insurance is always shown, with a prominent warning during the final 45 days.',
    'Đăng kiểm và phí đường bộ của các xe':'Registration inspection and road-use fees','Luôn hiển thị kỳ hiện có và cảnh báo nổi bật trong vòng 45 ngày trước khi hết hạn.':'Current records are always shown, with a prominent warning during the final 45 days.',
    'Giao dịch gần đây':'Recent transactions','Nhấn vào một dòng để xem chi tiết':'Select a row to view details','Sắp xếp':'Sort','Theo thời gian':'By date','Theo xe':'By vehicle',
    'Ngày':'Date','Xe':'Vehicle','Loại':'Type','ODO':'Odometer','Thành tiền':'Amount','Sổ chi phí':'Expense log','Xăng, bảo dưỡng và các khoản khác':'Fuel, maintenance and other expenses',
    'Tìm nội dung...':'Search transactions...','Tất cả loại':'All types','Xăng':'Fuel','Sạc xe':'Charging','Thuê pin':'Battery rental','Bảo dưỡng':'Maintenance','Phụ tùng':'Parts',
    'Bảo hiểm TNDS':'Liability insurance','Đăng kiểm':'Vehicle inspection','Phí đường bộ':'Road-use fee','Khác':'Other','Nội dung':'Description','Số lượng':'Quantity',
    'Chi phí, ODO và mức tiêu hao tách riêng theo từng xe':'Expenses, odometer and consumption by vehicle','Quản lý ODO và lịch bảo dưỡng':'Manage odometer and maintenance schedules',
    'Cài đặt & dữ liệu':'Settings & data','Đồng bộ an toàn giữa máy tính và điện thoại':'Secure sync across computers and phones','Tải và cài ứng dụng Sổ Xe':'Download and install Sổ Xe',
    'Windows, Android và iPhone/iPad':'Windows, Android and iPhone/iPad','Google Drive':'Google Drive','Quyền riêng tư và điều khoản':'Privacy and terms','Chính sách quyền riêng tư':'Privacy Policy','Điều khoản sử dụng':'Terms of Use',
    'Ngôn ngữ':'Language','Ngôn ngữ hiển thị':'Display language','Thay đổi ngôn ngữ sử dụng trong ứng dụng.':'Change the language used in the app.',
    'Tài khoản Google':'Google account','Kết nối tài khoản Google':'Connect Google account','Ngắt kết nối':'Disconnect','Sao lưu thủ công':'Manual backup',
    'Tải bản dự phòng hoặc phục hồi dữ liệu khi chuyển thiết bị.':'Download a backup or restore data when moving to another device.','✓ Dữ liệu được bảo vệ':'✓ Data protection',
    'Sao lưu dữ liệu':'Back up data','Nên dùng bản ZIP đầy đủ để giữ cả ảnh và tệp đính kèm.':'Use a complete ZIP backup to retain photos and attachments.',
    'Tải bản sao lưu đầy đủ (.zip)':'Download complete backup (.zip)','Bao gồm dữ liệu JSON và các tệp trong thư mục Sổ xe. Cần kết nối Google Drive.':'Includes JSON data and all files in the Sổ xe Drive folder. Google Drive connection required.',
    'Chỉ cần dữ liệu cơ bản?':'Only need the basic data?','Tải riêng file JSON':'Download JSON only','Phục hồi dữ liệu':'Restore data','Hãy tạo một bản sao lưu hiện tại trước khi phục hồi.':'Create a current backup before restoring.',
    'Chọn bản sao lưu ZIP để phục hồi':'Choose ZIP backup to restore','Dữ liệu hiện tại sẽ được thay sau khi ảnh được tải lên Google Drive thành công.':'Current data will be replaced after attachments are successfully uploaded to Google Drive.',
    'File JSON cũ?':'Have an older JSON file?','Nhập file JSON':'Import JSON','Ghi chi phí':'Add expense','Đóng':'Close','Xe *':'Vehicle *','Ngày *':'Date *','Loại chi phí *':'Expense type *',
    'Đổ xăng':'Refueling','Biển số *':'License plate *','Tên xe':'Vehicle name','Loại xe *':'Vehicle type *','Xe xăng/dầu':'Petrol/Diesel','Xe điện':'Electric','Xe Điện-Xăng':'Hybrid',
    'Năm sản xuất':'Model year','Giấy chủ quyền xe (ảnh hoặc PDF, tối đa 15 MB/tệp)':'Vehicle ownership document (image or PDF, up to 15 MB/file)',
    'Có thể sửa giảm sau khi đã sửa các giao dịch nhập sai ODO.':'You can reduce this value after correcting transactions with an incorrect odometer.',
    'Hủy':'Cancel','Lưu xe':'Save vehicle','Lưu':'Save','Sửa':'Edit','Xóa':'Delete','Xem / tải':'View / download','Xem giấy chủ quyền':'View ownership document',
    'Chọn ngôn ngữ':'Choose language','Vui lòng chọn ngôn ngữ sử dụng. Bạn có thể thay đổi lại trong Cài đặt.':'Please choose your language. You can change it later in Settings.',
    'Quay lại Sổ Xe':'Back to Sổ Xe','Tải ứng dụng Sổ Xe':'Download Sổ Xe','Chọn phiên bản phù hợp với thiết bị. Dữ liệu có thể đồng bộ an toàn qua Google Drive.':'Choose the version for your device. Your data can be securely synced with Google Drive.',
    'Bản portable cho Windows 10/11, không cần cài đặt.':'Portable edition for Windows 10/11; no installation required.','Tải và giải nén tệp ZIP.':'Download and extract the ZIP file.',
    'Mở thư mục đã giải nén, chạy Chay-So-Xe.bat.':'Open the extracted folder and run Chay-So-Xe.bat.','Kết nối Google Drive để đồng bộ dữ liệu.':'Connect Google Drive to sync your data.',
    'Dành cho điện thoại và máy tính bảng Android 7.0 trở lên.':'For phones and tablets running Android 7.0 or later.','Tải và mở tệp APK.':'Download and open the APK file.',
    'Cho phép trình duyệt cài ứng dụng nếu được yêu cầu.':'Allow your browser to install the app if prompted.','Cài đè phiên bản cũ để giữ dữ liệu.':'Install over the existing version to retain your data.',
    'Cài Sổ Xe dưới dạng ứng dụng web toàn màn hình trên iPhone hoặc iPad.':'Install Sổ Xe as a full-screen web app on iPhone or iPad.',
    'Mở trang này bằng Safari và tải tệp cấu hình.':'Open this page in Safari and download the configuration profile.','Vào Cài đặt → Đã tải về hồ sơ → Cài đặt.':'Go to Settings → Profile Downloaded → Install.',
    'Mở Sổ Xe từ Màn hình chính và kết nối Google Drive.':'Open Sổ Xe from the Home Screen and connect Google Drive.','☁ Dữ liệu dùng chung an toàn':'☁ Secure shared data',
    'Ngày hiệu lực *':'Effective date *','Ngày hết hạn *':'Expiry date *','Loại chi phí':'Expense type','Ghi chú':'Notes','Tệp đính kèm':'Attachments',
    'Đơn giá/lít':'Price/litre','Số lít':'Litres','Pin trước khi sạc':'Battery before charging','Pin sau khi sạc':'Battery after charging','Mức pin đã sạc':'Battery charged',
    'Chu kỳ km':'Distance interval','Chu kỳ thời gian':'Time interval','Tổng chi phí':'Total expenses','Chi phí theo tháng':'Monthly expenses','Tháng':'Month',
    'ODO cuối kỳ':'Ending odometer','ODO giữa 2 kỳ':'Distance between entries','Lần trước':'Previous entry','Lần sau':'Next entry','Quãng đường':'Distance',
    'Kỳ trước':'Previous entry','Kỳ sau':'Next entry','ODO chênh lệch':'Odometer difference','Giấy chủ quyền':'Ownership document','Sửa xe':'Edit vehicle','Xóa xe':'Delete vehicle',
    'Không có tệp đính kèm':'No attachments','Tệp đã lưu trên Google Drive':'Files saved on Google Drive','Hãy thêm xe trước':'Add a vehicle first',
    'Chưa nhập đơn vị bảo hiểm':'Insurance provider not entered','Chưa có thông tin bảo hiểm TNDS. Hãy nhập khoản bảo hiểm cho xe.':'No liability insurance information. Add an insurance expense for the vehicle.',
    'Chưa có thông tin đăng kiểm hoặc phí đường bộ. Hãy nhập khoản chi tương ứng cho xe.':'No inspection or road-use fee information. Add the corresponding expense.',
    'Chưa có chu kỳ bảo dưỡng. Hãy nhập chi phí bảo dưỡng kèm chu kỳ km và số tháng.':'No maintenance schedule. Add a maintenance expense with distance and time intervals.',
    'Chưa có xe để hiển thị':'No vehicles to display','Chưa có chi phí. Hãy ghi khoản đầu tiên.':'No expenses yet. Add the first expense.',
    'Chưa có xe. Hãy thêm chiếc xe đầu tiên.':'No vehicles yet. Add your first vehicle.','Chưa có xe để lập báo cáo. Hãy thêm xe và nhập chi phí trước.':'No vehicles available for reports. Add a vehicle and its expenses first.',
    'Xe này chưa có dữ liệu chi phí':'This vehicle has no expense data','Không tìm thấy dữ liệu':'No data found','Ô tô':'Vehicle','Bảo hiểm':'Insurance',
    'Đơn vị bảo hiểm':'Insurance provider','Số giấy chứng nhận':'Certificate number','Đơn vị đăng kiểm':'Inspection centre','Số tem/giấy đăng kiểm':'Inspection certificate number',
    'Đơn vị thu phí':'Fee collection agency','Số biên lai/tem phí':'Receipt/sticker number','Số hợp đồng/chứng nhận':'Policy/certificate number'
    ,'Dữ liệu nằm trong ứng dụng và có thể đồng bộ Google Drive':'Data is stored in the app and can be synced with Google Drive'
    ,'Nhấn nút bên dưới và chọn tài khoản Google. Sau lần đầu cấp quyền, ứng dụng sẽ tự đồng bộ ngay sau mỗi thay đổi.':'Select the button below and choose a Google account. After the initial authorization, the app will sync automatically after every change.'
    ,'Ứng dụng đã được cấu hình sẵn. Chỉ cần nhấn nút bên dưới và chọn tài khoản Google; không phải nhập OAuth Client ID.':'The app is preconfigured. Select the button below and choose a Google account; no OAuth Client ID is required.'
    ,'Tổng chi tháng này':'Total expenses this month','Xăng / Sạc / Thuê pin':'Fuel / Charging / Battery rental'
    ,'Mức tiêu hao giữa hai lần đổ xăng':'Fuel consumption between refuels','Toàn thời gian:':'All time:'
    ,'ODO giữa các kỳ Sạc xe / Thuê pin':'Odometer between charging / battery rental entries'
    ,'Mỗi loại được so với kỳ trước gần nhất của chính loại đó để không cộng trùng quãng đường.':'Each type is compared with its own previous entry to avoid counting the same distance twice.'
    ,'chưa đủ dữ liệu':'insufficient data','Chưa nhập năm sản xuất':'Model year not entered'
    ,'Dữ liệu được lưu trong tệp':'Data is stored in the file'
    ,'ở vùng riêng. Tệp đính kèm do ứng dụng tạo nằm trong thư mục':'in private app storage. Attachments created by the app are stored in the'
    ,'trên Google Drive của người dùng.':'folder in the user’s Google Drive.'
    ,'Đã tải dữ liệu từ Google Drive':'Data loaded from Google Drive','Đã nhận dữ liệu từ Google Drive':'Data received from Google Drive'
    ,'Đã đồng bộ Google Drive':'Google Drive synced','Đã tự động đồng bộ Google Drive':'Google Drive synced automatically'
    ,'Đang kết nối Google Drive…':'Connecting to Google Drive…','Đang tự động đồng bộ…':'Syncing automatically…','Đang đồng bộ…':'Syncing…'
    ,'Đã kết nối · đang đồng bộ…':'Connected · syncing…','Có thay đổi mới · đang đồng bộ tiếp':'New changes · continuing sync'
    ,'Chưa kết nối Drive':'Drive not connected','Đã ngắt kết nối Drive':'Drive disconnected','Đồng bộ thất bại':'Sync failed'
    ,'Dữ liệu vẫn được lưu trên điện thoại':'Data remains stored on this phone','Không đọc được dữ liệu Drive':'Could not read Drive data'
    ,'Đã lưu trên điện thoại · Drive chưa sẵn sàng':'Saved on phone · Drive is not ready','Phiên bản này chưa hỗ trợ đồng bộ Drive':'This version does not support Drive sync'
    ,'Bao gồm dữ liệu JSON và các tệp trong thư mục Sổ xe. Cần kết nối Google Drive.':'Includes JSON data and files in the Sổ xe folder. Google Drive connection required.'
    ,'Ảnh, PDF, Word, Excel và các tệp thông dụng; tối đa 15 MB mỗi tệp. Tệp được lưu trong thư mục “Sổ xe” trên Google Drive.':'Images, PDF, Word, Excel and common file types; up to 15 MB each. Files are stored in the “Sổ xe” folder on Google Drive.'
  };

  Object.assign(EN, {
    'Xuất dữ liệu Excel':'Export to Excel','Lọc giao dịch hoặc xuất các bảng tổng hợp đang hiển thị.':'Filter transactions or export the displayed summary tables.',
    'Loại chi phí':'Expense type','Từ ngày':'From date','Đến ngày':'To date','Xuất giao dịch Excel':'Export transactions to Excel','Xuất báo cáo hiển thị Excel':'Export displayed reports to Excel',
    'Bộ lọc áp dụng cho file giao dịch. File gồm ngày, xe, loại chi phí, nội dung, ODO, số lượng và thành tiền.':'Filters apply to the transaction file. It includes date, vehicle, expense type, description, odometer, quantity and amount.',
    'Giao dịch':'Transactions','Tổng hợp tháng':'Monthly summary','Tiêu hao nhiên liệu':'Fuel consumption','ODO sạc và thuê pin':'Charging and battery rental odometer',
    'ODO trước':'Previous odometer','ODO sau':'Next odometer','Số chứng nhận / biên lai':'Certificate / receipt number','Số tệp đính kèm':'Attachment count',
    'Số lượng / kỳ hạn':'Quantity / expiry','Đơn vị':'Provider','Đã tạo file Excel giao dịch':'Transaction Excel file created','Đã tạo file Excel báo cáo':'Report Excel file created',
    'Không có giao dịch phù hợp để xuất':'No matching transactions to export','Không có xe phù hợp để xuất báo cáo':'No matching vehicles to export',
    'Từ ngày phải nhập đúng dạng dd/mm/yyyy.':'From date must use dd/mm/yyyy format.','Đến ngày phải nhập đúng dạng dd/mm/yyyy.':'To date must use dd/mm/yyyy format.',
    'Từ ngày không được sau Đến ngày.':'From date cannot be later than To date.','Đã lưu file Excel':'Excel file saved','Chưa lưu file Excel':'Excel file was not saved',
    '← Quay lại Sổ Xe':'← Back to Sổ Xe','Biểu tượng Sổ Xe':'Sổ Xe icon',
    'Mở thư mục đã giải nén, chạy':'Open the extracted folder and run',
    'Nếu ứng dụng báo phiên bản cũ đang chạy, đóng':'If the app reports that an older version is running, close',
    'trong Task Manager rồi mở lại. Nên đồng bộ Google Drive trước khi cập nhật.':'in Task Manager, then reopen the app. Sync Google Drive before updating.',
    'Nên đồng bộ Google Drive hoặc tạo bản sao lưu đầy đủ trước khi cập nhật. Nếu không tải được, mở':'Sync Google Drive or create a complete backup before updating. If the download fails, open the',
    'trang phát hành dự phòng':'fallback release page','Tải tệp cài Sổ Xe cho iPhone / iPad (.mobileconfig)':'Download Sổ Xe for iPhone / iPad (.mobileconfig)',
    'Vào':'Go to','Cài đặt → Đã tải về hồ sơ → Cài đặt':'Settings → Profile Downloaded → Install',
    'Tệp này chỉ cài biểu tượng ứng dụng web, không phải tệp IPA native; không cần tài khoản Apple Developer. Nếu muốn cài không qua hồ sơ, hãy':'This installs a web app icon, not a native IPA; no Apple Developer account is required. To install without a profile,',
    'mở Sổ Xe bằng Safari':'open Sổ Xe in Safari','rồi chọn Chia sẻ → Thêm vào Màn hình chính.':'then select Share → Add to Home Screen.',
    'Sau khi cài, hãy kết nối đúng tài khoản Google trong Sổ Xe. Chờ trạng thái “Đã đồng bộ Google Drive” trước khi đóng ứng dụng.':'After installation, connect the correct Google account in Sổ Xe. Wait for “Google Drive synced” before closing the app.',
    'Có thay đổi chưa đồng bộ':'Unsynced changes','Đã lưu ngoại tuyến · chờ có mạng':'Saved offline · waiting for connection',
    'Đã lưu trên máy. Sẽ tự đồng bộ khi có mạng':'Saved locally · will sync when online','Đã lưu trên máy · đang kết nối Drive':'Saved locally · connecting to Drive',
    'Đã lưu trên máy · chưa kết nối Drive':'Saved locally · Drive not connected','Đã lưu trên máy. Hãy kết nối Google Drive một lần':'Saved locally · connect Google Drive once to enable sync',
    '⚡ Xe điện':'⚡ Electric','⚡⛽ Xe Điện-Xăng':'⚡⛽ Hybrid','⛽ Xe xăng/dầu':'⛽ Petrol/Diesel','Xe chưa có ODO tham chiếu.':'No reference odometer is available.',
    'Tất cả xe':'All vehicles','VD: Trung tâm đăng kiểm':'e.g. Inspection centre','VD: Đơn vị thu phí':'e.g. Fee collection agency','VD: Bảo Việt':'e.g. Insurance provider',
    'Cần kết nối Internet để tải tệp đính kèm lên Google Drive. Giao dịch chưa được lưu.':'Internet connection is required to upload attachments to Google Drive. The transaction has not been saved.',
    'Hãy vào Cài đặt, kết nối Google Drive và chờ đồng bộ xong trước khi đính kèm tệp.':'Open Settings, connect Google Drive and wait for sync to finish before attaching files.',
    'Hãy kết nối Google Drive trước khi đính kèm tệp.':'Connect Google Drive before attaching files.','Đã lưu tệp đính kèm lên Google Drive':'Attachment saved to Google Drive',
    'Không tải được tệp đính kèm':'Could not upload attachment','Không đọc được thông tin tệp từ Google Drive':'Could not read file information from Google Drive',
    'Chưa kết nối Google Drive':'Google Drive not connected','Đã xóa tệp đính kèm trên Google Drive':'Attachment deleted from Google Drive','Không xóa được tệp đính kèm':'Could not delete attachment',
    'Cần ít nhất hai lần đổ xăng có ODO và số lít':'At least two refuels with odometer and litre values are required',
    'Cần ít nhất hai kỳ cùng loại Sạc xe hoặc Thuê pin có ODO':'At least two entries of the same Charging or Battery rental type with odometer values are required',
    'Lưu chi phí':'Save expense','Thêm xe':'Add vehicle','Đang xóa tệp trên Google Drive, hãy chờ hoàn tất':'Deleting file from Google Drive; please wait',
    'Ngày giao dịch':'Transaction date','Ngày hiệu lực':'Effective date','Ngày hết hạn':'Expiry date','Xe điện không sử dụng loại chi phí Đổ xăng.':'Electric vehicles cannot use the Refueling expense type.',
    'Phần trăm pin sau khi sạc phải lớn hơn phần trăm pin trước khi sạc và nằm trong khoảng 0–100%.':'Battery percentage after charging must be greater than before charging and within 0–100%.',
    'Đã cập nhật giao dịch':'Transaction updated','Đã lưu chi phí':'Expense saved','Đã cập nhật xe và ODO':'Vehicle and odometer updated','Đã thêm xe':'Vehicle added',
    'Sửa giao dịch':'Edit transaction','Cập nhật giao dịch':'Update transaction','Sửa thông tin xe':'Edit vehicle','Cập nhật xe':'Update vehicle','Xóa khoản chi này?':'Delete this expense?',
    'Đã xóa giao dịch và tệp đính kèm · đang đồng bộ Drive':'Transaction and attachments deleted · syncing Drive','Đã xóa giao dịch · đang đồng bộ Drive':'Transaction deleted · syncing Drive',
    'Không xóa được giao dịch trên Drive':'Could not delete transaction from Drive','Đã xóa xe và dữ liệu liên quan':'Vehicle and related data deleted','Không xóa được xe trên Drive':'Could not delete vehicle from Drive',
    'Cần kết nối Internet để sao lưu ảnh từ Drive.':'Internet connection is required to back up Drive files.','Hãy kết nối Google Drive trước khi sao lưu ảnh.':'Connect Google Drive before backing up files.',
    'Không tạo được bản sao lưu':'Could not create backup','Thay dữ liệu hiện tại bằng tệp đã chọn?':'Replace current data with the selected file?','Đã nhập dữ liệu':'Data imported','Tệp dữ liệu không hợp lệ':'Invalid data file',
    'Phiên Google đã hết hạn':'Google session expired','Không đọc được Google Drive':'Could not read Google Drive','Không tải được dữ liệu':'Could not download data','Không lưu được dữ liệu':'Could not save data',
    'Không tìm được thư mục Sổ xe trên Google Drive':'Could not find the Sổ xe folder on Google Drive','Không tạo được thư mục Sổ xe trên Google Drive':'Could not create the Sổ xe folder on Google Drive',
    'Không đọc được thư mục Sổ xe trên Drive':'Could not read the Sổ xe folder on Drive','Không liệt kê được tệp trong thư mục Sổ xe':'Could not list files in the Sổ xe folder',
    'Đã nhận dữ liệu an toàn từ Drive':'Data safely received from Drive','Phiên Google hết hạn · đang kết nối lại':'Google session expired · reconnecting',
    'Đồng bộ thất bại · dữ liệu vẫn ở trên máy':'Sync failed · data remains on this device','Đang ngoại tuyến · chưa thể kết nối Drive':'Offline · unable to connect to Drive',
    'Hãy kết nối Internet rồi thử lại':'Connect to the Internet and try again','Đang chờ dịch vụ Google…':'Waiting for Google services…','Dịch vụ đăng nhập Google chưa sẵn sàng':'Google sign-in service is not ready',
    'Không thể đăng nhập Google':'Could not sign in to Google','Đã lưu trên máy · cần kết nối lại':'Saved locally · reconnection required'
  });

  const DYNAMIC_PATTERNS = [
    [/⚠ ĐÃ HẾT HẠN (\d+) ngày/g, '⚠ EXPIRED $1 days ago'],
    [/⚠ HẾT HẠN HÔM NAY/g, '⚠ EXPIRES TODAY'],
    [/⚠ SẮP HẾT HẠN — còn (\d+) ngày/g, '⚠ EXPIRING SOON — $1 days remaining'],
    [/Còn hiệu lực — còn (\d+) ngày/g, 'Valid — $1 days remaining'],
    [/CẢNH BÁO CÁC HẠN TRONG 5 NGÀY/g, 'DEADLINES WITHIN 5 DAYS'],
    [/Đã tải dữ liệu từ Google Drive/g, 'Data loaded from Google Drive'],
    [/Đã đồng bộ Google Drive/g, 'Google Drive synced'],
    [/Đã tự động đồng bộ Google Drive/g, 'Google Drive synced automatically'],
    [/Đang tự động đồng bộ…/g, 'Syncing automatically…'],
    [/Đang đồng bộ…/g, 'Syncing…'],
    [/Đã kết nối · đang đồng bộ…/g, 'Connected · syncing…'],
    [/Có thay đổi mới · đang đồng bộ tiếp/g, 'New changes · continuing sync'],
    [/Chưa kết nối Drive/g, 'Drive not connected'],
    [/Tổng chi tháng này/g, 'Total expenses this month'],
    [/Xăng \/ Sạc \/ Thuê pin/g, 'Fuel / Charging / Battery rental'],
    [/Mức tiêu hao giữa hai lần đổ xăng/g, 'Fuel consumption between refuels'],
    [/Toàn thời gian:/g, 'All time:'],
    [/ODO giữa các kỳ Sạc xe \/ Thuê pin/g, 'Odometer between charging / battery rental entries'],
    [/Mỗi loại được so với kỳ trước gần nhất của chính loại đó để không cộng trùng quãng đường\./g, 'Each type is compared with its own previous entry to avoid counting the same distance twice.'],
    [/Tổng cộng chi phí các xe/g, 'Total vehicle expenses'],
    [/Dữ liệu nằm trong ứng dụng và có thể đồng bộ Google Drive/g, 'Data is stored in the app and can be synced with Google Drive'],
    [/Nhấn nút bên dưới và chọn tài khoản Google\. Sau lần đầu cấp quyền, ứng dụng sẽ tự đồng bộ ngay sau mỗi thay đổi\./g, 'Select the button below and choose a Google account. After the initial authorization, the app will sync automatically after every change.'],
    [/1 lần sạc/g, '1 charging session'], [/1 kỳ thuê pin/g, '1 battery rental period'], [/1 lần/g, '1 entry'],
    [/Xăng:/g, 'Fuel:'], [/Sạc:/g, 'Charging:'], [/Thuê pin:/g, 'Battery rental:'],
    [/Đang tải tệp /g, 'Downloading file '], [/Không tải được tệp /g, 'Could not download file '], [/Đang đóng gói /g, 'Packaging '],
    [/Đã tải bản sao lưu: JSON và /g, 'Backup downloaded: JSON and '], [/ tệp từ Drive/g, ' files from Drive'],
    [/Tệp (.+) lớn hơn 15 MB\./g, 'File $1 exceeds 15 MB.'], [/ · đang tải tệp/g, ' · uploading files'], [/ · đang đồng bộ Drive/g, ' · syncing Drive'],
    [/Xe có biển số:/g, 'License plate:'],
    [/Kỳ bảo dưỡng tiếp theo/g, 'Next maintenance'],
    [/ở ODO/g, 'at odometer'],
    [/Nội dung:/g, 'Description:'],
    [/ — đến ngày /g, ' — until '],
    [/đã đến\/vượt ODO/g, 'odometer reached/exceeded'],
    [/đã vượt ([\d.,]+) km/g, 'exceeded by $1 km'],
    [/còn ([\d.,]+) km/g, '$1 km remaining'],
    [/quá (\d+) ngày/g, '$1 days overdue'],
    [/còn (\d+) ngày/g, '$1 days remaining'],
    [/đến ngày /g, 'due on '],
    [/\(hạn /g, '(expires '],
    [/ hoặc /g, ' or '],
    [/ \(tùy ĐK nào đến trước\)/g, ' (whichever comes first)'],
    [/Bảo hiểm TNDS/g, 'Liability insurance'],
    [/Bảo dưỡng/g, 'Maintenance'],
    [/Đăng kiểm/g, 'Vehicle inspection'],
    [/Phí đường bộ/g, 'Road-use fee'],
    [/Đổ xăng/g, 'Refueling'],
    [/Sạc xe/g, 'Charging'],
    [/Thuê pin/g, 'Battery rental'],
    [/Phụ tùng/g, 'Parts'],
    [/Chi phí khác/g, 'Other expense'],
    [/Số: /g, 'No.: '],
    [/Chưa nhập /g, 'Not entered: '],
    [/ ngày/g, ' days'],
    [/ tháng/g, ' months'],
    [/ lít/g, ' litres'],
    [/ lần sạc/g, ' charging sessions'],
    [/ kỳ thuê pin/g, ' battery rental periods'],
    [/ lần/g, ' entries'],
    [/TỔNG XE /g, 'VEHICLE TOTAL '],
    [/Tháng (\d{1,2}\/\d{4})/g, 'Month $1'],
    [/từ (\d{2}\/\d{2}\/\d{4}) đến (\d{2}\/\d{2}\/\d{4})/g, 'from $1 to $2'],
    [/ngày (\d{2}\/\d{2}\/\d{4})/g, 'date $1'],
    [/tiếp theo /g, 'next ']
  ];

  let language = localStorage.getItem(STORAGE_KEY) || 'vi';
  const textState = new WeakMap();
  const attrState = new WeakMap();
  let applying = false;

  function translate(value) {
    if (language !== 'en' || typeof value !== 'string') return value;
    const lead = value.match(/^\s*/)[0], tail = value.match(/\s*$/)[0];
    const body = value.slice(lead.length, value.length - tail.length);
    if (EN[body]) return lead + EN[body] + tail;
    const patterns = [
      [/^Tất cả xe$/, 'All vehicles'], [/^Không có dữ liệu$/, 'No data'], [/^Chưa có giao dịch$/, 'No transactions yet'],
      [/^Đã lưu xe$/, 'Vehicle saved'], [/^Đã lưu giao dịch$/, 'Transaction saved'], [/^Đã xóa xe$/, 'Vehicle deleted'], [/^Đã xóa giao dịch$/, 'Transaction deleted'],
      [/^Đang đồng bộ\.\.\.$/, 'Syncing...'], [/^Đã đồng bộ Google Drive$/, 'Google Drive synced'], [/^Có lỗi xảy ra$/, 'Something went wrong'],
      [/^Xóa giao dịch này\?$/, 'Delete this transaction?'], [/^Xóa xe này và toàn bộ dữ liệu liên quan\?$/, 'Delete this vehicle and all related data?'],
      [/^Tải Windows Portable ([\d.]+) \(\.zip\)$/, 'Download Windows Portable $1 (.zip)'], [/^Tải Sổ Xe Android ([\d.]+)$/, 'Download Sổ Xe Android $1']
    ];
    for (const [re, replacement] of patterns) if (re.test(body)) return lead + body.replace(re, replacement) + tail;
    let translated = body;
    DYNAMIC_PATTERNS.forEach(([re, replacement]) => { translated = translated.replace(re, replacement); });
    return lead + translated + tail;
  }

  function translateText(node) {
    let state = textState.get(node);
    if (!state || node.data !== state.applied) state = { original: node.data, applied: node.data };
    const next = translate(state.original);
    state.applied = next;
    textState.set(node, state);
    if (node.data !== next) node.data = next;
  }

  function translateAttrs(element) {
    const names = ['placeholder','title','aria-label'];
    let states = attrState.get(element) || {};
    names.forEach(name => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name);
      let state = states[name];
      if (!state || current !== state.applied) state = { original: current, applied: current };
      const next = translate(state.original);
      state.applied = next;
      states[name] = state;
      if (current !== next) element.setAttribute(name, next);
    });
    attrState.set(element, states);
  }

  function apply(root = document.body) {
    if (!root || applying) return;
    applying = true;
    const visit = node => {
      if (node.nodeType === Node.TEXT_NODE) return translateText(node);
      if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT','STYLE','CODE'].includes(node.tagName) || node.hasAttribute('data-i18n-skip')) return;
      translateAttrs(node);
      node.childNodes.forEach(visit);
    };
    visit(root);
    document.documentElement.lang = language;
    if (ORIGINAL_TITLE) document.title = language === 'en' ? translate(ORIGINAL_TITLE) : ORIGINAL_TITLE;
    const select = document.getElementById('languageSelect');
    if (select && select.value !== language) select.value = language;
    applying = false;
  }

  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'vi';
    localStorage.setItem(STORAGE_KEY, language);
    apply(document.body);
    window.dispatchEvent(new CustomEvent('soxe-language-change', { detail: { language } }));
  }

  function init() {
    apply(document.body);
    const select = document.getElementById('languageSelect');
    if (select) select.addEventListener('change', () => setLanguage(select.value));
    document.querySelectorAll('[data-language-choice]').forEach(button => button.addEventListener('click', () => {
      setLanguage(button.dataset.languageChoice);
      document.getElementById('languageModal')?.close();
    }));
    const modal = document.getElementById('languageModal');
    if (modal && !localStorage.getItem(STORAGE_KEY)) modal.showModal();
    new MutationObserver(records => {
      if (applying) return;
      records.forEach(record => {
        if (record.type === 'characterData') translateText(record.target);
        record.addedNodes.forEach(node => apply(node));
      });
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  window.alert = message => nativeAlert(translate(String(message)));
  window.confirm = message => nativeConfirm(translate(String(message)));
  window.SoXeI18n = { setLanguage, getLanguage: () => language, translate, locale: () => language === 'en' ? 'en-US' : 'vi-VN', apply };
  window.tr = translate;
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
