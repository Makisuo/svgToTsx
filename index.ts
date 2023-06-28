#!/usr/bin/env bun

import { BunFile } from "bun"

import path from "path"
import fs from "fs/promises"
import meow from "meow"

import chalk from "chalk"

import gradient from "gradient-string"

const log = console.log

log(gradient.instagram("Thanks for using Maki CLI!"))

function camelize(str: string) {
	const first = str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
			return index === 0 ? word.toLowerCase() : word.toUpperCase()
		})
		.replace(/\s+/g, "")
		.replace(/-/g, "")

	return toCamelCase(first)
}

const toCamelCase = (str: string): string => {
	return str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase()
	})
}

function startsWithNumber(s: string): boolean {
	return !isNaN(Number(s.charAt(0)))
}

function capitalizeFirstLetter(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

function numberToWord(num: number): string {
	switch (num) {
		case 0:
			return "Zero"
		case 1:
			return "One"
		case 2:
			return "Two"
		case 3:
			return "Three"
		case 4:
			return "Four"
		case 5:
			return "Five"
		case 6:
			return "Six"
		case 7:
			return "Seven"
		case 8:
			return "Eight"
		case 9:
			return "Nine"
		default:
			return ""
	}
}

const generateTypeDefinition = async (outFolder = "./out") => {
	const typesContent = `	
	export interface IconProps  {
	  class?: string
	  className?: string
	  size?: string | number
	  absoluteStrokeWidth?: boolean
	}
	`

	await Bun.write(`${outFolder}/types.ts`, typesContent)
}

const generateComponent = async (file: BunFile, fileName: string) => {
	const componentName = path.basename(fileName, ".svg")
	const componentFileName = `${componentName}.tsx`

	let svgData = await file.text()

	try {
		// Insert {...props} into the SVG string.
		svgData = svgData.replace(/<svg /, "<svg {...props} ")
		svgData = svgData.replace(/<\/svg>/, `<title>${componentName}Icon</title></svg>`)

		// Replace kebab-case SVG attributes with camelCase.
		svgData = svgData.replace(/<([a-zA-Z]+)([^>]+)>/g, (_, tagName, attrs) => {
			const transformedAttrs = attrs.replace(/([a-z]+(-[a-z]+)*)=".*?"/g, (attr: string) => {
				const [key, value] = attr.split("=")
				const camelizedKey = key.includes("-") ? toCamelCase(key) : key
				return `${camelizedKey}=${value}`
			})

			return `<${tagName}${transformedAttrs}>`
		})

		const componentContent = `
            import { IconProps } from "./types"
            
            export const ${capitalizeFirstLetter(componentName)}Icon = (props: IconProps) => (
                ${svgData}
        	)

			
		`

		await Bun.write(`./out/${componentFileName.toLowerCase()}`, componentContent)
	} catch (err) {
		console.error(`Unable to process file: ${file}`, err)
	}
}

const readFolder = async (folderPath: string, nested = false, depth = 0, nearestPath?: string) => {
	const files = await fs.readdir(folderPath)

	const returnedFiles: { name: string; path: string; nested: boolean; file: BunFile; fileName: string }[] = []

	for (const file of files) {
		if (file === ".DS_Store") {
			continue
		}

		// If it a folder => traverse deeper
		if (path.extname(file) === "") {
			returnedFiles.push(...(await readFolder(`${folderPath}/${file}`, true, depth + 1, file)))
		} else {
			let name = camelize(file.replace(".svg", "").replace(/[^\w\s-]/gi, ""))

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

const cli = meow(
	`
  Usage
    $ svg2Tsx [path]

  Options
    --list, -l  List all SVG files

  Examples
    $ svg2Tsx --list
`,
	{
		flags: {
			list: {
				type: "boolean",
				shortFlag: "l",
			},
		},
		importMeta: import.meta,
	},
)

const start = Date.now()

const main = async () => {
	const { flags, input } = cli

	const rootFolder = input[0] || "./"

	try {
		const files = await readFolder(rootFolder)
		const svgFiles = files.filter((file) => path.extname(file.fileName) === ".svg")

		if (flags.list) {
			svgFiles.forEach((file, index) => {
				log(`[${chalk.yellow(index + 1)}] ${chalk.green(`${file.name}.svg`)}`)
			})

			process.exit(0)
		}

		for (const file of svgFiles) {
			await generateComponent(file.file, file.name)
		}

		await generateTypeDefinition()

		log(`${chalk.gray("Completed generation in ")}${`${`${chalk.green(`${Date.now() - start}ms`)}`}`}`)
	} catch (err) {
		console.error(chalk.red(`Unable to scan directory: ${err}`))
	}
}

main()
