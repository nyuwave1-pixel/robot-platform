"""CLI:  python -m engine <job>|daily|init   (run from unincore-engine/)"""
import json
import sys

from . import core
from .jobs import JOBS


def main(argv: list[str]) -> int:
    core.init_db()
    from . import imports
    imports.restore_approvals()
    cmd = argv[1] if len(argv) > 1 else "daily"
    # Approval commands (state mirrored to data/approvals.json):
    #   propose <product_id> '<json change>' | approvals | approve <id>... | reject <id>...
    if cmd in ("propose", "approvals", "approve", "reject"):
        from sqlalchemy import select
        from .models import ApprovalRequest
        from .publish import validate
        if cmd == "propose":
            change = json.loads(argv[3])
            errs = validate(change) if not (imports.PROTECTED_FIELDS & set(change)) else []
            if errs:
                print("rejected:", "; ".join(errs))
                return 2
            print("filed approval #", imports.request_approval("site_seo", change, product_id=argv[2]))
        elif cmd in ("approve", "reject"):
            for i in argv[2:]:
                print(imports.decide(int(i), cmd == "approve", "owner-via-chat"))
        with core.session() as s:
            for a in s.scalars(select(ApprovalRequest).where(ApprovalRequest.status.in_(["pending", "approved"])).order_by(ApprovalRequest.id)):
                print(f"#{a.id} [{a.status}{' PROTECTED' if a.protected else ''}] {a.product_id}: {json.dumps(a.change, ensure_ascii=False)}")
        imports.dump_approvals()
        return 0
    names = list(JOBS) if cmd == "daily" else [] if cmd == "init" else [cmd]
    bad = 0
    for n in names:
        if n not in JOBS:
            print(f"unknown job: {n}. jobs: {', '.join(JOBS)}")
            return 2
        j = core.run_job(n, JOBS[n])
        print(f"[{j.status:>18}] {n}: {json.dumps(j.result, ensure_ascii=False) if j.result else (j.error or '').splitlines()[0] if j.error else ''}")
        bad += j.status == "failed"
    if names:
        imports.dump_approvals()
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
