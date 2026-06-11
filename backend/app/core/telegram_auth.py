import hashlib
import hmac
import json
from urllib.parse import parse_qs

from app.core.config import settings


def validate_telegram_init_data(init_data: str) -> dict | None:
    """
    Validates Telegram WebApp initData using HMAC-SHA256.
    Returns parsed user data dict if valid, None otherwise.

    Algorithm (from Telegram docs):
    1. Parse the query string into key=value pairs
    2. Remove the 'hash' parameter
    3. Sort remaining params alphabetically
    4. Create data_check_string by joining with \\n
    5. secret_key = HMAC-SHA256(key="WebAppData", msg=bot_token)
    6. Verify HMAC-SHA256(key=secret_key, msg=data_check_string) == hash
    """
    try:
        parsed = parse_qs(init_data, keep_blank_values=True)
        # parse_qs returns lists, flatten to single values
        params = {k: v[0] for k, v in parsed.items()}

        received_hash = params.pop("hash", None)
        if not received_hash:
            return None

        # Sort and build data_check_string
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(params.items())
        )

        # Create secret key
        secret_key = hmac.new(
            b"WebAppData", settings.BOT_TOKEN.encode(), hashlib.sha256
        ).digest()

        # Compute hash
        computed_hash = hmac.new(
            secret_key, data_check_string.encode(), hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(computed_hash, received_hash):
            return None

        # Extract user data
        user_data = json.loads(params.get("user", "{}"))
        return user_data

    except Exception:
        return None
