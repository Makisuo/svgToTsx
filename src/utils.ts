export function camelize(str: string) {
	const first = str
		.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
			return index === 0 ? word.toLowerCase() : word.toUpperCase()
		})
		.replace(/\s+/g, "")
		.replace(/-/g, "")

	return toCamelCase(first)
}

export const toCamelCase = (str: string): string => {
	return str.replace(/-([a-z])/g, function (g) {
		return g[1].toUpperCase()
	})
}

export function replaceSpecialCharacters(string: string): string {
	return string.replace(/@/g, "At")
}

export function startsWithNumber(s: string): boolean {
	return !isNaN(Number(s.charAt(0)))
}

export function capitalizeFirstLetter(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

export function removeSpaces(string: string): string {
	return string.replace(/\s+/g, "")
}

export function toKebabCase(str: string): string {
	return (
		str
			// Insert a hyphen before each uppercase letter
			.replace(/([a-z])([A-Z])/g, "$1-$2")
			// Convert the whole string to lowercase
			.toLowerCase()
	)
}

export function numberToWord(num: number): string {
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
