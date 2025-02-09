import { parse } from '@vue/compiler-sfc'
import crypto from 'crypto'

import vyperParsePython from './vyper-parse-python'
import { createWriteStream } from 'node:fs'

export default function vyperTransform(
	src: string,
	id: string,
	vyperServerPath: string
) {
	console.log(`[Vyper] Processing Vue file: ${id}`)

	const { descriptor } = parse(src, {
		filename: id,
		sourceMap: true,
	})

	const pythonBlocks = descriptor.customBlocks.filter(
		(b) => b.type === 'python'
	)

	const pythonTagRegex = /<python>(.*?)<\/python>/gs

	const parsedPythonBlocks = [...pythonBlocks].flatMap((b) => {
		return vyperParsePython(b.content)
	})

	const fileStream = createWriteStream(vyperServerPath, { flags: 'a' })

	const allGlobalVariables = parsedPythonBlocks
		.flatMap((b) => b.variableAssignmentExpressions)
		.flat()
		.filter((i) => i !== null)

	const fileNameHash = crypto.createHash('md5').update(id).digest('hex')
	// Create Python dictionary on file endpoint that return all global variables on request
	try {
		console.log('[Vyper] Appending a "File Endpoint" to server')

		// Skip creating endpoints for blocks without variables
		if (allGlobalVariables.length > 0) {
			fileStream.write(
				'\n\n' +
					`@app.get("/fe_${fileNameHash}")\n` +
					`def fe_${fileNameHash}():\n${allGlobalVariables
						.map((v) => '\t' + v.src)
						.join('\n')}\n\treturn ${createVariableEndpointDict(
						allGlobalVariables.map((v) => v.ident)
					)}`
			)
		}
	} catch (e) {
		console.error(e)
	}

	parsedPythonBlocks.forEach((b) => {
		// Filename + Function identifier
		b.functionBlocks.forEach((f) => {
			let procEndpointHash = crypto
				.createHash('md5')
				.update(id + f.ident)
				.digest('hex')

			try {
				console.log('[Vyper] Appending a "Procedure Endpoint" to server')
				fileStream.write(
					'\n\n' + `@app.get("/pe_${procEndpointHash}")\n` + f.src.trim()
				)
			} catch (e) {
				console.error(e)
			}
		})
	})

	fileStream.end()

	const srcWithRemovedPython = src.replace(pythonTagRegex, '')
	const srcWithAppendedGlobals =
		allGlobalVariables.length < 1
			? srcWithRemovedPython
			: srcWithRemovedPython.trimEnd() +
			  `\n\n<script lang="ts">\nimport { ref } from 'vue'\n${generateGlobalVariableScriptTagContent(
					allGlobalVariables,
					fileNameHash
			  )}\n</script>`

	/* console.log(srcWithAppendedGlobals) */

	return {
		transformed: srcWithAppendedGlobals,
		pythonGlobalVariables: parsedPythonBlocks.flatMap(
			(b) => b.variableAssignmentExpressions
		),
		pythonFunctions: parsedPythonBlocks.flatMap((b) => b.functionBlocks),
	}
}

function createVariableEndpointDict(idents: string[]) {
	return `{${idents
		.map((i) => `"${i}": ${i}`)
		.join(', ')
		.trimEnd()}}`
}

function generateGlobalVariableScriptTagContent(
	variables: {
		ident: string
		src: string
	}[],
	endpointHash: string
) {
	const serverUrl = 'http://localhost:8000'
	let content = ''

	// Create refs
	content += `\n${variables
		.map((v) => `const ${v.ident} = ref(null)`)
		.join('\n')}`

	// Add update logic to then statement
	content += `\nconst fe_${endpointHash} = await fetch("${serverUrl}/fe_${endpointHash}").then(data => data.json()).then((data) => {\n${variables
		.map((v) => `${v.ident}.value = data.${v.ident}`)
		.join('\n')}})\n`

	return content
}
