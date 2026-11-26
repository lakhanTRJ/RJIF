"""Add Meta origins to the Forum HTTPS virtual host, retaining all other rules."""
from datetime import datetime, timezone
from pathlib import Path
import re
import shutil
import subprocess


def allow_meta(policy):
    additions = {
        'script-src': ['https://connect.facebook.net'],
        'connect-src': ['https://connect.facebook.net', 'https://www.facebook.com'],
        'img-src': ['https://www.facebook.com'],
    }
    directives = [part.strip().split() for part in policy.split(';') if part.strip()]
    for name, sources in additions.items():
        matches = [row for row in directives if row[0] == name]
        if len(matches) != 1:
            raise ValueError(f'Expected one {name} directive. Nothing changed.')
        for source in sources:
            if source not in matches[0]:
                matches[0].append(source)
    return '; '.join(' '.join(row) for row in directives)


def main():
    path = Path('/etc/apache2/sites-available/retailjewellerindiaforum.com.conf')
    original = path.read_text()
    hosts = list(re.finditer(r'<VirtualHost\s+\*:443>.*?</VirtualHost>', original, re.S))
    hosts = [host for host in hosts if re.search(
        r'^\s*ServerName\s+retailjewellerindiaforum\.com\s*$', host.group(), re.M)]
    if len(hosts) != 1:
        raise SystemExit('Expected one Forum HTTPS virtual host. Nothing changed.')
    host = hosts[0]
    pattern = re.compile(r'^(\s*Header\s+always\s+set\s+Content-Security-Policy\s+")([^"\r\n]+)("[^\r\n]*)$', re.M)
    headers = list(pattern.finditer(host.group()))
    if len(headers) != 1:
        raise SystemExit('Expected one Forum CSP header. Nothing changed.')
    header = headers[0]
    policy = allow_meta(header.group(2))
    updated_host = host.group()[:header.start(2)] + policy + host.group()[header.end(2):]
    updated = original[:host.start()] + updated_host + original[host.end():]
    backup = path.with_name(path.name + '.before-meta-pixel-' + datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S'))
    if updated != original:
        shutil.copy2(path, backup)
        path.write_text(updated)
    try:
        subprocess.run(['apache2ctl', 'configtest'], check=True)
        subprocess.run(['systemctl', 'reload', 'apache2'], check=True)
    except subprocess.CalledProcessError:
        path.write_text(original)
        subprocess.run(['apache2ctl', 'configtest'], check=True)
        subprocess.run(['systemctl', 'reload', 'apache2'], check=True)
        raise SystemExit('Apache update failed; previous Forum configuration restored.')
    print('Forum Meta Pixel policy enabled. Gemgold configuration was not modified.')
    if updated != original:
        print('Apache backup:', backup)


if __name__ == '__main__':
    main()
