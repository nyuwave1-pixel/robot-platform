"""CLI:  python -m engine <job>|daily|init   (run from unincore-engine/)"""
import json
import sys

from . import core
from .jobs import JOBS


def main(argv: list[str]) -> int:
    core.init_db()
    cmd = argv[1] if len(argv) > 1 else "daily"
    names = list(JOBS) if cmd == "daily" else [] if cmd == "init" else [cmd]
    bad = 0
    for n in names:
        if n not in JOBS:
            print(f"unknown job: {n}. jobs: {', '.join(JOBS)}")
            return 2
        j = core.run_job(n, JOBS[n])
        print(f"[{j.status:>18}] {n}: {json.dumps(j.result, ensure_ascii=False) if j.result else (j.error or '').splitlines()[0] if j.error else ''}")
        bad += j.status == "failed"
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
