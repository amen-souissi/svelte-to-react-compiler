<script>
  export let name;

  function handleClick(e) {
    e.preventDefault()
    alert(`Hello ${name}!`)
  }
</script>

<h1 class={name} on:click=handleClick>Hello {name}!</h1>
<div>Svelte to <b>React</b>!</div>
