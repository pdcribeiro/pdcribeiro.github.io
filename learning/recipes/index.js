renderApp()

function renderApp() {
    renderPage(location.href) // when using router
}

function renderPage(url) {
    const load = getPageLoader(url)
    load()
}

function getPage() {
    fetchPageFromFileSystem
}

async function loadListPage() {
    const recipes = await db.findRecipes()
    return ListPageTemplate({
        recipes,
        onRecipeClick: (recipe) => visit(recipe.id),
        onAddClick: showAddModal(),
    })
}
function ListPageTemplate({ recipes, onRecipeClick, onAddClick }) {
}

function AddPage() {

}
