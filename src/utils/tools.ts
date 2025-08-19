import { BookDto, BookGenres, BookStatus } from '../model/Book.ts'
import { v4 as uuidv4 } from 'uuid'
import { HttpError } from '../errorHandler/HttpError.js'

export function getGenre(genre: string) {
    const g = Object.values(BookGenres).find(v => v === genre)
    if (!g) throw new HttpError(400, 'Wrong genre')
    return g
}

export function getStatus(status: string) {
    const s = Object.values(BookStatus).find(v => v === status)
    if (!s) throw new HttpError(400, 'Wrong status')
    return s
}

export const convertBookDtoToBook = (dto: BookDto) => ({
    id: uuidv4(),
    title: dto.title,
    author: dto.author,
    genre: getGenre(dto.genre),
    status: BookStatus.ON_STOCK,
    pickList: []
})
