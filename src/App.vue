<script setup lang="ts">
import TestComponent from './components/TestComponent.vue'
import { ref, onMounted } from 'vue'

const count = ref(0)

count.value = 128
</script>

<python>
placeholder = "Irure ullamco commodo deserunt cillum labore in cillum magna nisi ut Lorem."
greeting = "Hola"

def test_func():
	print("Hello World!")
	return "Hello World!"

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
		<button @click="test_func">Greet</button>
	</div>
	<TestComponent />
</template>
