import { LibService } from './libService.js'
import { Book, BookGenres, BookStatus, PickRecord } from '../model/Book.js'
import { pool } from '../config/libConfig.js'
import { HttpError } from '../errorHandler/HttpError.js'
import { v4 as uuid } from 'uuid'
import type { ResultSetHeader } from 'mysql2/promise'
import type {BookRow, PickRow, ReaderIdRow, OpenPickRow, AuthorIdRow, BookIdStatusRow} from '../types/sql.js'

export class LibServiceImplSQL implements LibService {

    async addBook(book: Book): Promise<boolean> {
        const conn = await pool.getConnection()
        try {
            await conn.beginTransaction()


            let authorId: number
            const [a1] = await conn.query<AuthorIdRow[]>(
                'SELECT id FROM authors WHERE name = ?',
                [book.author]
            )
            if (a1.length) {
                authorId = a1[0].id
            } else {
                const [ins] = await conn.execute<ResultSetHeader>(
                    'INSERT INTO authors (name) VALUES (?)',
                    [book.author]
                )
                authorId = ins.insertId
            }


            await conn.execute<ResultSetHeader>(
                `INSERT INTO books (id, title, author_id, genre, status)
         VALUES (?, ?, ?, ?, ?)`,
                [book.id, book.title, authorId, book.genre, book.status]
            )

            await conn.commit()
            return true
        } catch (e: any) {
            try { await (conn as any).rollback?.() } catch {}
            if (e?.code === 'ER_DUP_ENTRY') return false
            throw e
        } finally {
            conn.release()
        }
    }

    async getAllBooks(): Promise<Book[]> {
        const [rows] = await pool.query<BookRow[]>(
            `SELECT b.id, b.title, a.name AS author, b.genre, b.status
         FROM books b
         JOIN authors a ON a.id = b.author_id
        ORDER BY b.created_at DESC`
        )
        if (rows.length === 0) return []

        const ids = rows.map(r => r.id)
        const placeholders = ids.map(() => '?').join(',')
        const [pickRows] = await pool.query<PickRow[]>(
            `SELECT br.book_id, r.name AS reader, br.pick_date, br.return_date
         FROM books_readers br
         JOIN readers r ON r.id = br.reader_id
        WHERE br.book_id IN (${placeholders})
        ORDER BY br.pick_date ASC`,
            ids
        )

        const pickMap = new Map<string, PickRecord[]>()
        for (const p of pickRows) {
            const list = pickMap.get(p.book_id) || []
            list.push({
                reader: p.reader,
                pick_date: p.pick_date.toDateString(),
                return_date: p.return_date ? p.return_date.toDateString() : null
            })
            pickMap.set(p.book_id, list)
        }

        return rows.map(r => ({
            id: r.id,
            title: r.title,
            author: r.author,
            genre: r.genre as BookGenres,
            status: r.status,
            pickList: pickMap.get(r.id) || []
        }))
    }

    async getBooksByGenre(genre: BookGenres): Promise<Book[]> {
        const [rows] = await pool.query<BookRow[]>(
            `SELECT b.id, b.title, a.name AS author, b.genre, b.status
         FROM books b
         JOIN authors a ON a.id = b.author_id
        WHERE b.genre = ? AND b.status <> ?
        ORDER BY b.title`,
            [genre, BookStatus.REMOVED]
        )
        return rows.map(r => ({
            id: r.id,
            title: r.title,
            author: r.author,
            genre: r.genre as BookGenres,
            status: r.status,
            pickList: []
        }))
    }

    async pickUpBook(id: string, readerName: string): Promise<void> {
        const conn = await pool.getConnection()
        try {
            await conn.beginTransaction()

            const [bks] = await conn.query<BookIdStatusRow[]>(
                `SELECT id, status FROM books WHERE id = ? FOR UPDATE`,
                [id]
            )
            if (bks.length === 0) throw new HttpError(404, `Book with id ${id} not found`)
            if (bks[0].status !== BookStatus.ON_STOCK)
                throw new HttpError(409, 'No this book on stock')


            let readerId: string
            const [rds] = await conn.query<ReaderIdRow[]>(
                `SELECT id FROM readers WHERE name = ?`,
                [readerName]
            )
            if (rds.length) {
                readerId = rds[0].id
            } else {
                readerId = uuid()
                await conn.execute<ResultSetHeader>(
                    `INSERT INTO readers (id, name) VALUES (?, ?)`,
                    [readerId, readerName]
                )
            }

            await conn.execute<ResultSetHeader>(
                `INSERT INTO books_readers (book_id, reader_id, pick_date, return_date)
         VALUES (?, ?, NOW(), NULL)`,
                [id, readerId]
            )
            await conn.execute<ResultSetHeader>(
                `UPDATE books SET status = ? WHERE id = ?`,
                [BookStatus.ON_HAND, id]
            )

            await conn.commit()
        } catch (e) {
            await conn.rollback()
            throw e
        } finally {
            conn.release()
        }
    }

    async returnBook(id: string): Promise<void> {
        const conn = await pool.getConnection()
        try {
            await conn.beginTransaction()

            const [bks] = await conn.query<BookIdStatusRow[]>(
                `SELECT id, status FROM books WHERE id = ? FOR UPDATE`,
                [id]
            )
            if (bks.length === 0) throw new HttpError(404, `Book with id ${id} not found`)
            if (bks[0].status !== BookStatus.ON_HAND)
                throw new HttpError(409, 'This book is on stock')

            const [open] = await conn.query<OpenPickRow[]>(
                `SELECT id
           FROM books_readers
          WHERE book_id = ? AND return_date IS NULL
          ORDER BY pick_date DESC
          LIMIT 1 FOR UPDATE`,
                [id]
            )
            if (open.length === 0) throw new HttpError(409, 'No open pick record for this book')

            await conn.execute<ResultSetHeader>(
                `UPDATE books_readers SET return_date = NOW() WHERE id = ?`,
                [open[0].id]
            )
            await conn.execute<ResultSetHeader>(
                `UPDATE books SET status = ? WHERE id = ?`,
                [BookStatus.ON_STOCK, id]
            )

            await conn.commit()
        } catch (e) {
            await conn.rollback()
            throw e
        } finally {
            conn.release()
        }
    }

    async removeBook(id: string): Promise<Book> {
        const [rows] = await pool.query<BookRow[]>(
            `SELECT b.id, b.title, a.name AS author, b.genre, b.status
         FROM books b JOIN authors a ON a.id = b.author_id
        WHERE b.id = ?`,
            [id]
        )
        if (rows.length === 0) throw new HttpError(404, `Book with id ${id} not found`)

        await pool.execute<ResultSetHeader>(
            `UPDATE books SET status = ? WHERE id = ?`,
            [BookStatus.REMOVED, id]
        )

        const b = rows[0]
        return {
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre as BookGenres,
            status: BookStatus.REMOVED,
            pickList: []
        }
    }

    async getBooksByGenreAndStatus(genre: BookGenres, status: BookStatus): Promise<Book[]> {
        const [rows] = await pool.query<BookRow[]>(
            `SELECT b.id, b.title, a.name AS author, b.genre, b.status
         FROM books b JOIN authors a ON a.id = b.author_id
        WHERE b.genre = ? AND b.status = ?
        ORDER BY b.title`,
            [genre, status]
        )
        return rows.map(r => ({
            id: r.id,
            title: r.title,
            author: r.author,
            genre: r.genre as BookGenres,
            status: r.status,
            pickList: []
        }))
    }
}

export const libServiceSql = new LibServiceImplSQL()
