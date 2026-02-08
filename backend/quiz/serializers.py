from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import (
    Exam,
    Question,
    Result,
    StudentAnswer,
    StudentExamAttempt,
    UserProfile,
)


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")

    class Meta:
        model = UserProfile
        fields = ["username", "role"]


class ExamSerializer(serializers.ModelSerializer):
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "exam_code",
            "is_active",
            "negative_marking_enabled",
            "negative_marks",
            "total_marks",
            "created_at",
            "question_count",
        ]
        read_only_fields = ["id", "created_at", "question_count", "total_marks"]

    def validate(self, attrs):
        enabled = attrs.get(
            "negative_marking_enabled",
            self.instance.negative_marking_enabled if self.instance else False,
        )
        value = attrs.get(
            "negative_marks",
            self.instance.negative_marks if self.instance else Decimal("0"),
        )
        if value is None:
            value = Decimal("0")
        if value < 0:
            raise serializers.ValidationError(
                "negative_marks must be greater than or equal to 0."
            )
        if enabled and value <= 0:
            raise serializers.ValidationError(
                "negative_marks must be greater than 0 when negative marking is enabled."
            )
        if not enabled and (
            "negative_marks" in attrs or "negative_marking_enabled" in attrs
        ):
            attrs["negative_marks"] = Decimal("0")
        return attrs


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            "id",
            "exam",
            "question_text",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "option_e",
            "correct_option",
            "marks",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        option_e = attrs.get("option_e", "")
        correct = attrs.get("correct_option")
        if correct == Question.Choice.E and not option_e:
            raise serializers.ValidationError(
                "Option E must be provided if it is the correct answer."
            )
        return attrs


class QuestionStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            "id",
            "question_text",
            "option_a",
            "option_b",
            "option_c",
            "option_d",
            "option_e",
            "marks",
        ]


class StudentExamAttemptSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    exam_code = serializers.CharField(source="exam.exam_code", read_only=True)
    exam_negative_marking_enabled = serializers.BooleanField(
        source="exam.negative_marking_enabled", read_only=True
    )
    exam_negative_marks = serializers.DecimalField(
        source="exam.negative_marks",
        max_digits=6,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = StudentExamAttempt
        fields = [
            "id",
            "exam",
            "exam_title",
            "exam_code",
            "exam_negative_marking_enabled",
            "exam_negative_marks",
            "started_at",
            "submitted_at",
        ]
        read_only_fields = [
            "id",
            "exam_title",
            "exam_code",
            "exam_negative_marking_enabled",
            "exam_negative_marks",
            "started_at",
            "submitted_at",
        ]


class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = ["question", "selected_option"]


class ResultSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source="attempt.student.username", read_only=True)

    class Meta:
        model = Result
        fields = ["student_username", "total_marks", "obtained_marks", "graded_at"]
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        return value


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        User = get_user_model()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data):
        User = get_user_model()
        user = User(username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()
        return user
