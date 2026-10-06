"""Sign a CI-built APK with the private organization key; never log passwords."""
import argparse, os, subprocess
from pathlib import Path
p = argparse.ArgumentParser(description=__doc__)
for field in ['apk', 'keystore', 'password-file', 'apksigner-jar', 'output']:
    p.add_argument('--'+field, required=True, type=Path)
p.add_argument('--alias', default='soxeorganization')
a = p.parse_args()
for path in [a.apk, a.keystore, a.password_file, a.apksigner_jar]:
    if not path.is_file(): p.error('Missing input: '+str(path))
a.output.parent.mkdir(parents=True, exist_ok=True)
env = {**os.environ, 'SOXE_SIGNING_PASSWORD': a.password_file.read_text().strip()}
subprocess.run(['java', '-jar', str(a.apksigner_jar), 'sign', '--ks', str(a.keystore),
    '--ks-key-alias', a.alias, '--ks-pass', 'env:SOXE_SIGNING_PASSWORD',
    '--key-pass', 'env:SOXE_SIGNING_PASSWORD', '--out', str(a.output), str(a.apk)], env=env, check=True)
subprocess.run(['java', '-jar', str(a.apksigner_jar), 'verify', '--verbose', '--print-certs', str(a.output)], check=True)
