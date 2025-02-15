<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const mathResult = ref(0)
const currentMathMethod = ref(0)
const a = ref(null)
const b = ref(null)

// Compute the width for inputs based on their value
const aWidth = computed(() => {
	if (!a.value) return '3ch'
	return `${String(a.value).length}ch`
})

const bWidth = computed(() => {
	if (!b.value) return '3ch'
	return `${String(b.value).length}ch`
})

const mathOperations = [
	async (a: number, b: number) => await add(a, b),
	async (a: number, b: number) => await sub(a, b),
	async (a: number, b: number) => await mul(a, b),
	async (a: number, b: number) => await div(a, b),
]

async function doMath() {
	mathResult.value = mathOperations[currentMathMethod.value]
		? await mathOperations[currentMathMethod.value](a.value, b.value)
		: 0
}

function debounce(fn: Function, delay = 300) {
	let timer: ReturnType<typeof setTimeout>
	return (...args: any[]) => {
		clearTimeout(timer)
		timer = setTimeout(() => fn(...args), delay)
	}
}

const debouncedDoMath = debounce(doMath, 300)
watch([a, b, currentMathMethod], debouncedDoMath)
</script>

<python>
def add(a, b):
	return int(a) + int(b)

def sub(a, b):
	return int(a) - int(b)

def mul(a, b):
	return int(a) * int(b)

def div(a, b):
	return int(a) / int(b)
</python>

<template>
	<div class="math-container">
		<div>
			<ul class="math-choices">
				<li
					:class="{ selected: currentMathMethod === 0 }"
					@click="currentMathMethod = 0"
				>
					Add
				</li>
				<li
					:class="{ selected: currentMathMethod === 1 }"
					@click="currentMathMethod = 1"
				>
					Subtract
				</li>
				<li
					:class="{ selected: currentMathMethod === 2 }"
					@click="currentMathMethod = 2"
				>
					Multiply
				</li>
				<li
					:class="{ selected: currentMathMethod === 3 }"
					@click="currentMathMethod = 3"
				>
					Divide
				</li>
			</ul>
			<div class="math-inputs">
				<div class="input-container">
					<label for="number-a">A</label>
					<input
						type="number"
						id="number-a"
						placeholder="000"
						v-model="a"
						:style="{ width: aWidth }"
					/>
				</div>

				<span class="math-operator">{{
					['+', '-', '•', '÷'][currentMathMethod]
				}}</span>

				<div class="input-container">
					<label for="number-b">B</label>
					<input
						type="number"
						id="number-b"
						placeholder="000"
						v-model="b"
						:style="{ width: bWidth }"
					/>
				</div>
			</div>

			<p class="math-result">{{ mathResult }}</p>
		</div>
	</div>
</template>

<style scoped>
.math-container {
	display: flex;
	flex-direction: column;

	width: 100%;
	padding: 1rem 1rem 3rem 1rem;

	border: 2px solid var(--grey-50);
	border-radius: 1rem;

	& > div {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}
}

.math-choices {
	--gap: 0.5rem;
	--padding: 0.5rem;

	position: relative;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: var(--gap);
	width: 100%;
	padding: var(--padding);

	border: 2px solid var(--grey-50);
	border-radius: 0.5rem;

	list-style: none;

	li {
		margin: 0;
		cursor: pointer;

		width: 100%;
		height: 100%;
		padding: 0.5rem;

		text-align: center;

		z-index: 10;
	}

	&::after {
		content: '';

		position: absolute;
		left: calc(
			25% * v-bind('currentMathMethod') +
				(var(--padding) / (v-bind('currentMathMethod') + 1))
		);

		display: block;
		width: calc(25% - var(--gap));
		height: calc(100% - var(--padding) * 2);
		background-color: var(--grey-100);
		border-radius: 0.25rem;

		transition: left 300ms cubic-bezier(0.25, 0.8, 0.25, 1);
	}
}

.math-inputs {
	display: flex;
	align-items: flex-end;
	gap: 1rem;

	.input-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;

		label {
			font-weight: 600;
			color: var(--grey-50);
		}
	}

	input {
		padding: 0;
		border: none;
		background: none;

		width: 3ch;
		transition: width 100ms ease;

		font-size: 3rem;
		font-weight: bold;
		color: white;
		text-align: center;

		/* Remove arrows Firefox */
		-moz-appearance: textfield;
		/* Remove arrows Chrome, Safari, Edge, Opera */
		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}

		&:focus-visible {
			outline: none;
			border: none;
		}

		&::placeholder {
			color: var(--grey-50);
		}
	}

	.math-operator {
		font-size: 2rem;
		font-weight: bold;
		color: var(--grey-200);
		height: 50px;
	}
}

.math-result {
	font-size: 5rem;
	font-weight: bold;
}
</style>
