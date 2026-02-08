from django.contrib import admin

from .models import (
    Exam,
    Question,
    Result,
    StudentAnswer,
    StudentExamAttempt,
    UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "user_email", "role")
    list_editable = ("role",)
    list_select_related = ("user",)
    search_fields = ("user__username", "user__email")

    @admin.display(description="Email")
    def user_email(self, obj):
        return obj.user.email


admin.site.register(Exam)
admin.site.register(Question)
admin.site.register(StudentExamAttempt)
admin.site.register(StudentAnswer)
admin.site.register(Result)
