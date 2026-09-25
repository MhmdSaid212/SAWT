from datetime import datetime, timezone

from pymongo import ASCENDING

from app.db.database import db

phonemes_collection = db["phonemes"]

phonemes_collection.create_index(
    [("symbol", ASCENDING), ("language", ASCENDING)],
    unique=True,
)


def create_phoneme(phoneme_data: dict):
    phoneme_data["created_at"] = datetime.now(timezone.utc)

    result = phonemes_collection.insert_one(phoneme_data)

    return str(result.inserted_id)


def get_phonemes():
    return list(
        phonemes_collection.find()
    )


def get_phoneme_by_id(phoneme_id: str):
    from bson import ObjectId

    try:
        return phonemes_collection.find_one(
            {"_id": ObjectId(phoneme_id)}
        )
    except Exception:
        return None




def update_phoneme(
    phoneme_id: str,
    phoneme_data: dict,
):
    from bson import ObjectId

    try:
        result = phonemes_collection.update_one(
            {"_id": ObjectId(phoneme_id)},
            {
                "$set": {
                    **phoneme_data,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        return result.matched_count > 0

    except Exception:
        return False




def delete_phoneme(phoneme_id: str):
    from bson import ObjectId

    try:
        result = phonemes_collection.delete_one(
            {"_id": ObjectId(phoneme_id)}
        )

        return result.deleted_count > 0

    except Exception:
        return False



def get_phoneme_by_symbol(symbol: str, language: str = "English"):
    return phonemes_collection.find_one(
        {
            "symbol": symbol,
            "language": language,
        }
    )