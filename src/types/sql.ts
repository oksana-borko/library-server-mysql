import type { RowDataPacket } from 'mysql2/promise'
import type { BookStatus } from '../model/Book.js'

export interface BookRow extends RowDataPacket {
    id: string
    title: string
    author: string
    genre: string
    status: BookStatus
}

export interface PickRow extends RowDataPacket {
    book_id: string
    reader: string
    pick_date: Date
    return_date: Date | null
}

export interface ReaderIdRow extends RowDataPacket {
    id: string
}

export interface OpenPickRow extends RowDataPacket {
    id: number
}


export interface AuthorIdRow extends RowDataPacket {
    id: number
}


export interface BookIdStatusRow extends RowDataPacket {
    id: string
    status: BookStatus
}
