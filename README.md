# Test Task — Реестр плановых проверок

SPA + REST API приложение для ведения реестра плановых проверок.

Проект разделён на два независимых слоя:

- **Backend**: CodeIgniter 4 / PHP REST API
- **Frontend**: Angular SPA
- **Database**: PostgreSQL
- **Import / Export**: CSV / Excel-compatible формат
- **Production runtime**: Nginx + PHP-FPM

---

## Содержание

- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Требования](#требования)
- [Backend setup](#backend-setup)
- [Frontend setup](#frontend-setup)
- [Dev запуск](#dev-запуск)
- [Production build](#production-build)
- [Production deployment](#production-deployment)
- [Nginx + PHP-FPM](#nginx--php-fpm)
- [API endpoints](#api-endpoints)
- [Функционал](#функционал)
- [Import / Export](#import--export)
- [Troubleshooting](#troubleshooting)
- [Полезные команды](#полезные-команды)

---

## Архитектура

```text
project-root/
├── backend/                 # CodeIgniter 4 REST API
│   ├── app/
│   ├── public/              # public entrypoint: index.php
│   ├── writable/            # logs/cache/uploads
│   ├── spark
│   ├── composer.json
│   └── .env
│
├── frontend/                # Angular SPA
│   ├── src/
│   ├── dist/                # production build
│   ├── proxy.conf.json      # dev proxy for /api
│   ├── angular.json
│   └── package.json
│
└── README.md
```

---

## Технологический стек

| Layer | Technology |
|---|---|
| Backend | PHP, CodeIgniter 4 |
| Frontend | Angular, Bootstrap |
| Database | PostgreSQL |
| Web Server | Nginx |
| PHP Runtime | PHP-FPM |
| Package Managers | Composer, npm |
| Data Exchange | CSV / Excel-compatible files |

---

## Требования

Для локального запуска:

```text
PHP >= 8.1
Composer
Node.js >= 18
npm
PostgreSQL
Angular CLI
```

Для production:

```text
Nginx
PHP-FPM
PostgreSQL
Composer
Node.js / npm для сборки frontend
```

---

## Backend setup

Перейти в директорию backend:

```bash
cd backend
```

Установить PHP-зависимости:

```bash
composer install
```

Создать `.env`:

```bash
cp env .env
```

Настроить окружение:

```ini
CI_ENVIRONMENT = development

app.baseURL = 'http://localhost:8080/'

database.default.hostname = localhost
database.default.database = <db_name>
database.default.username = <db_user>
database.default.password = <db_password>
database.default.DBDriver = Postgre
database.default.port = 5432
```

> Не храните реальные пароли и доступы в репозитории.

Запустить миграции:

```bash
php spark migrate
```

Проверить доступные роуты:

```bash
php spark routes
```

---

## Frontend setup

Перейти в директорию frontend:

```bash
cd frontend
```

Установить зависимости:

```bash
npm install
```

Если Bootstrap не установлен:

```bash
npm install bootstrap
```

---

## Dev запуск

### Backend dev server

Для локальной разработки можно использовать встроенный dev-сервер CodeIgniter:

```bash
cd backend
php spark serve
```

Backend будет доступен по адресу:

```text
http://localhost:8080
```

API prefix:

```text
http://localhost:8080/api
```

> `php spark serve` используется только для разработки.  
> Для production нужно использовать Nginx + PHP-FPM.

---

### Frontend dev server

```bash
cd frontend
ng serve
```

Frontend будет доступен по адресу:

```text
http://localhost:4200
```

---

### Dev proxy

Для локальной разработки frontend проксирует API-запросы на backend.

Файл:

```text
frontend/proxy.conf.json
```

```json
{
  "/api": {
    "target": "http://127.0.0.1:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Запуск Angular с proxy:

```bash
ng serve --proxy-config proxy.conf.json
```

В этом режиме frontend обращается к API так:

```text
/api/inspections
/api/smes
```

А Angular CLI перенаправляет запросы на:

```text
http://127.0.0.1:8080
```

---

## Production build

Собрать frontend:

```bash
cd frontend
npm run build
```

После сборки Angular создаёт production bundle в директории:

```text
frontend/dist/frontend
```

В текущей конфигурации SPA index-файл может называться:

```text
frontend/dist/frontend/browser/index.csr.html
```

Проверить наличие index-файла:

```bash
find dist/frontend -name "index*"
```

Пример ожидаемого результата:

```text
dist/frontend/browser/index.csr.html
```

---

## Production deployment

Production-схема:

```text
Client Browser
     |
     v
Nginx :80 / :443
     |
     |-- /                 -> Angular static files
     |
     |-- /api/*            -> PHP-FPM -> CodeIgniter public/index.php
```

В production не нужно запускать:

```bash
php spark serve
```

В фоне должны работать системные сервисы:

```bash
systemctl status nginx
systemctl status php8.4-fpm
systemctl status postgresql
```

Включить автозапуск:

```bash
systemctl enable nginx
systemctl enable php8.4-fpm
systemctl enable postgresql
```

---

## Nginx + PHP-FPM

Пример production-конфига Nginx:

```nginx
server {
    listen 80;
    server_name <domain_or_ip>;

    root /var/www/frigate/frontend/dist/frontend/browser;
    index index.csr.html;

    location / {
        try_files $uri $uri/ /index.csr.html;
    }

    location ^~ /api/ {
        include fastcgi_params;

        fastcgi_param SCRIPT_FILENAME /var/www/frigate/backend/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param DOCUMENT_ROOT /var/www/frigate/backend/public;

        fastcgi_param REQUEST_URI $request_uri;
        fastcgi_param QUERY_STRING $query_string;
        fastcgi_param REQUEST_METHOD $request_method;
        fastcgi_param CONTENT_TYPE $content_type;
        fastcgi_param CONTENT_LENGTH $content_length;

        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
    }

    location ~ /\. {
        deny all;
    }

    location ~* ^/(app|system|writable|tests|vendor)/ {
        deny all;
    }
}
```

Создать конфиг:

```bash
nano /etc/nginx/sites-available/frigate
```

Активировать сайт:

```bash
ln -sf /etc/nginx/sites-available/frigate /etc/nginx/sites-enabled/frigate
rm -f /etc/nginx/sites-enabled/default
```

Проверить Nginx:

```bash
nginx -t
```

Перезагрузить Nginx:

```bash
systemctl reload nginx
```

---

## Basic Auth для production

Если нужно закрыть приложение паролем на уровне Nginx:

```bash
htpasswd -c /etc/nginx/.htpasswd <nginx_user>
```

Пароль вводится интерактивно.

Добавить в блок `server`:

```nginx
auth_basic "Restricted";
auth_basic_user_file /etc/nginx/.htpasswd;
```

Проверить конфигурацию:

```bash
nginx -t
systemctl reload nginx
```

---

## Права доступа

Для frontend static files:

```bash
find /var/www/frigate/frontend/dist -type d -exec chmod 755 {} \;
find /var/www/frigate/frontend/dist -type f -exec chmod 644 {} \;
```

Для CodeIgniter writable-директории:

```bash
chown -R www-data:www-data /var/www/frigate/backend/writable
chmod -R 775 /var/www/frigate/backend/writable
```

---

## API endpoints

Base API path:

```text
/api
```

---

### Inspections

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/inspections` | Список проверок |
| GET | `/api/inspections/{id}` | Получить одну проверку |
| POST | `/api/inspections` | Создать проверку |
| PUT | `/api/inspections/{id}` | Обновить проверку |
| DELETE | `/api/inspections/{id}` | Удалить проверку |
| GET | `/api/inspections/export` | Экспорт данных |
| POST | `/api/inspections/import` | Импорт данных |

---

### SME

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/smes?q=<query>` | Поиск СМП |
| GET | `/api/sme?q=<query>` | Альтернативный endpoint поиска СМП |
| POST | `/api/smes` | Создать СМП |
| POST | `/api/sme` | Альтернативный endpoint создания СМП |
| PUT | `/api/smes/{id}` | Обновить СМП |
| PUT | `/api/sme/{id}` | Альтернативный endpoint обновления СМП |

---

## Примеры API-запросов

Получить список проверок:

```bash
curl "http://<domain_or_ip>/api/inspections?page=1&per_page=20"
```

Поиск:

```bash
curl "http://<domain_or_ip>/api/inspections?q=<search_query>"
```

Фильтр по датам:

```bash
curl "http://<domain_or_ip>/api/inspections?date_from=2026-01-01&date_to=2026-12-31"
```

Фильтр по статусу:

```bash
curl "http://<domain_or_ip>/api/inspections?status=planned"
```

Поиск СМП:

```bash
curl "http://<domain_or_ip>/api/smes?q=<search_query>"
```

Если включён Basic Auth:

```bash
curl -u <nginx_user>:<nginx_password> "http://<domain_or_ip>/api/inspections?page=1&per_page=20"
```

---

## Функционал

### Список проверок

- вывод списка плановых проверок;
- поиск по ИНН, названию СМП, органу проверки, типу проверки;
- фильтрация по дате;
- фильтрация по статусу;
- серверная пагинация;
- удаление записей;
- экспорт данных.

---

### Добавление и редактирование

- форма создания проверки;
- форма редактирования проверки;
- единый сценарий create / update;
- autocomplete для СМП;
- серверная валидация;
- проверка существования СМП.

---

### СМП

- отдельная сущность СМП;
- поиск по названию и ИНН;
- создание СМП;
- обновление СМП;
- переиспользование СМП в проверках.

---

### UI

- Angular SPA;
- Bootstrap 5;
- адаптивная вёрстка;
- таблица для desktop;
- карточный вид для мобильных устройств.

---

## Import / Export

### Export

Endpoint:

```text
GET /api/inspections/export
```

Возвращает файл:

```text
inspections.csv
```

Структура колонок:

```text
id
sme_id
sme_inn
sme_name
sme_address
planned_date
inspection_type
authority
basis
status
comment
```

---

### Import

Endpoint:

```text
POST /api/inspections/import
```

Формат запроса:

```bash
curl -X POST \
  -F "file=@<path_to_file>" \
  "http://<domain_or_ip>/api/inspections/import"
```

Ожидаемые колонки CSV:

```text
sme_inn
sme_name
sme_address
planned_date
inspection_type
authority
basis
status
comment
```

Допустимые статусы:

```text
planned
completed
cancelled
```

Если статус неизвестен, используется значение:

```text
planned
```

---

## Принятые технические решения

- REST API отделён от frontend.
- Angular работает как SPA.
- Backend отдаёт только JSON/API и файлы импорта/экспорта.
- Production-запуск выполняется через Nginx + PHP-FPM.
- `/api/*` проксируется на CodeIgniter `public/index.php`.
- Frontend static files отдаются напрямую через Nginx.
- Поиск СМП выполняется на сервере.
- Для списка проверок используется серверная пагинация.
- Для удаления используется soft delete, если включено на уровне модели.
- `writable/` отделён как runtime-директория CodeIgniter.

---

## Как запустить проект с нуля локально

Клонировать репозиторий:

```bash
git clone <repo_url>
cd <project_root>
```

Backend:

```bash
cd backend
composer install
cp env .env
php spark migrate
php spark serve
```

Frontend:

```bash
cd frontend
npm install
ng serve --proxy-config proxy.conf.json
```

Результат:

```text
Frontend: http://localhost:4200
Backend:  http://localhost:8080
API:      http://localhost:8080/api
```

---

## Как запустить проект на сервере

Собрать frontend:

```bash
cd /var/www/frigate/frontend
npm install
npm run build
```

Проверить index-файл:

```bash
find /var/www/frigate/frontend/dist/frontend -name "index*"
```

Ожидаемый файл:

```text
/var/www/frigate/frontend/dist/frontend/browser/index.csr.html
```

Установить backend-зависимости:

```bash
cd /var/www/frigate/backend
composer install --no-dev --optimize-autoloader
cp env .env
php spark migrate
```

Настроить права:

```bash
chown -R www-data:www-data /var/www/frigate/backend/writable
chmod -R 775 /var/www/frigate/backend/writable

find /var/www/frigate/frontend/dist -type d -exec chmod 755 {} \;
find /var/www/frigate/frontend/dist -type f -exec chmod 644 {} \;
```

Проверить PHP-FPM socket:

```bash
ls /run/php/
```

Ожидаемый socket:

```text
php8.4-fpm.sock
```

Проверить сервисы:

```bash
systemctl status nginx
systemctl status php8.4-fpm
systemctl status postgresql
```

Перезапустить runtime:

```bash
systemctl restart php8.4-fpm
systemctl reload nginx
```

---

## Troubleshooting

### 403 Forbidden

Частая причина: Nginx смотрит не в ту директорию или не находит index-файл.

Проверить index:

```bash
find /var/www/frigate/frontend/dist/frontend -name "index*"
```

Если найден:

```text
/var/www/frigate/frontend/dist/frontend/browser/index.csr.html
```

то в Nginx должно быть:

```nginx
root /var/www/frigate/frontend/dist/frontend/browser;
index index.csr.html;

location / {
    try_files $uri $uri/ /index.csr.html;
}
```

Проверить права:

```bash
namei -l /var/www/frigate/frontend/dist/frontend/browser/index.csr.html
```

---

### 502 Bad Gateway

Проверить PHP-FPM:

```bash
systemctl status php8.4-fpm
```

Проверить socket:

```bash
ls /run/php/
```

В Nginx должен быть корректный путь:

```nginx
fastcgi_pass unix:/run/php/php8.4-fpm.sock;
```

---

### API не отвечает

Проверить, что `/api/*` уходит в CodeIgniter:

```bash
curl -I "http://<domain_or_ip>/api/inspections"
```

Проверить Nginx logs:

```bash
tail -n 100 /var/log/nginx/error.log
```

Проверить CodeIgniter logs:

```bash
ls -la /var/www/frigate/backend/writable/logs
tail -n 100 /var/www/frigate/backend/writable/logs/log-*.log
```

---

### Angular build warning: budget exceeded

Пример warning:

```text
bundle initial exceeded maximum budget
```

Это предупреждение Angular о размере bundle. Оно не блокирует сборку, если build завершился успешно.

Варианты решения:

- оптимизировать зависимости;
- проверить lazy-loading;
- увеличить budget в `angular.json`;
- удалить неиспользуемые импорты;
- проверить размер сторонних библиотек.

---

### `php spark serve` занимает терминал

Это нормальное поведение dev-сервера.

Для production он не используется.

Production должен работать через фоновые сервисы:

```bash
systemctl status nginx
systemctl status php8.4-fpm
systemctl status postgresql
```

---

## Полезные команды

Проверить маршруты CodeIgniter:

```bash
cd backend
php spark routes
```

Запустить миграции:

```bash
php spark migrate
```

Проверить Nginx config:

```bash
nginx -t
```

Перезагрузить Nginx:

```bash
systemctl reload nginx
```

Перезапустить PHP-FPM:

```bash
systemctl restart php8.4-fpm
```

Проверить frontend build files:

```bash
find frontend/dist/frontend -name "index*"
```

Проверить API:

```bash
curl "http://<domain_or_ip>/api/inspections?page=1&per_page=20"
```

---

## Итоговые адреса

Local development:

```text
Frontend: http://localhost:4200
Backend:  http://localhost:8080
API:      http://localhost:8080/api
```

Production:

```text
Application: http://<domain_or_ip>
API:         http://<domain_or_ip>/api
```