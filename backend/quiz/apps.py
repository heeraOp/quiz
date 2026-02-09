from django.apps import AppConfig
from django.db import connection
import os


class QuizConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "quiz"

    def ready(self):
        # Import signals when app is ready (avoids app registry issues)
        from . import signals  # noqa: F401
        
        # Skip during migrations and management commands
        if self._skip_app_initialization():
            return
        
        # Auto-create superuser on startup (Render free tier)
        self._create_superuser()

    def _skip_app_initialization(self) -> bool:
        """Skip app initialization during migrations or when tables don't exist."""
        import sys
        
        # Skip if running migrations
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv:
            return True
        
        # Skip if running collectstatic
        if 'collectstatic' in sys.argv:
            return True
        
        # Skip if tables don't exist yet
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='auth_user'"
                )
                return cursor.fetchone() is None
        except Exception:
            return True

    def _create_superuser(self) -> None:
        """Create superuser if credentials are provided in environment."""
        try:
            from django.contrib.auth import get_user_model

            username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
            password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
            email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")

            if not username or not password:
                return

            User = get_user_model()
            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password,
                )
                print("✅ Superuser created")
        except Exception as e:
            print(f"⚠️ Superuser creation skipped: {e}")
