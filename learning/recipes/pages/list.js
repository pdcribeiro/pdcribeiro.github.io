import { waitPromise } from '/lib/ui/van-wrapper.js'
import db from '../database.js'
import { getTitle } from '../recipes.js'

export default function RecipeListPage() {
    return waitPromise(db.findRecipes(), (recipes) => div(
        header(
            h1('recipes'),
        ),
        main(
            ul(recipes.map(r =>
                li(
                    a({ href: `#!/view?id=${r.id}` }, getTitle(r)),
                )
            )),
        ),
        footer(
            a({ href: '#!/add', class: 'button border' }, '+'),
        ),
    ))
}
