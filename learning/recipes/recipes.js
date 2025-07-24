export default {
    isValidText(text) {
        if (!text) {
            console.error('Invalid text', { text })
            return false
        }
        // TODO
        return true
    },
    getTitle(recipe) {
        return recipe.text.split('\n')[0]
    },
    getIngredients(recipe) {
        // TODO
    },
}
