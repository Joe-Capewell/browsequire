#!/usr/bin/nodeconst fs = require("fs");
const { spawn } = require("child_process");

var command = process.argv[2];
var dir = process.cwd();
if (command === "init") {
	console.log("copying browsequire...");
	fs.createReadStream(__dirname + "/browsequire.js").pipe(
		fs.createWriteStream(dir + "/browsequire.js")
	);
	fs.createReadStream(__dirname + "/feross-buffer.js").pipe(
		fs.createWriteStream(dir + "/buffer.js")
	);
	console.log("setting up browsequire");
	fs.mkdirSync("browsequire");
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
		var copy = spawn("mkdir", [dir + "/browsequire/" + name]);
		copy.stderr.on("data", function (data) {
			console.log(data.toString("utf8"));
		});
		copy.stdout.on("end", function () {
			var cp = spawn("cp", [
				__dirname + "/node_modules/" + name,
				dir + "/browsequire/" + name,
				"-r",
			]);
			cp.stdout.on("end", function () {
				console.log("done");
			});
			cp.stderr.on("data", function (data) {
				console.log(data.toString("utf8"));
			});
		});
	});
} else {
	console.log("command not found");
}
