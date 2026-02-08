from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from quiz.models import UserProfile, UserRole


class Command(BaseCommand):
    help = "Create a user with a role (TEACHER or STUDENT)."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("password")
        parser.add_argument("role", choices=[UserRole.TEACHER, UserRole.STUDENT])

    def handle(self, *args, **options):
        username = options["username"]
        password = options["password"]
        role = options["role"]
        user_model = get_user_model()

        if user_model.objects.filter(username=username).exists():
            raise CommandError("User already exists.")

        user = user_model.objects.create_user(username=username, password=password)
        UserProfile.objects.filter(user=user).update(role=role)
        self.stdout.write(self.style.SUCCESS(f"Created {role} user: {username}"))
