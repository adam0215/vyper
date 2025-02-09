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
		.map((n) => ({ ident: n.childForFieldName('name')?.text, src: n.text }))
		.filter((f) => f.ident)

	return {
		variableAssignmentExpressions: variableAssignmentExpressions,
		functionBlocks: functionBlocks,
	}
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
