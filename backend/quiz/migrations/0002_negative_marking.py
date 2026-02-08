from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="exam",
            name="negative_marking_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="exam",
            name="negative_marks_value",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
