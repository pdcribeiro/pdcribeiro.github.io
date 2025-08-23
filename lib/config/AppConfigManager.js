import LocalStorageConfigRepo from '/lib/config/LocalStorageConfigRepo.js'
import { transformEntries } from '/lib/objects.js'

/**
 * @implements {ConfigManager}
 */
class BaseConfigManager {
    /**
     * @param {{repo: ConfigRepo, schema: Schema }} options
     */
    constructor({ repo, schema }) {
        this.repo = repo
        this.schema = schema
    }
    async load() {
        const config = await this.repo.load()
        this._validate(config)
        return config
    }
    async save(config) {
        this._validate(config)
        return await this.repo.save(config)
    }
    stringify(config) {
        return Object.entries(config).map(([k, v]) => `${k}: ${v}`).join('\n')
    }
    parse(config) {
        return Object.fromEntries(
            config
                .split('\n')
                .map(line =>
                    line
                        .split(':')
                        .map(it => it.trim())
                )
        )
    }
    _validate(config) {
        // TODO
    }
}

export const defaultConfigManager = new BaseConfigManager({
    repo: new LocalStorageConfigRepo('toolbox-default-config'),
    schema: {},
})

export default class AppConfigManager extends BaseConfigManager {
    async load() {
        const appConfig = await super.load()
        const defaultConfig = await defaultConfigManager.load()
        return transformEntries(appConfig, ([k, v]) => [k, v ?? defaultConfig[k]])
    }
}
