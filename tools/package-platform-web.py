import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
output = root / f'docs/downloads/So-Xe-To-Chuc-Web-{version}.zip'
files = [p for p in (root / 'docs').rglob('*') if p.is_file() and p.suffix in ('.html', '.mjs', '.js', '.css', '.png', '.svg', '.webmanifest', '.mobileconfig', '.markdown')]
with ZipFile(output, 'w', ZIP_DEFLATED) as z:
    for p in sorted(files):
        z.write(p, p.relative_to(root / 'docs'))
    z.writestr('HUONG-DAN.txt', f'Sổ Xe Tổ Chức {version}. Bản đang chạy: https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/\nBản một Google cần triển khai apps-script-cloud và gắn URL /exec trong cloud-config.js. NSD dùng tài khoản app, không đăng nhập Google. Xem apps-script-cloud/DEPLOY.md trong repo. Bản hai Google được giữ ở legacy-two-google.html để sao lưu trước khi chuyển.\n')
print(output.name, output.stat().st_size)
