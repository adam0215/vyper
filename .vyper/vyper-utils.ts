import crypto from 'crypto'

export function hashFilename(filename: string) {
	return crypto.createHash('md5').update(filename).digest('hex')
}

export function getProcedureId(assocFilename: string, funcIdent: string) {
	return crypto
		.createHash('md5')
		.update(assocFilename + funcIdent)
		.digest('hex')
}
