var HierarchyManager = {
	

	textdoc: {

		download: function(text, name, extension)
		{
			var filename = `${name}.${extension}`;
			var file = new Blob([text], {type: "text/plain"});
			if (window.navigator.msSaveOrOpenBlob)
				window.navigator.msSaveOrOpenBlob(file, filename);
			else { 
				var url = URL.createObjectURL(file);
				var a = document.createElement("a");
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				setTimeout(function() {
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);  
				}, 100); 
			}
		},

		upload: async function(extensions="any")
		{
			var finput = document.createElement("input");
			finput.id = "finput";
			finput.setAttribute("type", "file");
			if (extensions != "any")
				finput.setAttribute("accept", extensions);
			document.body.appendChild(finput);
			finput.click();
			await HierarchyManager.textdoc._fileIsPicked(finput);	
			if (!finput.files || finput.files.length == 0)
				return false;
			try
			{
				var file = finput.files[0];
				var reader = new FileReader();
				reader.readAsText(file);
				await HierarchyManager.textdoc._fileIsRead(reader);
				return reader.result;
			}
			catch
			{
				return false;
			}
		},

		_fileIsPicked: function(input) {
			// thanks https://stackoverflow.com/a/63045131
			return new Promise(function(resolve, reject) {
				input.addEventListener('change', function(){resolve()});
				input.addEventListener('cancel', function(){resolve()});
			});
		},

		_fileIsRead: function(reader) {
			return new Promise(function(resolve, reject){
				reader.addEventListener('load', function(){resolve()});
			});
		}
		
	},

	updateExplorerCaller: function(caller, oldName, newName) {
		if (!caller)
			return;
		caller.innerHTML = newName;
		ContextMenu.caller.parentElement.setAttribute("onclick",
			ContextMenu.caller.parentElement.getAttribute("onclick").replace(oldName, newName));
	},

	circuit: {

		create: function(name=null) {
			window.sim.circuits.addChild(new Circuit(name));
			Explorer.itemAdd("circuit", window.sim.circuits.lastChild.name);
		},

		delete: function(name, caller=null) {
			window.sim.circuits.children[name].remove();
			if (caller)
				caller.parentElement.remove();
		},

		show: function(name, caller=null) {
			window.sim.circuitMakeVisible(name);
			HierarchyManager.windowActivate("simViewport");
			if (caller)
				Explorer.highlight(caller);
		},

		rename: function(name, caller=null) {
			var newName = window.prompt("New circuit name:");
			window.sim.circuits.children[name].name = newName;
			HierarchyManager.updateExplorerCaller(caller, name, newName);
		},

		download: function(name) {
			var jsonText = JSON.stringify(window.sim.circuitActiveGet().export(), null, 4);
			HierarchyManager.textdoc.download(jsonText, `${window.sim.meta.name}-${name}`, "acirc");
		},

		upload: function() {
			HierarchyManager.textdoc.upload(".acirc").then((text) => {
				if (text===false)
					return;
				var json = JSON.parse(text);
				var name = json.name;
				var counter = 2;
				while (window.sim.circuits.children[name])
				{ // prevent having two circuits with the same name
					name = `${json.name}-${counter}`;
					counter += 1; 
				}
				json.name = name;
				HierarchyManager.circuit.create(json.name);
				window.sim.circuits.lastChild.import(json);
			});
			
		}

	},

	note: {

		create: function(name=`note${bmco.timestamp().substr(3,8)}`, contents="Note text") {
			window.sim.notes[name] = btoa(contents);
			Explorer.itemAdd("note", name);
		},

		delete: function(name, caller=null) {
			delete window.sim.notes[name];
			if (caller)
				caller.parentElement.remove();
		},

		show: function(name, caller=null) {
			document.getElementById("noteText").innerHTML = atob(window.sim.notes[name]);
			HierarchyManager.windowActivate("noteArea");
			if (caller)
				Explorer.highlight(caller);
		},

		rename: function(name, caller=null) {
			var newName = window.prompt("New note name:");
			window.sim.notes[newName] = window.sim.notes[name];
			delete window.sim.notes[name];
			HierarchyManager.updateExplorerCaller(caller, name, newName);
		},

		edit: function() {
			HierarchyManager.windowActivate("noteEditor");
			var name = Explorer.getHighlighted();
			var text = atob(window.sim.notes[name]);
			if (text.indexOf("<pre>") == 0)
				text = text.replace("<pre>", "");
			if (text.lastIndexOf("</pre>") == text.length - 6)
				text = text.substring(0, text.length - 6);
			document.getElementById("noteEditArea").value = text;
		},

		save: function(type="html") {
			var text = document.getElementById("noteEditArea").value; 
			if (type == "plaintext")
			{
				if (text.indexOf("<pre>") == -1 )
					text = `<pre>${text}`;
				if (text.indexOf("</pre>") == -1 )
					text = `${text}</pre>`;
			}
			var text64 = btoa(text);
			var name = Explorer.getHighlighted();
			window.sim.notes[name] = text64;
			HierarchyManager.note.show(name);
		}
	},

	project: {

		download: function() {
			var json = window.sim.export();
			var text = JSON.stringify(json, null, 4);
			HierarchyManager.textdoc.download(text, window.sim.meta.name, "alice");
		},

		upload: async function() {
			text = await HierarchyManager.textdoc.upload(".alice");
			if (text===false)
				return;
			document.getElementById("explorer").innerHTML = "";
			await Explorer.onload();
			var json = JSON.parse(text);
			window.sim.import(json);
			document.getElementById("explorerCircuits").getElementsByTagName("li")[0].click();
		}

	},

	windowActive: null,
	
	windowActivate(id) {
		if (!document.getElementById(id))
			return;
		for (var el of document.getElementsByClassName("mainWindow"))
			el.classList.add("invisible");
		document.getElementById(id).classList.remove("invisible");
		HierarchyManager.windowActive = id;
		ToolBar.load(id)
	},

	onload: async function() {
		HierarchyManager.circuit.create();
		HierarchyManager.circuit.show(window.sim.circuits.firstChild.name,
			document.getElementById("explorerCircuits").lastChild.firstChild);
	}

}
