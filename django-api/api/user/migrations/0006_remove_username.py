from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api_user", "0005_merge_20251124_1031"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="username",
        ),
    ]
