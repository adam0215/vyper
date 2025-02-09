# Vyper
Write server-side Python directly inside Vue components.

## Example:
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const pythonResult = ref(0)

onMounted(async () => {
  // Call the 'add' function defined in the Python block and ran on the server
	pythonResult.value = await add(18, 45)
})
</script>

<template>
  <h1>Vyper</h1>

  <!-- Use of variable defined in Python and sent over the wire  -->
  <p>{{ greeting }}, Adam!</p>
  <p>Function return from add function in Python: {{ pythonResult }}</p>
</template>

<python>
greeting = "Hola"

def greet(name):
  return f"Hello {name}!"

def add(a, b):
	return int(a) + int(b)
</python>
```

---

This project is just a quick proof of concept. 
