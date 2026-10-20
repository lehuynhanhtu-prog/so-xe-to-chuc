"""Package only deployable source and licenses, never clasp/OAuth state."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'package.json').read_text())['version']
target = root / 'docs' / 'downloads' / f'So-Xe-To-Chuc-Apps-Script-{version}-cloud.1.zip'
paths = [Path(n) for n in ['Code.gs', 'Core.gs', 'Crypto.gs', 'Index.html', 'appsscript.json', 'DEPLOY.md']]
paths += [Path('vendor') / f'noble-{p}-LICENSE' for p in ['ciphers', 'hashes']]
target.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for relative in paths:
        info = ZipInfo(relative.as_posix(), date_time=(2026, 10, 20, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        archive.writestr(info, (root / 'apps-script-cloud' / relative).read_bytes())
print(target.name, target.stat().st_size)
