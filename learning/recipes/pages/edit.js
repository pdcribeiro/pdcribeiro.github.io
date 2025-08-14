import { getUrlParams, visit } from '/lib/routing.js'
import { Fragment, stateAsync, waitState } from '/lib/ui/van-wrapper.js'
import db from '../database.js'
import { getTitle, isValidText } from '../recipes.js'

export default function EditRecipePage() {
    const { id } = getUrlParams()
    const recipeState = stateAsync(db.getRecipe(id))

    return waitState(recipeState, () => {
        const textInput = textarea({ value: recipeState.val.text })

        return Fragment(
            header(
                h1(getTitle(recipeState.val)),
            ),
            main(textInput),
            footer(
                button({ onclick: save, class: 'border' }, 'save'),
                button({ onclick: cancel }, 'cancel'),
            ),
        )

        async function save() {
            if (isValidText(textInput.value)) {
                await db.updateRecipe(id, textInput.value)
                visit('#!/list')
            } else {
                alert('Invalid recipe')
            }
        }

        // TODO: detect back navigation
        function cancel() {
            if (isTextUnchanged() || confirm('Are you sure?')) {
                visit(`#!/view?id=${id}`)
            }
        }

        function isTextUnchanged() {
            return textInput.value === recipeState.val.text
        }
    })
}
