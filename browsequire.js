(function (window) {
	var getFromBetween = {
		results: [],
		string: "",
		getFromBetween: function (sub1, sub2) {
			if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
				return false;
			var SP = this.string.indexOf(sub1) + sub1.length;
			var string1 = this.string.substr(0, SP);
			var string2 = this.string.substr(SP);
			var TP = string1.length + string2.indexOf(sub2);
			return this.string.substring(SP, TP);
		},
		removeFromBetween: function (sub1, sub2) {
			if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
				return false;
			var removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
			this.string = this.string.replace(removal, "");
		},
		getAllResults: function (sub1, sub2) {
			if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
				return;
			var result = this.getFromBetween(sub1, sub2);
			this.results.push(result);
			this.removeFromBetween(sub1, sub2);
			if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
				this.getAllResults(sub1, sub2);
			} else return;
		},
		get: function (string, sub1, sub2) {
			this.results = [];
			this.string = string;
			this.getAllResults(sub1, sub2);
			return this.results;
		},
	};

	async function appendScript(scriptText) {
		return new Promise(function (resolve, reject) {
			var entryBlob = new Blob([scriptText], { type: "text/javascript" });
			var scriptTag = document.createElement("script");
			scriptTag.setAttribute("src", URL.createObjectURL(entryBlob));
			scriptTag.addEventListener("load", function () {
				console.log("loaded");
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
		var modulePath = "browsequire/" + module;
		var packageRequest = await fetch(modulePath + "/package.json");
		if (packageRequest.status === 200) {
			var main = (await packageRequest.json()).main;
			return await findAsFile(modulePath + "/" + main);
		} else {
			return false;
		}
	}

	function fixRequire(text) {
		var temp = getFromBetween.get(text, "require(", ")");
		var temp2 = temp.map((text) => `require(${text})`);
		for (var i = 0; i < temp.length; i++) {
			text = text.replace(temp2[i], `(await ${temp2[i]})`);
		}
		return text;
	}

	var require = async function (module) {
		var mainScript = await findAsModule(module);
		if (!mainScript) {
			mainScript = await findAsFile(module);
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
		await appendScript(mainScript);
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
			await appendScript(entryScript);
			window.browsequire.start.apply(window, [require]);
		},
	};

	var buffer = document.createElement("script");
	buffer.setAttribute("src", "buffer.js");
	document.querySelector("body").appendChild("buffer");
})(window);
