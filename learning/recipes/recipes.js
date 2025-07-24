export function isValidText(text) {
    if (!text) {
        console.error('Invalid text', { text })
        return false
    }
    // TODO
    return true
}

export function getTitle(recipe) {
    return recipe.text.split('\n')[0]
}

export function getIngredients(recipe) {
    // TODO
}
