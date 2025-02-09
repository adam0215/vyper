import path from 'node:path'
import vyperTransform from './vyper-transform.ts'
import { ResolvedConfig } from 'vite'
import { writeFileSync } from 'node:fs'

const fileRegex = /\.vue$/
export default function vyper() {
	let config: ResolvedConfig
	let vyperServerPath: string

	return {
		name: 'vyper',
		enforce: 'pre' as const,
		/* apply: 'build' as const, */

		async configResolved(_config: ResolvedConfig) {
			config = _config
			vyperServerPath = path.resolve(config.root, '.vyper/server/', 'vyper.py')
		},

		buildStart() {
			console.log('Vyper plugin starting')

			const vyperServerPath = path.resolve(
				config.root,
				'.vyper/server/',
				'vyper.py'
			)

			resetVyperServer(vyperServerPath)
		},

		transform(src: string, id: string) {
			const cleanId = id.split('?')[0]

			if (fileRegex.test(id)) {
				const { transformed } = vyperTransform(src, cleanId, vyperServerPath)

				// Generate JS script tag for fetching and exposing global variables

				return {
					code: transformed,
					map: null,
				}
			}
		},

		handleHotUpdate({ file, server }: any) {
			if (file.endsWith('.vue')) {
				console.log(`[Vyper] File: ${file} changed, recompiling`)

				// Reset the Vyper server file before transformation
				resetVyperServer(vyperServerPath)

				const mod = server.moduleGraph.getModuleById(file)
				if (mod) {
					server.moduleGraph.invalidateModule(mod)
					return server.transformRequest(file).then((transformed: string) => {
						if (transformed) {
							server.ws.send({ type: 'full-reload' })
						}
					})
				}
			}
		},
	}
}

function resetVyperServer(serverPath: string) {
	console.log('[Vyper] Reseting server file')

	try {
		// Clear Vyper Server Python File
		writeFileSync(
			serverPath,
			`from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware\n\napp = FastAPI()\n\n\napp.add_middleware(\n\tCORSMiddleware,\n\tallow_origins=["*"],\n\tallow_credentials=True,\n\tallow_methods=["*"],\n\tallow_headers=["*"]\n)\n\n@app.get("/")\ndef main():\n\treturn {"message": "Hello World"}`
		)
	} catch (e) {
		console.error(e)
	}
}
