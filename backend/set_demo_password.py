import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    print("ERROR: SUPABASE_URL is missing from .env")
    raise SystemExit

if not SUPABASE_SERVICE_ROLE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from .env")
    raise SystemExit

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

USER_ID = "3884edc0-6b43-4c55-a1ac-73a3e3eba42e"
NEW_PASSWORD = "CareerPilot@123"

try:
    supabase.auth.admin.update_user_by_id(
        USER_ID,
        {
            "password": NEW_PASSWORD,
            "email_confirm": True
        }
    )

    print("SUCCESS: Demo password updated.")
    print("Email: student@careerpilot.ai")
    print("Password: CareerPilot@123")

except Exception as e:
    print("ERROR:", e)