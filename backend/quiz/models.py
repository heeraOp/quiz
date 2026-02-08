from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class UserRole(models.TextChoices):
    TEACHER = "TEACHER", "Teacher"
    STUDENT = "STUDENT", "Student"


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    role = models.CharField(max_length=20, choices=UserRole.choices)

    def __str__(self) -> str:
        return f"{self.user.username} ({self.role})"


class Exam(models.Model):
    title = models.CharField(max_length=255)
    exam_code = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    negative_marking_enabled = models.BooleanField(default=False)
    negative_marks = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, validators=[MinValueValidator(0)]
    )
    total_marks = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="exams"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.title} ({self.exam_code})"


class Question(models.Model):
    class Choice(models.TextChoices):
        A = "A", "A"
        B = "B", "B"
        C = "C", "C"
        D = "D", "D"
        E = "E", "E"

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="questions")
    question_text = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    option_e = models.CharField(max_length=255, blank=True)
    correct_option = models.CharField(max_length=1, choices=Choice.choices)
    marks = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.exam.title}: {self.question_text[:40]}"


class StudentExamAttempt(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attempts"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["exam", "student"], name="unique_exam_attempt"
            )
        ]

    def __str__(self) -> str:
        return f"{self.exam.title} - {self.student.username}"


class StudentAnswer(models.Model):
    attempt = models.ForeignKey(
        StudentExamAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=1, choices=Question.Choice.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"], name="unique_answer_per_question"
            )
        ]


class Result(models.Model):
    attempt = models.OneToOneField(
        StudentExamAttempt, on_delete=models.CASCADE, related_name="result"
    )
    total_marks = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[MinValueValidator(0)]
    )
    obtained_marks = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[MinValueValidator(0)]
    )
    graded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.attempt.student.username} - {self.obtained_marks}/{self.total_marks}"
