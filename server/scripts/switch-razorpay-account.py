"""Run privately as root on AWS AFTER migration 021 and compatible code activation.

No credentials are accepted in command-line arguments, printed, or sent to Git.
API validation only reads orders; it does not create orders, payments or refunds.
"""
import base64
import datetime
import getpass
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import tempfile
import urllib.request


def parse_env(content):
    values = {}
    for line in content.splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            values[key.strip()] = ' '.join(shlex.split(value, comments=True))
    return values


def render_env(content, updates, raw_values=None):
    raw_values = raw_values or {}
    def assignment(key, value):
        return f'{key}={raw_values[key]}' if key in raw_values else f'{key}="{value}"'
    remaining = dict(updates)
    lines = []
    for line in content.splitlines():
        key = line.split('=', 1)[0].strip() if '=' in line and not line.lstrip().startswith('#') else ''
        if key in updates:
            if key in remaining:
                lines.append(assignment(key, remaining.pop(key)))
        else:
            lines.append(line)
    lines.extend(assignment(key, value) for key, value in remaining.items())
    return '\n'.join(lines) + '\n'


def verify_keys(key_id, secret, label):
    auth = base64.b64encode(f'{key_id}:{secret}'.encode()).decode()
    request = urllib.request.Request('https://api.razorpay.com/v1/orders?count=1',
                                     headers={'Authorization': 'Basic ' + auth})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.load(response)
        if body.get('entity') != 'collection' or not isinstance(body.get('items'), list):
            raise ValueError('Unexpected API response')
    except Exception:
        raise SystemExit(f'{label} account validation failed. Nothing was changed; check the keys/network.') from None
    print(f'{label} account: read-only API validation passed.')


def main():
    if os.name != 'posix' or os.geteuid() != 0:
        raise SystemExit('Run this script with sudo on the AWS Ubuntu server.')
    import fcntl
    lock = open('/run/lock/rjif-razorpay-switch.lock', 'w')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit('Another account switch is running. Nothing changed.') from None
    env_path = Path('/etc/rjif/rjif.env')
    release = Path(__file__).resolve().parents[2]
    if Path('/srv/rjif/current').resolve() != release:
        raise SystemExit('Activate this compatible release before switching payment credentials.')
    original = env_path.read_text()
    old = parse_env(original)
    required = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']
    if any(not old.get(key) for key in required) or old.get('DB_NAME') != 'rjif_staging':
        raise SystemExit('Existing account/database configuration is incomplete or unexpected. Nothing changed.')
    if any(old.get(key.replace('RAZORPAY_', 'RAZORPAY_LEGACY_', 1)) for key in required):
        raise SystemExit('A previous account is already retained. Stop: do not overwrite its credentials.')
    print('Enter the NEW LIVE account values privately. Input is hidden.')
    key_id = getpass.getpass('New Live Key ID: ').strip()
    secret = getpass.getpass('New Live Key Secret: ').strip()
    webhook = getpass.getpass('New webhook secret: ').strip()
    confirm = getpass.getpass('Repeat new webhook secret: ').strip()
    if not re.fullmatch(r'rzp_live_[A-Za-z0-9]+', key_id) or key_id == old['RAZORPAY_KEY_ID']:
        raise SystemExit('Use a different Live Key ID from the new account. Nothing changed.')
    # These visible ASCII characters are safe in BOTH systemd EnvironmentFile
    # double quotes and the existing bash-source deployment workflow.
    safe = re.compile(r'[A-Za-z0-9._~!@#%^&*()+={}:/?,=\-]+')
    if not secret or not safe.fullmatch(secret) or not safe.fullmatch(webhook) or len(webhook) < 32:
        raise SystemExit('Use a nonempty API secret and a 32+ character webhook secret without spaces, quotes, backslashes, dollar signs or backticks. Nothing changed.')
    if webhook != confirm or webhook == old['RAZORPAY_WEBHOOK_SECRET']:
        raise SystemExit('Webhook secrets must match each other and differ from the old webhook secret. Nothing changed.')
    verify_keys(old['RAZORPAY_KEY_ID'], old['RAZORPAY_KEY_SECRET'], 'Existing')
    verify_keys(key_id, secret, 'New')
    if input('Type SWITCH to continue with backup and a brief service pause: ').strip() != 'SWITCH':
        raise SystemExit('Cancelled. Nothing changed.')
    if env_path.read_text() != original:
        raise SystemExit('Configuration changed during validation. Run the switch again. Nothing changed.')

    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')
    backups = Path('/var/backups/rjif')
    backups.mkdir(mode=0o700, parents=True, exist_ok=True)
    env_backup = env_path.with_name(f'rjif.env.before-account-switch-{timestamp}')
    shutil.copy2(env_path, env_backup)
    env_backup.chmod(0o600)
    sql_backup = backups / f'before-account-switch-{timestamp}.sql'
    fd = os.open(sql_backup, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as output:
        result = subprocess.run(['mysqldump', '--defaults-extra-file=/etc/mysql/debian.cnf',
                                 '--single-transaction', '--no-tablespaces', 'rjif_staging'],
                                stdout=output, stderr=subprocess.PIPE)
    if result.returncode:
        raise SystemExit('Database backup failed. Service and credentials are unchanged.')
    subprocess.run(['systemctl', 'stop', 'rjif.service'], check=True)
    bind_code = """
import mysql from 'mysql2/promise';
import {config} from './server/src/config.js';
const db=await mysql.createConnection(config.db);
try {
  await db.beginTransaction();
  const [[migration]]=await db.execute("SELECT id FROM schema_migrations WHERE id='021_razorpay_account_binding.sql'");
  if(!migration)throw new Error('Migration 021 is required');
  const [[unexpected]]=await db.execute('SELECT COUNT(*) AS total FROM commerce_orders WHERE razorpay_key_id IS NOT NULL AND razorpay_key_id<>?',[config.razorpay.keyId]);
  if(Number(unexpected.total))throw new Error('Previously bound account records need review');
  const [result]=await db.execute('UPDATE commerce_orders SET razorpay_key_id=? WHERE razorpay_key_id IS NULL',[config.razorpay.keyId]);
  await db.commit();
  console.log('Existing orders bound to their previous account:',result.affectedRows);
} catch(error) {await db.rollback();throw error;} finally {await db.end();}
"""
    result = subprocess.run(['runuser', '-u', 'rjif', '--', 'node', '--input-type=module', '-e', bind_code],
                            cwd=release, env={**os.environ, **old}, capture_output=True, text=True)
    if result.returncode:
        subprocess.run(['systemctl', 'start', 'rjif.service'], check=False)
        raise SystemExit('Account binding failed. Environment unchanged; old service start requested. Keep the backups and contact support.')
    print(result.stdout.strip())
    updates = {key.replace('RAZORPAY_', 'RAZORPAY_LEGACY_', 1): old[key] for key in required}
    # Preserve exact quoting/escaping of the original settings when retaining them.
    raw_legacy = {}
    for line in original.splitlines():
        if '=' in line:
            key, raw = line.split('=', 1)
            if key.strip() in required:
                raw_legacy[key.strip().replace('RAZORPAY_', 'RAZORPAY_LEGACY_', 1)] = raw
    updates.update(dict(zip(required, [key_id, secret, webhook])))
    stat = env_path.stat()
    fd, temp_name = tempfile.mkstemp(prefix='.rjif.env.', dir=env_path.parent)
    try:
        os.fchmod(fd, 0o640)
        os.fchown(fd, stat.st_uid, stat.st_gid)
        with os.fdopen(fd, 'w') as target:
            target.write(render_env(original, updates, raw_legacy))
            target.flush()
            os.fsync(target.fileno())
        os.replace(temp_name, env_path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)
    subprocess.run(['systemctl', 'start', 'rjif.service'], check=True)
    print('Account settings updated; old credentials retained. Service start requested.')
    print('Environment backup:', env_backup)
    print('Database backup:', sql_backup)
    print('Check readiness, enable the NEW account webhook, and keep the OLD webhook enabled.')
    print('Do not restore the old environment blindly after accepting payments on the new account.')


if __name__ == '__main__':
    main()
