from datetime import datetime, timezone

from pymongo import ASCENDING

from app.db.database import db


audit_logs_collection = db["audit_logs"]


audit_logs_collection.create_index(
    [("created_at", ASCENDING)]
)


audit_logs_collection.create_index(
    [("actor_user_id", ASCENDING)]
)


def create_audit_log(
    actor_user_id: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    ip_address: str | None = None,
):
    audit_log_data = {
        "actor_user_id": actor_user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "ip_address": ip_address,
        "created_at": datetime.now(timezone.utc),
    }

    result = audit_logs_collection.insert_one(
        audit_log_data
    )

    return str(result.inserted_id)


def get_audit_logs():
    return list(
        audit_logs_collection.find().sort(
            "created_at",
            -1,
        )
    )


def get_audit_logs_by_actor(
    actor_user_id: str,
):
    return list(
        audit_logs_collection.find(
            {
                "actor_user_id": actor_user_id,
            }
        ).sort(
            "created_at",
            -1,
        )
    )