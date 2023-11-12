import fs from "fs/promises"
import path from "path"

export const clearOrCreateDirectory = async (dirPath: string): Promise<void> => {
	try {
		// Check if directory exists
		const dirExists = await fs
			.stat(dirPath)
			.then(() => true)
			.catch(() => false)

		if (dirExists) {
			// Read all files and directories within the directory
			const files = await fs.readdir(dirPath)

			// Iterate and remove each item inside the directory
			for (const file of files) {
				const filePath = path.join(dirPath, file)
				const stat = await fs.stat(filePath)

				if (stat.isDirectory()) {
					await fs.rm(filePath, { recursive: true }) // Remove directories recursively
				} else {
					await fs.unlink(filePath) // Remove files
				}
			}
		} else {
			// If directory does not exist, create it
			await fs.mkdir(dirPath, { recursive: true })
		}
	} catch (error) {
		throw new Error(`Failed to clear or create directory: ${error}`)
	}
}
