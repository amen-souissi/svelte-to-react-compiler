# Svelte to React Compiler

A demonstration of how transform a Svelte component to a React component.
(derived from https://github.com/joshnuss/micro-svelte-compiler)

## Installation

Download and install dependencies:

```bash
git clone https://github.com/amen-souissi/svelte-to-react-compiler
cd svelte-to-react-compiler
nm install
npm install -g babel-cli
npm link
```

## Compiler Stages

This compiler has multiple stages:

1. Parse the `.svelte` file and extract code from `<script>` tags and build a list of non-`<script>` tags.
2. Parse the code and determine props (anything with `export let ...` is a prop)
3. Parse the tags recursively and make an ordered list of nodes and event listeners
4. Generate the React component using props, nodes, listeners, and code from script tags
5. Format the JavaScript code
6. Print the result to `stdout`

## Dependencies

It uses similar dependencies to svelte.js (except for HTML parsing).

- [acorn](https://www.npmjs.com/package/acorn): Parses JavaScript text into AST.
- [code-red](https://www.npmjs.com/package/code-red): Generates JavaScript AST from template strings. Converts AST back to string.
- [parse5](https://www.npmjs.com/package/parse5): Parses HTML tags.

## Usage

Say you have a `.svelte` file like `examples/component.svelte`:

```html
<script>
  export let count;
  export let name;

  function reset(e) {
    e.preventDefault();
    count = 0;
  }
</script>

<h1 class="c1" on:click="reset">Hello {name} {count}!</h1>
<div>Svelte to <b>React</b>!</div>
```

Run the compiler on it:

```bash
msv examples/basic.svelte > examples/basic.jsx
```

It generates a JavaScript file that looks like this:

```js
import * as React from "react";

export default function Component({ count, name }) {
  const [countState, setCountState] = React.useSate(count);

  React.useEffect(() => {
    setCountState(count);
  }, [count]);

  function reset(e) {
    e.preventDefault();
    setCountState(0);
  }
  return (
    <React.Fragment>
      <h1 className="c1" onClick={reset}>
        Hello {name} {countState}!
      </h1>
      <div>
        Svelte to <b>React</b>!
      </div>
    </React.Fragment>
  );
}
```

## License

MIT
