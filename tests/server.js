const http = require("http");
const fs = require("fs");
const PORT = 9000;

http
	.createServer(function (req, res) {
		try {
			var path = __dirname + "/web" + req.url;
			console.log("serving " + path);
			fs.exists(path, function (exists) {
				if (exists) {
					fs.lstat(path, function (err, result) {
						if (result.isDirectory()) {
							path += "/index.html";
							fs.exists(path, function (indexExists) {
								if (indexExists) {
									res.writeHead(200);
									fs.createReadStream(path).pipe(res);
								} else {
									res.writeHead(404);
									res.end();
								}
							});
						} else {
							res.writeHead(200);
							fs.createReadStream(path).pipe(res);
						}
					});
				} else {
					res.writeHead(404);
					res.end();
				}
			});
		} catch (e) {
			console.log(e);
			res.writeHead(500);
			res.end();
		}
	})
	.listen(PORT);
