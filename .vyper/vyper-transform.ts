import { parse } from '@vue/compiler-sfc'
import vyperParsePython from './vyper-parse-python'
import { createWriteStream } from 'node:fs'
import { getProcedureId, hashFilename } from './vyper-utils'

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

	const parsedPythonBlocks = [...pythonBlocks].flatMap((b) => {
		return vyperParsePython(b.content)
	})

	const fileStream = createWriteStream(vyperServerPath, { flags: 'a' })

	const allGlobalVariables = parsedPythonBlocks
		.flatMap((b) => b.variableAssignmentExpressions)
		.flat()
		.filter((v) => v) as {
		ident: string
		src: string
	}[]

	const allGlobalFunctions = parsedPythonBlocks
		.flatMap((b) => b.functionBlocks)
		.flat()
		.filter((f) => f.ident) as {
		ident: string
		src: string
	}[]

	const fileNameHash = hashFilename(id)
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

	// Filename + Function identifier
	allGlobalFunctions.forEach((f) => {
		if (!f.ident) return

		let procEndpointHash = getProcedureId(id, f.ident)

		try {
			console.log('[Vyper] Appending a "Procedure Endpoint" to server')
			fileStream.write(
				'\n\n' + `@app.get("/pe_${procEndpointHash}")\n` + f.src.trim()
			)
		} catch (e) {
			console.error(e)
		}
	})

	fileStream.end()

	const srcWithRemovedPython = removePythonBlocks(src)

	let srcWithAppendedGlobals = srcWithRemovedPython

	// Append globals
	if (descriptor.scriptSetup) {
		const setupBlock = descriptor.scriptSetup
		const setupBlockLoc = setupBlock.loc

		const srcWithRemovedSetupBlockContent = removeCodeChunk(
			srcWithRemovedPython,
			setupBlockLoc.start.offset,
			setupBlockLoc.end.offset
		)

		srcWithAppendedGlobals =
			allGlobalVariables.length < 1 && allGlobalFunctions.length < 1
				? srcWithRemovedPython
				: insertCodeAtIndex(
						srcWithRemovedSetupBlockContent.trimEnd(),
						setupBlockLoc.start.offset,
						setupBlock.content +
							`\n${generateGlobalVariableScriptTagContent(
								allGlobalVariables,
								fileNameHash
							)}\n${generateGlobalFunctionScriptTagContent(
								allGlobalFunctions,
								id
							)}\n`
				  )
	} else {
		srcWithAppendedGlobals =
			allGlobalVariables.length < 1 && allGlobalFunctions.length < 1
				? srcWithRemovedPython
				: srcWithRemovedPython.trimEnd() +
				  `\nimport { ref } from 'vue'\n${generateGlobalVariableScriptTagContent(
						allGlobalVariables,
						fileNameHash
				  )}\n${generateGlobalFunctionScriptTagContent(
						allGlobalFunctions,
						id
				  )}\n`
	}

	/* console.log(srcWithAppendedGlobals) */

	return {
		transformed: srcWithAppendedGlobals,
		pythonGlobalVariables: parsedPythonBlocks.flatMap(
			(b) => b.variableAssignmentExpressions
		),
		pythonFunctions: parsedPythonBlocks.flatMap((b) => b.functionBlocks),
	}
}

function removeCodeChunk(src: string, start: number, end: number) {
	return src.slice(0, start) + src.slice(end)
}

function insertCodeAtIndex(src: string, index: number, insertion: string) {
	return src.slice(0, index) + insertion + src.slice(index)
}

function removePythonBlocks(src: string) {
	// TODO: Remove unecessary whitespace that the removal of the Python tags leave in the compiled Vue files
	const pythonTagRegex = /<python>(.*?)<\/python>/gs
	return src.replace(pythonTagRegex, '')
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
	content += `${variables
		.map((v) => `const ${v.ident} = ref(null)`)
		.join('\n')}`

	// Add update logic to then statement
	content += `\n\nonMounted(async () => {\n\tconst fe_${endpointHash} = await fetch("${serverUrl}/fe_${endpointHash}").then(data => data.json()).then((data) => {\n${variables
		.map((v) => `\t${v.ident}.value = data.${v.ident}`)
		.join('\n')}})\n})\n`

	return content
}

function generateGlobalFunctionScriptTagContent(
	functions: {
		ident: string
		src: string
	}[],
	filename: string
) {
	const serverUrl = 'http://localhost:8000'
	let content = ''

	// Create refs
	content += `${functions
		.map(
			(f) =>
				`async function ${
					f.ident
				}() {\n\treturn await fetch("${serverUrl}/pe_${getProcedureId(
					filename,
					f.ident
				)}").then(data => data.json())\n}`
		)
		.join('\n')}`

	return content
}
