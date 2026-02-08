from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    Exam,
    Question,
    Result,
    StudentAnswer,
    StudentExamAttempt,
    UserProfile,
    UserRole,
)
from .permissions import IsStudent, IsTeacher
from .serializers import (
    ExamSerializer,
    QuestionSerializer,
    QuestionStudentSerializer,
    ResultSerializer,
    LoginSerializer,
    SignupSerializer,
    StudentAnswerSerializer,
    StudentExamAttemptSerializer,
    UserProfileSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_token(_request):
    return Response({"detail": "CSRF cookie set"})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)  # return 400 on invalid input
    username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    login(request, user)
    profile, _ = UserProfile.objects.get_or_create(
        user=user, defaults={"role": UserRole.STUDENT}
    )
    return Response(UserProfileSerializer(profile).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)  # return 400 on invalid input
    user = serializer.save()
    profile, _ = UserProfile.objects.get_or_create(
        user=user, defaults={"role": UserRole.STUDENT}
    )
    if profile.role != UserRole.STUDENT:
        profile.role = UserRole.STUDENT
        profile.save(update_fields=["role"])

    login(request, user, backend="django.contrib.auth.backends.ModelBackend")
    return Response(
        {"success": True, "username": user.username, "role": profile.role},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"detail": "Logged out"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user, defaults={"role": UserRole.STUDENT}
    )
    return Response(UserProfileSerializer(profile).data)


@api_view(["GET", "POST"])
@permission_classes([IsTeacher])
def exams_view(request):
    if request.method == "GET":
        exams = (
            Exam.objects.filter(created_by=request.user)
            .annotate(question_count=Count("questions"))
            .order_by("-created_at")
        )
        serializer = ExamSerializer(exams, many=True)
        return Response(serializer.data)

    serializer = ExamSerializer(data=request.data)
    if serializer.is_valid():
        exam = serializer.save(created_by=request.user)
        data = ExamSerializer(exam).data
        return Response(data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsTeacher])
def exam_delete_view(request, exam_id: int):
    exam = get_object_or_404(Exam, id=exam_id)
    if exam.created_by != request.user:
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
    exam.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["PATCH"])
@permission_classes([IsTeacher])
def exam_status_view(request, exam_id: int):
    exam = get_object_or_404(Exam, id=exam_id, created_by=request.user)
    allowed_fields = {"is_active", "negative_marking_enabled", "negative_marks"}
    payload = {key: value for key, value in request.data.items() if key in allowed_fields}
    if not payload:
        return Response(
            {"detail": "No valid fields provided."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if exam.is_active and ("negative_marking_enabled" in payload or "negative_marks" in payload):
        return Response(
            {"detail": "Negative marking settings cannot be changed after activation."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer = ExamSerializer(exam, data=payload, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
@permission_classes([IsTeacher])
def exam_questions_view(request, exam_id: int):
    exam = get_object_or_404(Exam, id=exam_id, created_by=request.user)
    if request.method == "GET":
        questions = exam.questions.order_by("created_at")
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

    payload = request.data.copy()
    payload["exam"] = exam.id
    serializer = QuestionSerializer(data=payload)
    if serializer.is_valid():
        question = serializer.save()
        Exam.objects.filter(id=exam.id).update(
            total_marks=F("total_marks") + question.marks
        )
        return Response(
            QuestionSerializer(question).data, status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsTeacher])
def exam_results_view(request, exam_id: int):
    exam = get_object_or_404(Exam, id=exam_id, created_by=request.user)
    results = Result.objects.filter(attempt__exam=exam).select_related("attempt__student")
    serializer = ResultSerializer(results, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsStudent])
def join_exam_view(request):
    exam_code = request.data.get("exam_code")
    if not exam_code:
        return Response(
            {"detail": "Exam code is required"}, status=status.HTTP_400_BAD_REQUEST
        )
    try:
        exam = Exam.objects.get(exam_code=exam_code)
    except Exam.DoesNotExist:
        return Response(
            {"detail": "Invalid exam code."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not exam.is_active:
        return Response(
            {"detail": "Exam is inactive."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if StudentExamAttempt.objects.filter(exam=exam, student=request.user).exists():
        return Response(
            {"detail": "Already attempted."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    attempt = StudentExamAttempt.objects.create(exam=exam, student=request.user)
    serializer = StudentExamAttemptSerializer(attempt)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsStudent])
def attempt_questions_view(request, attempt_id: int):
    attempt = get_object_or_404(
        StudentExamAttempt, id=attempt_id, student=request.user
    )
    if attempt.submitted_at:
        return Response(
            {"detail": "This attempt is already submitted."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    questions = attempt.exam.questions.order_by("created_at")
    serializer = QuestionStudentSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsStudent])
def submit_attempt_view(request, attempt_id: int):
    attempt = get_object_or_404(
        StudentExamAttempt, id=attempt_id, student=request.user
    )
    if attempt.submitted_at:
        return Response(
            {"detail": "This attempt is already submitted."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    answers = request.data.get("answers", [])
    if not isinstance(answers, list):
        return Response(
            {"detail": "Answers must be a list."}, status=status.HTTP_400_BAD_REQUEST
        )

    questions = list(attempt.exam.questions.all())
    question_ids = {q.id for q in questions}
    serializer = StudentAnswerSerializer(data=answers, many=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    payload_ids = [item["question"].id for item in serializer.validated_data]
    payload_set = set(payload_ids)
    if len(payload_ids) != len(payload_set):
        return Response(
            {"detail": "Duplicate answers are not allowed."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not payload_set.issubset(question_ids):
        return Response(
            {"detail": "Answers must match exam questions."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Scoring: correct => +marks, wrong => -negative_marks if enabled, unattempted => 0.
    # Total marks are not reduced by negative deductions and obtained marks never go below 0.
    correct_map = {q.id: (q.correct_option, q.marks) for q in questions}
    obtained = Decimal("0")
    StudentAnswer.objects.filter(attempt=attempt).delete()
    answer_map = {
        item["question"].id: item["selected_option"] for item in serializer.validated_data
    }
    for question in questions:
        selected = answer_map.get(question.id)
        if not selected:
            continue
        StudentAnswer.objects.create(
            attempt=attempt,
            question_id=question.id,
            selected_option=selected,
        )
        correct_option, marks = correct_map[question.id]
        if selected == correct_option:
            obtained += Decimal(marks)
        elif attempt.exam.negative_marking_enabled:
            obtained -= attempt.exam.negative_marks

    total = Decimal(attempt.exam.total_marks)
    if obtained < 0:
        obtained = Decimal("0")
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["submitted_at"])

    result = Result.objects.create(
        attempt=attempt, total_marks=total, obtained_marks=obtained
    )

    return Response(ResultSerializer(result).data)


@api_view(["GET"])
@permission_classes([IsStudent])
def attempt_result_view(request, attempt_id: int):
    attempt = get_object_or_404(
        StudentExamAttempt, id=attempt_id, student=request.user
    )
    if not hasattr(attempt, "result"):
        return Response(
            {"detail": "Result not available."}, status=status.HTTP_404_NOT_FOUND
        )
    return Response(ResultSerializer(attempt.result).data)
