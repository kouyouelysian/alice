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
				"text": "Add new...",
				"onclick": "window.sim.circuitAdd()",
				"icon": "desktop.png"
			}
		],
		"circuitEdit": [
			{
				"text": "Rename",
				"onclick": "window.sim.circuitRename()",
			},
			{
				"text": "Delete",
				"onclick": "window.sim.circuitDelete()",
			},
			{
				"text": "Export Circuit JSON",
				"onclick": "window.sim.circuitExport()",
			}
		],
		"noteNew": [
			{
				"text": "Add new...",
				"onclick": "window.sim.noteAdd()",
				"icon": "desktop.png"
			}
		],
		"noteEdit": [
			{
				"text": "Rename",
				"onclick": "window.sim.noteRename()",
			},
			{
				"text": "Delete",
				"onclick": "window.sim.noteDelete()",
			}
		],
	},

	onload: function(targetId = "contextMenu") {
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
				item.setAttribute("onclick", `ContextMenu.hide(${option.onclick})`);
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

	hide: function(onclickAction) {
		ContextMenu.target.removeAttribute("style");
		ContextMenu.backdrop.removeAttribute("style");
		var d = document.createElement('div');
		d.setAttribute('onclick', onclickAction);
		d.click();
		d.remove();
		ContextMenu.caller = null;
	}

}