# recipes

## TODO

* sketch paper mockups
* implement core logic


## Checklist

Requirements
* [x] List features
  - CRUD recipes
  - Provide instructions in a practical way
* [x] Define target audience
  - Me
  - General public
* [x] Note constraints (stack, deadlines, etc.)
  - van.js

User flows
* [x] Sketch primary user journeys (eg. sign up -> dashboard -> edit profile)
  - recipe list -> create -> recipe details -> cook
  - recipe list -> cook
  - recipe list -> recipe details -> edit
  - visits list page -> load list page -> clicks add -> show add screen -> clicks cancel -> hide add screen
  - visits list page -> load list page -> clicks add -> show add screen -> writes text -> clicks save -> visit view page -> goes back -> load list page
  - visits list page -> load list page -> clicks add -> show add screen -> writes text -> clicks save -> visit view page -> clicks edit -> show edit screen -> clicks cancel -> hide edit screen -> goes back -> load list page
  - visits list page -> load list page -> clicks add -> show add screen -> writes text -> clicks save -> visit view page -> clicks edit -> show edit screen -> writes text -> clicks save -> hide edit screen, update edit page (no visit)
  - visits list page -> load list page -> clicks recipe -> visit view page -> clicks cook -> visit cook page -> clicks cancel -> load view page (go back)

Data models
* [x] Define core entities (User, Item, etc.)
  - Recipe { text }
  - CookingSession { recipe, step }
* [x] Map relationships
* [x] Create mock data or interfaces

UI/Component plan
* [x] Draw rough wireframes
* [x] List pages and reusable components
  - list, create, view, cook, edit
* [x] Group components (layout/UI/logic)

Architecture
* [ ] Decide folder structure
* [ ] Plan state management
* [ ] Separate concerns (API, logic, UI)
* [ ] Plan error/loading handling

API contracts
* [ ] Define API endpoints
* [ ] Create types/interfaces
* [ ] Use mock APIs if backend not ready

Dev tasks
* [ ] Split into vertical slices (feature + UI + API)
* [ ] Prioritize MVP
* [ ] Track with kanban or TODO list

Iterate
* [ ] Ship MVP
* [ ] Improve structure, performance and DX


## Process

1. Clarify requirements — ask probing questions to refine intent

* core goal: access to recipes displayed in a way that is easy to follow while cooking
* main/first pain to solve: CRUD. then cooking mode
* mvp features

2. Think structurally — how to break problem into pure logic and shell layers

* ui
* storage
* core

3. Define responsibilities — core vs UI vs effects

ui
* recipe list view
  - header
    - "recipes" h1
    - create recipe button
  - for each
    - title
    - on click: navigate to recipe details view
* create recipe view
  - header
    - "create recipe" h1
  - recipe textarea
  - footer
    - save button
* recipe details view
  - header
    - title h1
    - edit button
  - ingredients ul
  - footer
    - cook button
* edit recipe view
  - recipe textarea
  - save button
  - delete button
    - confirm deletion
* cooking helper ui
  - for each prep
    - title

storage
* loadRecipes(): Map<id: string, text: string>
* saveRecipes()

core
* validateRecipes(recipes)
  - validateRecipeText()
* validateRecipeText(text)
* addRecipe(text, recipeList, deps)
  - validateRecipeText()
* updateRecipe(id, newText, recipeList)
* removeRecipe()
* recipe.ingredients
* cooking helper
  - provides instructions
  - tracks progress

4. Write spec — minimal description of expected behavior

* v1 no preps

5. Decide tradeoffs — document reasoning and consider alternatives


## Features

### CRUD recipes

* instructions (including ingredients and quantities)
* ingredients (names and quantities) (generated automatically from instructions)

### Cooking mode

* show ingredients
* show full instructions
  - include ingredient quantities
* show step-by-step instructions
  - include ingredient quantities

### Tags (eg. vegan, vegetarian, gluten free)

### Search and import recipes from a list of supported sites

### Allergens list

* generate recipe allergen list based on ingredients and hardcoded allergen list

### Meal planner

* aggregate recipes
* generate shopping list
  - allow input available quantities. output missing quantities
* list of recipes with allergens

### Timer in cooking mode

### Parallel preps in cooking mode

### Text parser (too hard. possible with AI)

* paste text from any site and convert it to a standard format
  - extract ingredient names
  - extract ingredient quantities
  - extract servings
  - extract instructions
  - handle multiple recipes, called "preparations" (eg. cake and frosting)
* ? intermediate textarea to filter out unnecessary text (eg. whitespace)

UI/UX
* render input textarea
* render parse button
* render output textarea
* user pastes recipe into input textarea
* user clicks parse button
* show results in output textarea
