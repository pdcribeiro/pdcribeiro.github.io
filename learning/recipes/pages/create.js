import { visit } from '/lib/routing.js'
import db from '../persistence.js'
import recipes from '../recipes.js'

export default function CreateRecipePage() {
    const textInput = textarea()

    return div(
        header(
            h1('new recipe'),
        ),
        main(textInput),
        footer(
            button({ onclick: save, class: 'border' }, 'save'),
            button({ onclick: cancel }, 'cancel'),
        ),
    )

    async function save() {
        if (recipes.isValidText(textInput.value)) {
            await db.createRecipe(textInput.value)
            visit('#!/list')
        } else {
            alert('Invalid recipe')
        }
    }

    // TODO: detect back navigation
    function cancel() {
        if (!textInput.value.length || confirm('Are you sure?')) {
            visit('#!/list')
        }
    }
}
