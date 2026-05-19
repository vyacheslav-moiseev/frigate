# 📊 Test Task — Реестр плановых проверок

Проект реализован как SPA + REST API:

- Backend: CodeIgniter 4 (PHP)
- Frontend: Angular + Bootstrap
- Database: PostgreSQL
- Excel: PhpSpreadsheet

---

# 🚀 Архитектура
project-root/
├── backend/ # CodeIgniter 4 API
├── frontend/ # Angular SPA
└── README.md

---

# ⚙️ Требования

- PHP >= 8.1
- Composer
- Node.js >= 18
- PostgreSQL

---

# 🧩 Backend setup

```bash
cd backend

composer install
cp env .env


Настройка базы:

В .env:

database.default.hostname = localhost
database.default.database = inspections
database.default.username = postgres
database.default.password = postgres
database.default.DBDriver = Postgre

Миграции / таблицы:

php spark migrate


Запуск backend:

php spark serve

API:

http://localhost:8080/api


💻 Frontend setup

cd frontend

npm install
npm install bootstrap

Запуск:

ng serve

Frontend:

http://localhost:4200


🔌 API endpoints
Inspections
GET /api/inspections
GET /api/inspections/{id}
POST /api/inspections
PUT /api/inspections/{id}
DELETE /api/inspections/{id}
Excel
GET /api/inspections/export
POST /api/inspections/import
SMES
GET /api/smes?q=...


📌 Функционал
📄 Список проверок
поиск по ИНН / названию / органу
фильтр по датам
фильтр по статусу
пагинация
удаление записей
экспорт в Excel


➕ Добавление / редактирование
форма добавления проверки
редактирование существующей
autocomplete для СМП
валидация данных


📥 Excel
импорт данных из Excel
экспорт текущего фильтра
📱 UI особенности
адаптивная верстка (mobile-first)
таблица → карточки на мобильных устройствах
Bootstrap 5
🧠 Принятые решения
REST API отделён от frontend
серверный поиск СМП (для масштабируемости)
soft delete (при необходимости)
единый компонент формы для create/edit
минимизация загрузки данных на клиент


▶️ Как запустить проект с нуля
git clone <repo>
cd project-root


Backend:

cd backend
composer install
cp env .env
php spark serve

Frontend:

cd frontend
npm install
ng serve

🧪 Результат

Проект доступен:

Frontend: http://localhost:4200
Backend: http://localhost:8080