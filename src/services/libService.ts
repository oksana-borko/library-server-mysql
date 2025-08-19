import { Book, BookGenres, BookStatus } from '../model/Book.ts'

export interface LibService {
    addBook(book: Book): Promise<boolean>
    removeBook(id: string): Promise<Book>
    pickUpBook(id: string, reader: string): Promise<void>
    returnBook(id: string): Promise<void>
    getAllBooks(): Promise<Book[]>
    getBooksByGenre(genre: BookGenres): Promise<Book[]>

    getBooksByGenreAndStatus?(genre: BookGenres, status: BookStatus): Promise<Book[]>
}
