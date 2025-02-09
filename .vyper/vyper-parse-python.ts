import Parser from 'tree-sitter'
import Python from 'tree-sitter-python'

export default function vyperParsePython(src: string) {
	console.log('[Vyper] Parsing Python block')

	const parser = new Parser()
	//@ts-ignore
	parser.setLanguage(Python)
	const tree = parser.parse(src)

	const rootNode = tree.rootNode
	const expStatements = rootNode.descendantsOfType('expression_statement')
	const funcDefinitions = rootNode.descendantsOfType('function_definition')

	const variableAssignmentExpressions = expStatements
		.map((n) => parseAssignment(n))
		.filter((v) => v)
	const functionBlocks = funcDefinitions
		.map((n) => ({
			ident: n.childForFieldName('name')?.text,
			params: parseFunctionParameters(n),
			src: n.text,
		}))
		.filter((f) => f.ident)

	return {
		variableAssignmentExpressions: variableAssignmentExpressions,
		functionBlocks: functionBlocks,
	}
}

function parseFunctionParameters(node: Parser.SyntaxNode) {
	const parameterIdents: string[] = []

	if (node.type !== 'function_definition') return []

	node.children.forEach((c) => {
		if (c.type === 'parameters') {
			c.children.forEach((c) => {
				if (c.type === 'identifier') parameterIdents.push(c.text)
			})
		}
	})

	return parameterIdents
}

function parseAssignment(node: Parser.SyntaxNode) {
	if (node.type !== 'expression_statement') return null

	const firstExpChild = node.child(0)

	if (firstExpChild?.type !== 'assignment') return null

	const identifier = firstExpChild.child(0)

	if (identifier && identifier.type === 'identifier') {
		return { ident: identifier.text, src: firstExpChild.text }
	}

	return null
}
