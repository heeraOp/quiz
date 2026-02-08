from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0002_negative_marking"),
    ]

    operations = [
        migrations.RenameField(
            model_name="exam",
            old_name="negative_marks_value",
            new_name="negative_marks",
        ),
        migrations.AlterField(
            model_name="exam",
            name="negative_marks",
            field=models.DecimalField(
                max_digits=6,
                decimal_places=2,
                default=0,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="result",
            name="total_marks",
            field=models.DecimalField(
                max_digits=8,
                decimal_places=2,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
        migrations.AlterField(
            model_name="result",
            name="obtained_marks",
            field=models.DecimalField(
                max_digits=8,
                decimal_places=2,
                validators=[django.core.validators.MinValueValidator(0)],
            ),
        ),
    ]
