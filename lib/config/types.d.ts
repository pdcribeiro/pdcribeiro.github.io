type Schema = Record<string, any>
type Config = Record<string, any>

declare class ConfigManager {
    // schema: Schema | null
    // repo: ConfigRepo
    // constructor(schema: Schema | null, deps: { repo: ConfigRepo })
    load(): Promise<Config>
    save(config: Config): Promise<void>
    stringify(config: Config): string
    parse(config: string): Config
    _validate(config: Config): void
}

interface ConfigRepo {
    // config: Config | undefined
    // constructor(config?: Config)
    load(): Promise<Config>
    save(config: Config): Promise<void>
}
