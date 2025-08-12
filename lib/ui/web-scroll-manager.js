const SCROLL_AREA_HEIGHT_PERCENT = 0.1
const SCROLL_AMOUNT = 10

const UP = 'up'
const DOWN = 'down'

export default function WebScrollManager() {
    let scrollElement, scrollDirection, scrollAnimation

    return {
        start: (el) => scrollElement = getClosestScrollableElement(el),
        handlePointerMove(pointerY) {
            if (scrollElement) {
                const boundaries = getScrollBoundaries(scrollElement)
                if (pointerY < boundaries.top) startScroll(UP)
                else if (pointerY > boundaries.bottom) startScroll(DOWN)
                else stopScroll()
            }
        },
        stop: () => {
            stopScroll()
            scrollElement = null
        },
    }

    function startScroll(direction) {
        if (direction !== scrollDirection) {
            cancelAnimationFrame(scrollAnimation)
            scroll(SCROLL_AMOUNT * (direction === DOWN ? 1 : -1))
            scrollDirection = direction
        }
    }

    function scroll(value) {
        scrollElement.scrollTop += value
        scrollAnimation = requestAnimationFrame(() => scroll(value))
    }

    function stopScroll() {
        cancelAnimationFrame(scrollAnimation)
        scrollDirection = null
    }
}

function getClosestScrollableElement(element) {
    while (element) {
        const style = getComputedStyle(element)
        if (/(auto|scroll)/.test(style.overflow + style.overflowY)) {
            return element
        }
        element = element.parentElement
    }
    return document.scrollingElement || document.documentElement
}

function getScrollBoundaries(element) {
    const rect = element.getBoundingClientRect()
    return {
        top: Math.max(
            rect.top + rect.height * SCROLL_AREA_HEIGHT_PERCENT,
            window.innerHeight * SCROLL_AREA_HEIGHT_PERCENT,
        ),
        bottom: Math.min(
            rect.bottom - rect.height * SCROLL_AREA_HEIGHT_PERCENT,
            window.innerHeight * (1 - SCROLL_AREA_HEIGHT_PERCENT),
        ),
    }
}
