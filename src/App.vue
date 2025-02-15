<script setup lang="ts">
import MathComponent from './components/MathComponent.vue'
import { ref, onMounted } from 'vue'

const greeting = ref('Hej')

onMounted(async () => {
	greeting.value = await get_random_greeting()
})
</script>

<python>
def get_random_greeting():
	import random
	return random.choice([
		"Hello,",
		"Hola,",
		"Bonjour,",
		"Hallo,",
		"Ciao,",
		"Ola,",
		"Merhaba,",
		"Hej,",
		"Salve,",
		"Geia sou,",
		"Shalom,",
		"Namaste,",
		"Selam,",
		"Halo,",
	])
</python>

<template>
	<main>
		<div class="heading-container">
			<h1>Vyper</h1>
			<h2 class="greeting">{{ greeting }} from Python</h2>
		</div>
		<MathComponent />
	</main>
</template>

<style scoped>
main {
	display: flex;
	flex-direction: column;

	gap: 3rem;
}

.heading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1rem;

	width: 100%;
	padding-block: 2rem;
}

.heading-container h1 {
	font-size: 5rem;
	font-weight: bold;
	background: linear-gradient(180deg, #0dfd7d, #021d16);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
}

.heading-container .greeting {
	font-size: 2rem;
	font-weight: 500;
	color: var(--grey-200);
}
</style>
