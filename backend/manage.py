#!/usr/bin/env python3
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    try:
        from django.core.management import execute_from_command_line
        import django

        # Setup Django
        django.setup()

        # --------------------------------------------------
        # Auto-create superuser (for Render free tier)
        # --------------------------------------------------
        from django.contrib.auth import get_user_model

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")

        if username and password:
            User = get_user_model()
            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                )
                print("✅ Superuser created successfully")

    except Exception as exc:
        # Never crash the app if superuser creation fails
        print("⚠️ Superuser creation skipped:", exc)

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
