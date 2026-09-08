import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, service_key)

user_id = "3884edc0-6b43-4c55-a1ac-73a3e3eba42e"

new_password = "CareerPilot@2026"

response = supabase.auth.admin.update_user_by_id(
    user_id,
    {
        "password": new_password
    }
)

print("Demo password reset successfully.")
print("Email: student@careerpilot.ai")
print("New password:", new_password)