"""
공개 Google Drive 폴더(Quaternius 배포 방식)의 파일 목록을 읽고 파일을 받는다. 로그인 없음.
    python3 tools/assets/gdrive.py ls FOLDER_ID
    python3 tools/assets/gdrive.py get FILE_ID OUT_PATH
받은 파일의 SHA-256 을 출력한다 (라이선스 대장에 기록).
"""
import hashlib, re, subprocess, sys


def fetch(url, out=None):
    cmd = ["curl", "-sL", "-m", "300", "--fail", url]
    if out:
        subprocess.run(cmd + ["-o", out], check=True)
        return None
    return subprocess.run(cmd, check=True, capture_output=True).stdout.decode("utf8", "ignore")


def ls(folder):
    html = fetch(f"https://drive.google.com/drive/folders/{folder}")
    rows = re.findall(r'\\x22([A-Za-z0-9_-]{25,45})\\x22,\\x5b\\x22' + re.escape(folder) + r'\\x22\\x5d,\\x22([^\\]+)\\x22', html)
    seen = []
    for fid, name in rows:
        if (fid, name) not in seen:
            seen.append((fid, name))
    return seen


def get(fid, out):
    fetch(f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t", out)
    h = hashlib.sha256(open(out, "rb").read()).hexdigest()
    print(f"{out}\t{h}")
    return h


if __name__ == "__main__":
    if sys.argv[1] == "ls":
        for fid, name in ls(sys.argv[2]):
            print(f"{fid}\t{name}")
    else:
        get(sys.argv[2], sys.argv[3])
