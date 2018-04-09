# Тестовое задание для разработчика на python

У сети ресторанов доставки "ФорФар" есть множество точек, на которых готовятся заказы для клиентов.
Каждый клиент хочет вместе с заказом получить чек, содержащий детальную информацию о заказе.
Сотрудники кухни также хотят чек, чтобы в процессе готовки и упаковки заказа не забыть положить всё что нужно.
Наша задача помочь и тем и другим, написав сервис печатающий<sup>1</sup> оба типа чеков.

<sup>1</sup>На самом деле печатать будут принтеры на точке, а сервис будет генерировать для них PDF-файлы из HTML-шаблонов.



### Схема работы сервиса
![][arch_schema]
1. Сервис получает информацию о новом заказа, создаёт в БД чеки обоих типов, привязывает их к соответствующим принтерам 
для точки указанной в заказе и ставит асинхронные задачи на генерацию PDF-файлов для этих чеков. 
Если у точки нет ни одного принтера - возвращает ошибку. Если чеки для данного заказа созданы - возвращает ошибку.
2. Асинхронный воркер с помощью wkhtmltopdf конвертирует HTML-шаблон чека в PDF-файл, сохраняет его, обновляет статус 
чека на rendered, сохраняет ссылку на PDF-файл. Имя файла должно иметь следущий вид <ID заказа>_<тип чека>.pdf (123456_client.pdf).
Файлы должны хранится в папке media в корне проекта.
3. Принтер опрашивает сервис на наличие новых чеков. Запрос происходит по следующему пути: принтер отправляет свой ключ
API, если принтера с таким ключом не существует, сервис возвращает ошибку, иначе возвращает список чеков для этого принтера, 
у которых сгенерирован PDF-файл и статус rendered. После этого принтер запрашивает PDF-версии для каждого чека (этот запрос переводит
чек в статус printed, запрос HTML-версии чека не должен переводить чек в статус printed, эта версия нужна для дебага)



### Технические требования
1. Сервис должен быть написан на python3 на Django v1.11
2. База данных - PostgreSQL
3. Для асинхронных задач использовать RQ
4. Все инфраструктурные вещи необходимые для сервиса ([PostgreSQL], [Redis], [wkhtmltopdf]) и сам сервис должны разворачиваться 
с помощью docker-compose



### Примечания
1. Вёрстка HTML-шаблонов для чеков лежит в репозитории в папке templates
2. Для простоты работы с wkhtmltopdf стоит использовать docker-контейнер [wkhtmltopdf] 
3. Во время написания сервиса не стоит изобретать велосипеды, лучше взять что-то существующие



### Модели
1. Принтер (Printer). Каждый принтер печатает только свой тип чеков. Поле api_key принимает уникальные значения, по нему 
однозначно определяется принтер. Для этой модели должны быть fixtures (принтеры для обоих типов чеков для нескольких точек).

| Поле       | Тип    | Значение        | Описание                          |
|------------|--------|-----------------|-----------------------------------|
| name       | string |                 | название принтера                 |
| api_key    | string |                 | ключ доступа к API                |
| check_type | string | kitchen\|client | тип чека которые печатает принтер |
| point_id   | int    |                 | точка к которой привязан принтер  |

2. Чек (Check). Информаци о заказе для каждого чека хранится в JSON, нет необходимости делать отдельные модели.

| Поле       | Тип    | Значение               | Описание                     |
|------------|--------|------------------------|------------------------------|
| printer_id | int    |                        | принтер                      |
| type       | string | kitchen\|client        | тип чека                     |
| order      | JSON   |                        | информация о заказе          |
| status     | string | new\|rendered\|printed | статус чека                  |
| pdf_file   | URL    |                        | ссылка на созданный PDF-файл |



### Методы API
**1. Создание чеков**  
  _Создаёт чеки для переданного заказа._

* **URL**  
  _/create_checks_

* **Method:**  
  `POST`

* **Data Params**  
  **Required:**
  
  | Параметр | Тип   | Значение | Описание                             |
  |----------|-------|----------|--------------------------------------|
  | order    | Order |          |Заказ для которого нужно создать чеки |
  
  Order:
  
  | Поле     | Тип    | Значение | Описание                         |
  |----------|--------|----------|----------------------------------|
  | id       | int    |          | номер заказа                     |
  | items    | Item[] |          | список позиций заказа            |
  | price    | int    |          | стоимость заказа                 |
  | address  | string |          | адрес доставки                   |
  | client   | Client |          | информация о клиенте             |
  | point_id | int    |          | точка на которой готовится заказ |
  
  Item:
  
  | Поле       | Тип    | Значение | Описание        |
  |------------|--------|----------|-----------------|
  | name       | string |          | название        |
  | quantity   | int    |          | количество      |
  | unit_price | int    |          | цена за единицу |
  
  Client:
  
  | Поле       | Тип    | Значение | Описание       |
  |------------|--------|----------|----------------|
  | name       | string |          | имя клиента    |
  | phone      | string |          | номер телефона |

* **Success Response:**
  * **Code:** 200  
    **Content:** `{ ok : "Чеки успешно созданы" }`

* **Error Response:**
  * **Code:** 400 BAD REQUEST  
    **Content:** `{ error : "Для данного заказа уже созданы чеки" }`

  * **Code:** 400 BAD REQUEST  
    **Content:** `{ error : "Для данной точки не настроено ни одного принтера" }`

* **Sample Call:**  
  ```
  data = {
      'order': {
          'id': 123456,
          'price': 780,
          'items': [
              {
                  'name': 'Вкусная пицца',
                  'quantity': 2,
                  'unit_price': 250
              },
              {
                  'name': 'Не менее вкусный ролл',
                  'quantity': 1,
                  'unit_price': 280
              },
          ]
          'address': 'г. Уфа, ул. Ленина, д. 42'
          'client': {
              'name': 'Иван',
              'phone': '9173332222'
          }
          'point_id': 1,
      }
  }

  r = requests.post(SERVICE_URL + '/create_checks', json=data)
  ```

**2. Наличие новых чеков**  
  _Метод проверяющий наличие новых чеков._

* **URL**  
  _/new_checks_

* **Method:**  
  `GET`

* **URL Params**  
  **Required:**
  
  | Параметр      | Тип    | Значение | Описание             |
  |---------------|------- |----------|----------------------|
  | api_key       | string |          | ключ доступа к API   |
  
* **Success Response:**  
  * **Code:** 200  
    **Content:** 
    ```
    {
        checks: [
            {
                id: 1
                url: 'http://SERVICE_URL/check/?order_id=123456&type=client&format=pdf'
            }
        ]
    }
    ```

* **Error Response:**  
  * **Code:** 401 UNAUTHORIZED  
    **Content:** `{ error : "Ошибка авторизации" }`
    
* **Sample Call:**  
  ```python
  params = {
      'api_key': '1234qwer',
  }

  r = requests.post(SERVICE_URL + '/new_checks', params=params)
  ```

**3. Получение чека**  
  _Метод получения чека для заказа._

* **URL**  
  _/check_

* **Method:**  
  `GET`

* **URL Params**  
  **Required:**
  
  | Параметр | Тип    | Значение        | Описание             |
  |----------|------- |-----------------|----------------------|
  | order_id | int    |                 | ID заказа            |
  | type     | string | kitchen\|client | тип чека             |
  | format   | string | html\|pdf       | формат чека          |
  | api_key  | string |                 | ключ доступа к API   |
  
* **Success Response:**  
  * **Code:** 200  
    **Content:** HTML-файл или PDF-файл

* **Error Response:**  
  * **Code:** 401 UNAUTHORIZED  
    **Content:** `{ error : "Ошибка авторизации" }`

  * **Code:** 400 BAD REQUEST  
    **Content:** `{ error : "Для данного заказа нет чеков" }`
    
  * **Code:** 400 BAD REQUEST  
    **Content:** `{ error : "Для данного заказа не сгенерирован чек в формате PDF" }`

* **Sample Call:**  
  ```python
  params = {
      'order_id': 123456,
      'type': 'client',
      'format': 'pdf',
      'api_key': '1234qwer'
  }

  r = requests.post(SERVICE_URL + '/check', params=params)
  ```
 


[wkhtmltopdf]: https://hub.docker.com/r/openlabs/docker-wkhtmltopdf-aas/
[PostgreSQL]: https://hub.docker.com/_/postgres/
[Redis]: https://hub.docker.com/_/redis/

[arch_schema]: images/arch_schema.png
