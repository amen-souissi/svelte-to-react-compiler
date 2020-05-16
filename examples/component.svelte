<script>
  export let count;
  export let name;
 
  function reset(e) {
    e.preventDefault()
    count = 0
  }

</script>

<h1 class="c1" on:click=reset>Hello {name} {count}!</h1>
<div>Svelte to <b>React</b>!</div>
