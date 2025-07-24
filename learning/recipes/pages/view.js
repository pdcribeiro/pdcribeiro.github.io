import { getUrlParams } from '/lib/routing.js'
import { stateAsync, waitState } from '/lib/ui/van-wrapper.js'
import db from '../persistence.js'
import recipes from '../recipes.js'

export default function ViewRecipePage() {
    const { id } = getUrlParams()
    const recipeState = stateAsync(db.getRecipe(id))

    return waitState(recipeState, () => div(
        header(
            h1(recipes.getTitle(recipeState.val)),
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
