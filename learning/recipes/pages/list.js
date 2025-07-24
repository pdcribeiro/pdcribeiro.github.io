import { stateAsync, waitState } from '/lib/ui/van-wrapper.js'
import db from '../persistence.js'
import recipes from '../recipes.js'

export default function RecipeListPage() {
    const recipesState = stateAsync(db.findRecipes())

    return waitState(recipesState, () => div(
        header(
            h1('recipes'),
        ),
        main(
            () => ul(recipesState.val.map(recipe =>
                li(
                    a({ href: `#!/view?id=${recipe.id}` }, recipes.getTitle(recipe)),
                )
            )),
        ),
        footer(
            a({ href: '#!/create', class: 'button border' }, '+'),
        ),
    ))
}
