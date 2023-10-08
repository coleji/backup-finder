import * as fs from 'fs';
import * as path from 'path';

const [_a, _b, source, dest, vmid] = process.argv

if (
	source === undefined ||
	dest === undefined || 
	vmid === undefined
) process.exit(1)

const regex = /^(vzdump-(?:lxc|qemu))-(\d+)-(\d{4}_\d{2}_\d{2}-\d{2}_\d{2}_\d{2})\.(.+)$/

const files = fs.readdirSync(source)

type HashResult = {[k: string]: {dateString: string, files: {original: string, link: string}[]}};

const hash: HashResult = files.reduce((agg, f) => {
	// console.log(f)
	const result = regex.exec(f)
	if (!result) process.exit(1)
	// console.log(result)
	const [filename, prefix, vm, dateString, extension] = result
	if (vm !== vmid) return agg;
	
	const link = `${prefix}-${vm}.${extension}`
	const fileObj = {
		original: filename,
		link: link
	}

	if (
		agg[vm] === undefined || 
		agg[vm].dateString < dateString
	) {
		agg[vm] = {
			dateString,
			files: [fileObj]
		}
	} else if (agg[vm].dateString === dateString) {
		agg[vm].files = [...agg[vm].files, fileObj]
	}

	return agg;
}, {} as HashResult)

Object.keys(hash).forEach(vm => {
	// console.log(vm, hash[vm].files)
	hash[vm].files.forEach(f => fs.linkSync(
		path.join(source, f.original),
		path.join(dest, f.link)
	))
})