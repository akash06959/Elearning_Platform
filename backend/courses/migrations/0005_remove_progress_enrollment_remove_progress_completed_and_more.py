# Generated by Django 5.1.7 on 2025-03-18 04:37

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0004_remove_category_slug_remove_course_slug'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='progress',
            name='enrollment',
        ),
        migrations.RemoveField(
            model_name='progress',
            name='completed',
        ),
        migrations.RemoveField(
            model_name='progress',
            name='last_accessed',
        ),
        migrations.DeleteModel(
            name='Enrollment',
        ),
    ]
