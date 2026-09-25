from fastapi import APIRouter, Depends, HTTPException, status

from app.models.audit_log import get_audit_logs
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get("/")
def list_audit_logs(
    current_user=Depends(get_current_user),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view activity logs",
        )

    logs = get_audit_logs()

    result = []

    for log in logs:
        result.append(
            {
                "id": str(log["_id"]),
                "actor_user_id": log.get("actor_user_id"),
                "action": log.get("action"),
                "entity_type": log.get("entity_type"),
                "entity_id": log.get("entity_id"),
                "ip_address": log.get("ip_address"),
                "created_at": log.get("created_at"),
            }
        )

    return {
        "logs": result,
    }