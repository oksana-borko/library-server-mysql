Library Service with MySQL (XAMPP, MariaDB)

 работа с базой MYSQL 

 Таблицы
- **readers** — хранит список читателей.
- **authors** — хранит авторов книг.
- **books** — книги (каждая связана с автором).
- **loans** — история выдач книг.
- **books_readers (VIEW)** — представление для объединения данных о книгах и их выдачах:


Реализованы следующие эндпоинты 

POST /api/books — добавить книгу (автор создаётся автоматически, если его нет).

GET /api/books — получить список всех книг.

PATCH /api/books/pickup?id={id}&reader={reader} — взять книгу читателем.

PATCH /api/books/return?id={id} — вернуть книгу.

DELETE /api/books?id={id} — мягкое удаление (status → removed).

GET /api/books/genre?genre={genre} — получить книги по жанру.

GET /api/books/gen_st?genre={genre}&status={status} — получить книги по жанру и статусу.
