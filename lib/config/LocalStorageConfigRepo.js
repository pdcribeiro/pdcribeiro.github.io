import { getJson, setJson } from '/lib/persistence/LocalStorageRepo.js'

/**
 * @implements {ConfigRepo}
 */
export default class LocalStorageConfigRepo {
    /**
     * @param {string} key
     */
    constructor(key) {
        this.key = key
    }
    async load() {
        return getJson(this.key) ?? {}
    }
    async save(config) {
        setJson(this.key, config)
    }
}
