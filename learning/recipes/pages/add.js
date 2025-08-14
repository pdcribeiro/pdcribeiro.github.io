import { visit } from '/lib/routing.js'
import { Fragment } from '/lib/ui/van-wrapper.js'
import db from '../database.js'
import { isValidText } from '../recipes.js'

export default function AddRecipePage() {
    const textInput = textarea()

    return Fragment(
        header(
            h1('new recipe'),
        ),
        main(textInput),
        footer(
            button({ onclick: () => save(textInput.value), class: 'border' }, 'save'),
            button({ onclick: cancel }, 'cancel'),
        ),
    )

    // TODO: detect back navigation
    function cancel() {
        if (isTextEmpty() || confirm('Are you sure?')) {
            visit('#!/list')
        }
    }

    function isTextEmpty() {
        return textInput.value.trim().length === 0
    }
}

async function save(text) {
    if (isValidText(text)) {
        await db.createRecipe(text)
        visit('#!/list')
    } else {
        alert('Invalid recipe')
    }
}
