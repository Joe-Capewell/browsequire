(function (window) {
	async function appendScript(scriptText, name) {
		return new Promise(function (resolve, reject) {
			var entryBlob = new Blob([scriptText], { type: "text/javascript" });
			var scriptTag = document.createElement("script");
			scriptTag.setAttribute("src", URL.createObjectURL(entryBlob));
			scriptTag.addEventListener("load", function () {
				console.log(
					"loaded module script " +
						name +
						" in " +
						performance.now().toString() +
						"ms"
				);
				resolve();
			});
			document.querySelector("body").appendChild(scriptTag);
		});
	}

	async function findAsFile(module) {
		var request = await fetch(module);
		if (request.status === 200) {
			return await request.text();
		} else {
			return false;
		}
	}

	async function findAsModule(module) {
		var modulePath = "browsequire/modules/" + module;
		var packageRequest = await fetch(modulePath + "/package.json");
		if (packageRequest.status === 200) {
			var main = (await packageRequest.json()).main;
			return await findAsFile(modulePath + "/" + main);
		} else {
			return false;
		}
	}

	function fixRequire(text) {
		var regex = /require\((.*)\)/;
		var requireOccurences = [];
		var temp = text;
		while (temp.match(regex)) {
			requireOccurences.push(temp.match(regex)[0]);
			temp = temp.split(temp.match(regex)[0])[1];
		}
		requireOccurences.map(function (string) {
			text = text.replace(string, `(await ${string})`);
		});
		return text;
	}

	var require = async function (module) {
		var mainScript = await findAsModule(module);
		if (mainScript === false) {
			mainScript = await findAsFile(module);
		}
		if (mainScript === false) {
			throw new Error("could not find module " + module);
		}
		var encodedName = encodeURIComponent(module);
		var mainScript = `(function(){
			window.browsequire.scripts["${encodedName}"]=async function(require){
				var module=this;
				module.exports={};
				exports=module.exports;
				${fixRequire(mainScript)};
				return this;
			}
		})(window)`;
		await appendScript(mainScript, module);
		var temp = {};
		return (
			await window.browsequire.scripts[encodedName].apply(temp, [require])
		).exports;
	};

	window.browsequire = {
		scripts: {},
		begin: async function (path) {
			var request = await fetch(path);
			var responseText = await request.text();

			var entryScript = `
				window.browsequire.start=async (require)=>{
					${fixRequire(responseText)}
			}`;
			await appendScript(entryScript, "entry");
			window.browsequire.start.apply(window, [require]);
			console.log(
				"browsequire completed in " + performance.now().toString() + "ms"
			);
		},
	};

	var buffer = document.createElement("script");
	buffer.setAttribute("src", "buffer.js");
	document.querySelector("body").appendChild(buffer);
})(window);
