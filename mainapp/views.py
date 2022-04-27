import json
import os

# Create your views here.
from django.views.generic import CreateView, ListView
from wkhtmltopdf.views import PDFTemplateResponse

from mainapp.models import Check

JSON_PATH = 'mainapp/json'


def load_from_json(file_name):
    """Функция загрузки json"""
    with open(os.path.join(JSON_PATH, file_name + '.json'), 'r', errors='ignore', encoding='utf-8') as infile:
        return json.load(infile)


class CreateChecksView(ListView):
    """Класс для создания чека"""
    model = Check
    template_name = 'mainapp/client_check.html'

    # form_class = EditForm

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        title = 'Чек для клиента'
        context['title'] = title
        # type = Check.object.filter(type=)
        info_orders = load_from_json('info_order')
        context['info_orders'] = info_orders
        check = Check()
        check.type = 'C'
        check.status = 'N'
        check.order = info_orders
        check.save()
        return context


# class PDFView(View):
#     filename = 'my_pdf.pdf'
#     template = 'mainapp/check_pdf.html'
#     context = {
#         'title': 'Печать чека'
#     }
#     order_id = 3000
#     check_type = 'C'
#     model = Check
#
#     def get(self, request):
#         self.context['check'] = self.get_object()
#         response = PDFTemplateResponse(request=request,
#                                        template=self.template,
#                                        filename=f"media/{self.order_id}_{self.check_type}.pdf",
#                                        context=self.context,
#                                        show_content_in_browser=False,
#                                        cmd_options={'margin-top': 50, },
#                                        )
#         return response
