import { getUrlParams } from '/lib/routing.js'
import { Fragment, stateAsync, waitState } from '/lib/ui/web/van-wrapper.js'
import db from '../database.js'
import { getTitle } from '../recipes.js'

export default function ViewRecipePage() {
    const { id } = getUrlParams()
    const recipeState = stateAsync(db.getRecipe(id))

    return waitState(recipeState, () => Fragment(
        header(
            h1(getTitle(recipeState.val)),
        ),
        main(
            pre(recipeState.val.text)
        ),
        footer(
            a({ href: `#!/cook?id=${id}`, class: 'button border' }, 'cook'),
            a({ href: `#!/edit?id=${id}`, class: 'button' }, 'edit'),
        ),
    ))
}
