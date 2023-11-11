#!/usr/bin/env bun

import { BunFile } from "bun"

import path from "path"
import fs from "fs/promises"
import meow from "meow"

import chalk from "chalk"

import gradient from "gradient-string"
import { traverseFolder } from "./filer.helper"
import { capitalizeFirstLetter, toCamelCase } from "./utils"

const log = console.log

log(gradient.instagram("Thanks for using Maki CLI!"))

const generateTypeDefinition = async (outFolder = "./out") => {
	const typesContent = `	
	export interface IconProps  {
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
		const files = await traverseFolder(rootFolder)
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
