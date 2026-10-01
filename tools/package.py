from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
output = root / 'docs/downloads/so-xe-drive-web.zip'
with ZipFile(output, 'w', ZIP_DEFLATED) as bundle:
    for filename in ('Code.gs', 'Crypto.gs', 'Index.html', 'appsscript.json', 'DEPLOY.md', 'vendor/noble-ciphers-LICENSE', 'vendor/noble-hashes-LICENSE'):
        bundle.write(root / 'apps-script' / filename, 'so-xe-drive-web/' + filename)
print(output)
