from django.db import models


# Create your models here.
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.urls import reverse


class Printer(models.Model):
    """Принтер (Printer). """

    KITCHEN = 'K'
    CLIENT = 'C'

    CHECK_TYPE_CHOISE = (
        (KITCHEN, 'кухня'),
        (CLIENT, 'клиент')
    )

    name = models.CharField(max_length=50, verbose_name='название принтера')
    api_key = models.CharField(max_length=32, unique=True, verbose_name='ключ доступа к API')
    check_type = models.CharField(max_length=1, choices=CHECK_TYPE_CHOISE,
                                  verbose_name='тип чека который печатает принтер')
    # г. Уфа, ул. Ленина, д. 42
    # point_id = models.IntegerField(max_length=50, verbose_name='точка к которой привязан принтер')
    point_id = models.IntegerField(unique=True, verbose_name='точка к которой привязан принтер')

    def __str__(self):
        return self.name

class Check(models.Model):
    """Чек (Check). Информация о заказе для каждого чека хранится
     в JSON, нет необходимости делать отдельные модели."""

    KITCHEN = 'K'
    CLIENT = 'C'

    CHECK_TYPE_CHOISE = (
        (KITCHEN, 'кухня'),
        (CLIENT, 'клиент')
    )

    NEW = 'N'
    RENDERED = 'R'
    PRINTED = 'P'

    STATUS_CHOICES = (
        (NEW, 'новый'),
        (RENDERED, 'отображённый'),
        (PRINTED, 'напечатанный')
    )

    printer_id = models.ForeignKey(Printer, verbose_name='принтер', default=1, on_delete=models.CASCADE)
    # Нельзя использовать зарезервированное слово "type" в качестве переменной
    # check_type = models.CharField(max_length=1, choices=CHECK_TYPE_CHOISE, verbose_name='тип чека')
    type = models.CharField(max_length=1, choices=CHECK_TYPE_CHOISE, verbose_name='тип чека')
    order = models.JSONField(verbose_name='информация о заказе')
    status = models.CharField(max_length=1, choices=STATUS_CHOICES, verbose_name='статус чека')
    pdf_file = models.FileField(blank=True, verbose_name='ссылка на созданный PDF-файл')

    # def __str__(self):
    #     status_verbose_names = {'N': 'Новый',
    #                             'R': 'Отображённый',
    #                             'P': 'Напечатанный'
    #                             }
    #     check_type = {
    #         'K': 'Кухня',
    #         'C': 'Клиент'
    #     }
    #     return f'Статус чека: {status_verbose_names[self.status]}. Тип чека: {check_type[self.type]}'

