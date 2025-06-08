export function loadTodos() {
    const todos = localStorage.getItem('todos')
    return JSON.parse(todos) ?? []
}

export function saveTodos(todos) {
    localStorage.setItem('todos', JSON.stringify(todos))
}
