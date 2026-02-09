from django.apps import AppConfig
import os


class QuizConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "quiz"

    def ready(self):
        # Auto-create superuser on startup (Render free tier)
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
            print("⚠️ Superuser creation skipped:", e)
