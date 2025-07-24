// Database interface

import { getCollection } from '/lib/database-local.js'
import { isValidText } from './recipes.js'

const RECIPES_KEY = 'recipes-recipes'

const collection = getCollection(RECIPES_KEY)

export default {
    connect: async () => validateStoredRecipes(),
    findRecipes: async () => collection.getAll(),
    getRecipe: async (id) => collection.get(id),
    createRecipe: async (text) => collection.add({ text }),
    updateRecipe: async (id, text) => collection.update(id, { text }),
    deleteRecipe: async (id) => collection.remove(id),
}

function validateStoredRecipes() {
    if (!collection.getAll().every(r => isValidText(r.text))) {
        throw new Error('Invalid recipe list')
    }
}
