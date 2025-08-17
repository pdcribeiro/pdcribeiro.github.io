import { stateAsync, waitState } from '/lib/ui/web/van-wrapper.js'
import db from '../database.js'
import recipes from '../recipes.js'

export default function TestPage() {
    const counterState = stateAsync(
        new Promise(r => setTimeout(r, 1000)).then(() => 0)
    )

    return waitState(counterState, () => div(
        h1('counter: ', counterState),
        button({ onclick: () => counterState.val++, class: 'border' }, 'increment'),
    ))
}
