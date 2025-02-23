import van from '/third-party/van.js';
import { parseComponentArgs } from '/lib/utils.js';

const CLICK_AND_HOLD_TIME = 500;
const SCROLL_AMOUNT = 10;

const { li, ul } = van.tags;

// note: must set height to allow scroll
export function getDragAndDropList(...args) {
  console.debug('[DragAndDropList] rendering...');

  const [{ onupdate, ...props }, ...children] = parseComponentArgs(args);

  let dragTimeout, draggedItem, dragStartY, dragStartScrollTop, virtualList, lastCursorY, scrollAnimation;

  const list = ul({
    ...props,
    onpointermove: cancelDragStart, // eg. scrolling on touch devices
    ondragstart: preventDefault,
    oncontextmenu: preventDefault,
    class: `overflow-y-auto list-none p-0 ${props.class ?? ''}`
  }, children.map((item) => wrapItem(item)));

  return {
    list,
    getIndex: (element) => getChildren().indexOf(element.parentElement),
    addItem: (element, index) => index < list.children.length
      ? list.insertBefore(wrapItem(element), list.children[index])
      : list.appendChild(wrapItem(element)),
    removeItem: (index) => list.removeChild(list.children[index]),
  };

  function cancelDragStart() {
    if (dragTimeout) {
      clearTimeout(dragTimeout);
    }
  }

  function wrapItem(element) {
    return li({
      onmousedown: handlePointerDown,
      onmouseup: handlePointerUp,
      ontouchstart: handlePointerDown,
      ontouchend: handlePointerUp,
    }, element);
  }

  function handlePointerDown(event) {
    dragTimeout = setTimeout(() => {
      dragTimeout = null;
      draggedItem = this;
      draggedItem.style.position = 'relative';
      draggedItem.style.zIndex = '1';
      draggedItem.style.background = 'var(--color-neutral)';
      draggedItem.style.opacity = '0.5';
      dragStartY = getCursorY(event);
      dragStartScrollTop = list.scrollTop;
      virtualList = getChildren();
      lastCursorY = dragStartY;

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('touchmove', handleDrag, { passive: false });
    }, CLICK_AND_HOLD_TIME);
  }

  function getChildren() {
    return Array.from(list.children);
  }

  function handleDrag(event) {
    event.preventDefault(); // prevent scroll when dragging on touch devices
    const cursorY = getCursorY(event);
    scrollIfNeeded(cursorY);
    translateDraggedItem(cursorY);
    shiftItemsIfNeeded(cursorY);
    lastCursorY = cursorY;
  }

  function scrollIfNeeded(cursorY) {
    const listRect = list.getBoundingClientRect();
    const topBoundary = listRect.top + listRect.height * 0.1;
    const bottomBoundary = listRect.bottom - listRect.height * 0.1;
    if (cursorY < topBoundary && lastCursorY > topBoundary) {
      scroll(-SCROLL_AMOUNT, cursorY);
    } else if (cursorY > bottomBoundary && lastCursorY < bottomBoundary) {
      scroll(SCROLL_AMOUNT, cursorY);
    } else if (cursorY > topBoundary && cursorY < bottomBoundary || isScrolledToBottom(list)) {
      stopScroll();
    }
  }

  function scroll(amount, cursorY) {
    list.scrollTop += amount;
    translateDraggedItem(cursorY);
    scrollAnimation = requestAnimationFrame(() => scroll(amount, cursorY));
  }

  function translateDraggedItem(cursorY) {
    const scrollOffset = list.scrollTop;
    draggedItem.style.top = `${cursorY - dragStartY + (scrollOffset - dragStartScrollTop)}px`;
  }

  function isScrolledToBottom(element) {
    return Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 1;
  }

  function stopScroll() {
    cancelAnimationFrame(scrollAnimation);
  }

  function shiftItemsIfNeeded(cursorY) {
    const scrollOffset = list.scrollTop;
    const draggedIndex = virtualList.indexOf(draggedItem);

    for (let i = 0; i < virtualList.length; i++) {
      const liRect = virtualList[i].getBoundingClientRect();
      const liCenterY = liRect.top + liRect.height / 2;

      if (cursorY + scrollOffset < liCenterY + scrollOffset && draggedIndex > i) {
        moveVirtualItem(draggedIndex, i);
        virtualList.slice(i + 1, draggedIndex + 1).forEach((li) => translate(li, draggedItem.offsetHeight));
        return;
      } else if (cursorY + scrollOffset > liCenterY + scrollOffset && draggedIndex < i) {
        moveVirtualItem(draggedIndex, i);
        virtualList.slice(draggedIndex, i).forEach((li) => translate(li, -draggedItem.offsetHeight));
        return;
      }
    }
  }

  function moveVirtualItem(originalIndex, newIndex) {
    const [movedItem] = virtualList.splice(originalIndex, 1);
    virtualList.splice(newIndex, 0, movedItem);
  }

  function translate(element, displacement) {
    const newIndex = virtualList.indexOf(element);
    const originalIndex = getChildren().indexOf(element);
    const actualDisplacement = newIndex !== originalIndex ? displacement : 0;
    element.style.transition = 'transform 0.5s ease-in-out';
    element.style.transform = `translateY(${actualDisplacement}px)`;
  }

  function handlePointerUp() {
    if (dragTimeout) {
      clearTimeout(dragTimeout);
      return;
    }

    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('touchmove', handleDrag);

    stopScroll();

    const draggedIndex = virtualList.indexOf(draggedItem);
    const listItems = getChildren();
    const originalIndex = listItems.indexOf(draggedItem);
    const sibling = listItems[draggedIndex];
    if (draggedIndex < originalIndex) {
      sibling.insertAdjacentElement('beforebegin', draggedItem);
    } else if (draggedIndex > originalIndex) {
      sibling.insertAdjacentElement('afterend', draggedItem);
    }

    draggedItem.style.position = 'static';
    draggedItem.style.top = '';
    draggedItem.style.zIndex = '';
    draggedItem.style.background = '';
    draggedItem.style.opacity = '';
    draggedItem = null;
    virtualList.forEach(resetTranslation);

    if (draggedIndex !== originalIndex) {
      onupdate(originalIndex, draggedIndex);
    }
  }
}

function preventDefault(event) {
  event.preventDefault();
}

function getCursorY(event) {
  return event.clientY ?? event.touches[0].clientY;
}

function resetTranslation(element) {
  element.style.transition = '';
  element.style.transform = '';
}
