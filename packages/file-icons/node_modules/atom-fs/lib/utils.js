"use strict";

const fs   = require("fs");
const path = require("path");

// Non-breaking fs functions
const lstat    = nerf(fs.lstatSync);
const realpath = nerf(fs.realpathSync);

module.exports = {
	nerf,
	normalisePath,
	sipFile,
	statify,
	realpath,
	lstat: path => statify(lstat(path, {bigint: true})),
};


/**
 * Generate an exception-proof version of a function.
 *
 * @param {Function} fn
 * @param {Object} [context]
 * @return {Function}
 */
function nerf(fn, context = null){
	if("function" !== typeof fn)
		throw new TypeError("Argument must be a function");
	
	let lastError = null;
	const handler = function(...args){
		let result = null;
		try      { result = fn.call(context, ...args); }
		catch(e) { lastError = e; }
		return result;
	};
	return Object.defineProperty(handler, "lastError", {
		get: () => lastError,
		set: to => lastError = to
	});
}


/**
 * Normalise path separators.
 *
 * Well-formed URIs (those prefixed by `protocol://`)
 * are returned unmodified unless `clobber` is truthy.
 *
 * @example "C:\User\foo\..\bar" -> "C:/User/bar"
 * @param {String} input
 * @param {Boolean} [clobber=false]
 * @return {String}
 */
function normalisePath(input, clobber = false){
	if(!clobber && /^\w*:\/\//.test(input))
		return input;
	input = path.resolve(input || "");
	return "win32" === process.platform
		? input.replace(/\\/g, "/")
		: input;
}


/**
 * Synchronously read a number of bytes from a file.
 *
 * Previously named "sampleFile", renamed to eliminate ambiguity.
 * 
 * @param {String} path   - Path to file
 * @param {Number} length - Maximum number of bytes to read
 * @param {Number} offset - Offset to start reading from
 * @return {Array} An array of two values: the loaded data-string, and a
 * boolean indicating if the file was small enough to be fully loaded.
 */
function sipFile(path, length, offset = 0){
	if(!path || length < 1)
		return [null, false];
	
	let data = Buffer.alloc(length);
	const fd = fs.openSync(path, "r");
	const bytesRead = fs.readSync(fd, data, 0, length, offset);
	
	let isComplete = false;
	
	data = data.toString();
	if(bytesRead < data.length){
		isComplete = true;
		data = data.substring(0, bytesRead);
	}
	
	return [data, isComplete];
}


/**
 * Normalise the properties of an {@link fs.Stats}-like structure
 *
 * FIXME: This is a mess. We should have implemented a wrapper class for
 * stats instead of this song-and-dance with {@link Object.create}. This
 * has become problematic now that we have {@link BigIntStats} to handle
 * (see file-icons/atom-fs#10).
 *
 * @see {@link https://nodejs.org/api/all.html#fs_class_fs_stats}
 * @param {Object} input
 * @return {fs.Stats}
 * @internal
 */
function statify(input){
	if(!input) return input;
	
	if("function" === typeof input.isSymbolicLink
	&& "function" === typeof input.isDirectory)
		return input;
	
	const output = Object.create(fs.Stats.prototype);
	for(const key in input){
		const value = input[key];
		
		if("bigint" === typeof value)
			continue;
		
		switch(key){
			case "atime":
			case "ctime":
			case "mtime":
			case "birthtime":
				output[key] = !(value instanceof Date)
					? new Date(value)
					: value;
				break;
			case "mode":
			case "blocks":
			case "gid":
			case "nlink":
			case "rdev":
			case "uid":
				output[key] = Number(value);
				break;
			default:
				output[key] = value;
		}
	}
	
	return output;
}
