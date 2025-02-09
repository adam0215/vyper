# Vyper
Write server-side Python directly inside Vue components.

## Example:
```vue
<template>
  <h1>Vyper</h1>
  <p>{{ greeting }}, Adam!</p>
</template>

<python>
greeting = "Hola"

def greet(name):
  return f"Hello {name}!"
</python>
```

---

This project is just a quick proof of concept. 