var ContextMenu = {

	target: null,
	backdrop: null,
	caller: null,

	presets: {
		"default": [
			{
				"text": "(no menu actions available)"
			}
		],
		"circuitNew": [
			{
				"text": "Create new",
				"onclick": "HierarchyManager.circuit.create()",
				"icon": "desktop.png"
			},
			{
				"text": "Upload existing .acirc",
				"onclick": "HierarchyManager.circuit.upload()",
				"icon": "open.png"
			}
		],
		"circuitEdit": [
			{
				"text": "Rename",
				"onclick": "HierarchyManager.circuit.rename(ContextMenu.caller.innerHTML, ContextMenu.caller)"
			},
			{
				"text": "Delete",
				"onclick": "HierarchyManager.circuit.delete(ContextMenu.caller.innerHTML, ContextMenu.caller)"
			},
			{
				"text": "Download Circuit",
				"onclick": "HierarchyManager.circuit.download(ContextMenu.caller.innerHTML, ContextMenu.caller)"
			},
			{
				"text": "Create IC",
				"onclick": "HierarchyManager.circuit.integrate(ContextMenu.caller.innerHTML, ContextMenu.caller)"
			}
		],
		"noteNew": [
			{
				"text": "Create new",
				"onclick": "HierarchyManager.note.create()",
				"icon": "desktop.png"
			}
		],
		"noteEdit": [
			{
				"text": "Rename",
				"onclick": "HierarchyManager.note.rename(ContextMenu.caller.innerHTML, ContextMenu.caller)"
			},
			{
				"text": "Delete",
				"onclick": "HierarchyManager.note.delete(ContextMenu.caller.innerHTML, ContextMenu.caller)"
			}
		],
	},

	onload: async function(targetId = "contextMenu") {
		ContextMenu.target = document.getElementById(targetId);
		ContextMenu.backdrop = document.getElementById(`${targetId}Backdrop`);
	},

	optionsFill: function(presetName="default") {
		ContextMenu.target.innerHTML = "";
		for (var option of ContextMenu.presets[presetName])
		{
			var item = document.createElement("li");
			item.innerHTML = option.text;
			if (option.onclick)
				item.setAttribute("onclick", `ContextMenu.hide('${option.onclick}')`);
			else
				item.classList.add("inactive");
			if (option.icon)
			{
				item.classList.add("hasIcon");
				var imageHTML = `<img src='./gfx/icon/ico16/${option.icon}'>`
				item.innerHTML = `${imageHTML}${item.innerHTML}`
			}

			ContextMenu.target.appendChild(item);
		}
	}, 
	
	show: function(event, preset="default") {
		event.preventDefault();
		event.stopPropagation();
		ContextMenu.optionsFill(preset);
		ContextMenu.caller = event.target || event.srcElement;
		ContextMenu.target.style.display = "block";
		ContextMenu.target.style.left = `${event.clientX-4}px`;
		ContextMenu.target.style.top = `${event.clientY-4}px`;
		ContextMenu.backdrop.style.display = "block";
	},

	hide: function(onclickAction=null) {
		ContextMenu.target.removeAttribute("style");
		ContextMenu.backdrop.removeAttribute("style");
		if (onclickAction)
		{
			var d = document.createElement('div');
			d.setAttribute('onclick', onclickAction);
			d.click();
			d.remove();
		}
		ContextMenu.caller = null;
	}

}