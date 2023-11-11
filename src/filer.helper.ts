import fs from "fs/promises"
import path from "path"
import { camelize, numberToWord, startsWithNumber } from "./utils"
import { BunFile } from "bun"

export const traverseFolder = async (folderPath: string, nested = false, depth = 0, nearestPath?: string) => {
	const files = await fs.readdir(folderPath)

	const returnedFiles: { name: string; path: string; nested: boolean; file: BunFile; fileName: string }[] = []

	for (const file of files) {
		if (file === ".DS_Store") {
			continue
		}

		// If it a folder => traverse deeper
		if (path.extname(file) === "") {
			returnedFiles.push(...(await traverseFolder(`${folderPath}/${file}`, true, depth + 1, file)))
		} else {
			let name = camelize(file.replace(".svg", "").replace(/[^\w\s-]/gi, ""))

			if (name === "webhook") {
				console.log(name)
			}
			if (
				name.toLowerCase() !== nearestPath?.toLowerCase() &&
				!name.toLowerCase().includes(nearestPath?.toLowerCase() || "") &&
				depth > 1
			) {
				name = camelize(nearestPath + name.replace(/^\w/, (c) => c.toUpperCase()))
			} else {
				if (name === "") {
					name = camelize(nearestPath || "noNameManualRequired")
				} else {
					if (!isNaN(Number(name))) {
						name = camelize(`${nearestPath}${name}`)
					} else if (startsWithNumber(name)) {
						name = numberToWord(Number(name.charAt(0))) + name.slice(1)
					}
				}
			}

			returnedFiles.push({
				name: name,
				path: folderPath,
				fileName: file,
				nested,
				file: Bun.file(`${folderPath}/${file}`),
			})
		}
	}

	return returnedFiles
}
