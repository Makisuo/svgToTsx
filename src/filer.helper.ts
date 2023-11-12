import { BunFile } from "bun"
import * as fs from "fs/promises"
import * as path from "path"
import { capitalizeFirstLetter, removeSpaces, replaceSpecialCharacters } from "./utils"

interface ReturnedFile {
	name: string
	path: string
	nested: boolean
	file: BunFile
	fileName: string
}

export const traverseFolder = async (
	folderPath: string,
	nested = false,
	depth = 0,
	parentFolderName = "",
): Promise<ReturnedFile[]> => {
	const files = await fs.readdir(folderPath)
	const returnedFiles: ReturnedFile[] = []

	for (const file of files) {
		if (file === ".DS_Store") continue

		const fullPath = path.join(folderPath, file)

		if (!path.extname(file)) {
			const updatedFolderName =
				depth === 0
					? formatName(file.toLowerCase())
					: parentFolderName + capitalizeFirstLetter(formatName(file))
			returnedFiles.push(...(await traverseFolder(fullPath, true, depth + 1, updatedFolderName)))
		} else {
			const formattedFileName = formatName(file.replace(path.extname(file), ""))
			// Determine the name based on whether the folder name is a subset of the file name
			const name =
				parentFolderName.toLowerCase() === formattedFileName.toLowerCase().slice(0, parentFolderName.length)
					? formattedFileName
					: parentFolderName + capitalizeFirstLetter(formattedFileName)

			returnedFiles.push({
				name,
				path: folderPath,
				fileName: file,
				nested,
				file: Bun.file(fullPath),
			})
		}
	}

	return returnedFiles
}

const formatName = (name: string) => {
	return removeSpaces(replaceSpecialCharacters(toCamelCase(name)))
}

function toCamelCase(str: string): string {
	return str
		.split(/[.\s_,-]+/)
		.map((word, index) =>
			index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
		)
		.join("")
}
