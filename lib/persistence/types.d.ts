type Config = Record<string, string>
type Id = string

declare class PersistenceRepo<Document> {
    constructor(config: Config)
    init(config?: Config): Promise<void> // eg. connect to database
    find(): Promise<Document[]>
    add(doc: Document): Promise<Document>
    get(id: Id): Promise<Document>
    set(id: Id, doc: Document): Promise<Document>
    patch(id: Id, doc: Document): Promise<Document>
    del(id: Id): Promise<void>
}
