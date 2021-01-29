#!/usr/bin/node
const fs = require("fs");
const { spawn } = require("child_process");

var command = process.argv[2];
var dir = process.cwd();
if (command === "init") {
	console.log("copying browsequire...");
	fs.mkdirSync("browsequire/modules", { recursive: true });
	fs.createReadStream(__dirname + "/browsequire.js").pipe(
		fs.createWriteStream(dir + "/browsequire/main.js")
	);
	fs.createReadStream(__dirname + "/feross-buffer.js").pipe(
		fs.createWriteStream(dir + "/browsequire/buffer.js")
	);
	console.log("done");
} else if (command === "add") {
	name = process.argv[3];
	console.log("adding package " + name);
	var child = spawn("npm", ["install", "--prefix", __dirname, name]);
	child.stderr.on("data", function (data) {
		console.log(data.toString("utf8"));
	});
	child.stdout.on("end", function () {
		console.log("copying package");
		installedPath = __dirname + "/node_modules/" + name;
		installPath = dir + "/browsequire/modules/" + name;
		fs.mkdirSync(dir + "/browsequire/modules/" + name, { recursive: true });
		copyRecursive(installedPath, installPath);
	});
} else {
	console.log("command not found");
}

function copyRecursive(source, target) {
	if (source[source.length - 1] !== "/") {
		source += "/";
	}
	if (target[target.length - 1] !== "/") {
		target += "/";
	}
	var files = [];
	var dirs = [];
	var contents = fs.readdirSync(source);
	for (var i = 0; i < contents.length; i++) {
		var name = contents[i];
		if (fs.lstatSync(source + name).isDirectory()) {
			dirs.push(name);
		} else {
			files.push(name);
		}
	}
	for (var i = 0; i < files.length; i++) {
		fs.copyFileSync(source + files[i], target + files[i]);
	}
	for (var i = 0; i < dirs.length; i++) {
		fs.mkdirSync(target + dirs[i]);
		copyRecursive(source + dirs[i], target + dirs[i]);
	}
}
