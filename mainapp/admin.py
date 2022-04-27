from django.contrib import admin

# Register your models here.

from mainapp.models import Printer, Check

admin.site.register(Printer)
admin.site.register(Check)
