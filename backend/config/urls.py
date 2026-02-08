"""URL configuration for the backend project."""
from django.contrib import admin
from django.urls import path

from quiz import views as quiz_views
from .views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="api-health"),
    path("api/auth/csrf/", quiz_views.csrf_token, name="api-csrf"),
    path("api/auth/login/", quiz_views.login_view, name="api-login"),
    path("api/auth/signup/", quiz_views.signup_view, name="api-signup"),
    path("api/auth/logout/", quiz_views.logout_view, name="api-logout"),
    path("api/auth/me/", quiz_views.me_view, name="api-me"),
    path("api/exams/", quiz_views.exams_view, name="api-exams"),
    path("api/exams/<int:exam_id>/", quiz_views.exam_delete_view, name="api-exam-delete"),
    path(
        "api/exams/<int:exam_id>/status/",
        quiz_views.exam_status_view,
        name="api-exam-status",
    ),
    path(
        "api/exams/<int:exam_id>/questions/",
        quiz_views.exam_questions_view,
        name="api-exam-questions",
    ),
    path(
        "api/exams/<int:exam_id>/results/",
        quiz_views.exam_results_view,
        name="api-exam-results",
    ),
    path("api/exams/join/", quiz_views.join_exam_view, name="api-exam-join"),
    path(
        "api/attempts/<int:attempt_id>/questions/",
        quiz_views.attempt_questions_view,
        name="api-attempt-questions",
    ),
    path(
        "api/attempts/<int:attempt_id>/submit/",
        quiz_views.submit_attempt_view,
        name="api-attempt-submit",
    ),
    path(
        "api/attempts/<int:attempt_id>/result/",
        quiz_views.attempt_result_view,
        name="api-attempt-result",
    ),
]
