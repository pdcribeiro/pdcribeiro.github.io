
import van from '/third-party/van.js';
import { parseComponentArgs } from '/lib/utils.js';

const { div } = van.tags;

export default function Modal(...args) {
  const [{ onclose, ...props }, ...children] = parseComponentArgs(args);

  return div({
    class: 'overlay flex justify-center items-center',
    onclick: (e) => e.target === e.currentTarget && onclose(),
  },
    div({ ...props, class: `p-6 m-4 bg-theme ${props.class ?? ''}` }, ...children)
  );
}
