<script setup lang="ts">
import TestComponent from './components/TestComponent.vue'
import { ref, onMounted } from 'vue'

const count = ref(0)

count.value = 128

const pythonResult = ref(0)

onMounted(async () => {
	pythonResult.value = await add(18, 45)
	console.log(pythonResult)
})
</script>

<python>
placeholder = "Irure ullamco commodo deserunt cillum labore in cillum magna nisi ut Lorem."
greeting = "Hola"

def add(a, b):
	return int(a) + int(b)

def greet(name):
	print(f"Hello {name}!")
	return name
</python>

<python>
def thank(name):
	print(f"Thank you {name}!")
	return name
</python>

<template>
	<div>
		<h1>Vyper</h1>
		<p>{{ greeting }}, Adam!</p>
		<p>Siffra: {{ count }}</p>
		<p>Function return from Python: {{ pythonResult }}</p>
		<button @click="thank('Adam')">Greet</button>
	</div>
	<TestComponent />
</template>
