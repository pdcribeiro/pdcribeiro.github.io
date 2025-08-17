import { Fragment } from '/lib/ui/web/van-wrapper.js'
import db from '../database.js'
import { getTitle } from '../recipes.js'

const pages = {
    list: 'list',
    add: 'add',
    view: 'view',
    cook: 'cook',
    edit: 'edit',
}

// Application logic (controller)
// - independent of vanjs
// - manages state
// - orchestrates everything (persistence, ui, domain logic, etc.)
export default async function load() {
    const recipes = await db.findRecipes()

    return RecipeListPage({
        recipes,
        onRecipeClick: ({ id }) => visit(`#!/view?id=${id}`), // TODO: visit(pages.view, { id })
        onAddClick: () => visit('#!/add'), // TODO: show(modals.add)
    })
}

// UI logic (view)
// - display data and add event listeners
function RecipeListPage({ recipes, onRecipeClick, onAddClick }) {
    return Fragment(
        header(
            h1('recipes'),
        ),
        main(
            ul(recipes.map(r =>
                li(
                    button({ onclick: () => onRecipeClick(r) }, getTitle(r)),
                )
            )),
        ),
        footer(
            button({ onclick: onAddClick, class: 'border' }, '+'),
        ),
    )
}
