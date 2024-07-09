var HierarchyManager = {
	

	textdoc: {
		save: function() {

		},
		load: function() {

		},
		callback: function() {

		},
	},

	circuit: {

		create: function() {
			window.sim.circuits.addChild( 
				new Circuit(window.sim.circuits._getIndex()) );
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
			if (caller)
			{
				caller.innerHTML = newName;
				ContextMenu.caller.parentElement.setAttribute("onclick",
					ContextMenu.caller.parentElement.getAttribute("onclick").replace(name, newName));
			}
		},

		import: function() {

		},

		export: function() {

		}
	},

	note: {

		create: function(name=`note${bmco.timestamp().substr(3,8)}`, contents="Note text") {
			window.sim.notes[name] = btoa(contents);
			Explorer.itemAdd("note", name);
		},

		delete: function() {

		},

		show: function(name, caller=null) {
			document.getElementById("noteText").innerHTML = atob(window.sim.notes[name]);
			HierarchyManager.windowActivate("noteArea");
			if (caller)
				Explorer.highlight(caller);
		},

		rename: function() {

		},

		import: function() {

		},

		export: function() {

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
		var data = await bmco.httpRequest("./data/manual.html") 
		var htmlText = data.substring(data.indexOf("<article>")+9, data.indexOf("</article>")).replaceAll("\n\t", "\n");
			HierarchyManager.note.create("instructions", htmlText);
	}

}