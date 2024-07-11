
var Explorer = {

	target: "explorer",
	iconDir: "../gfx/icon/ico16/",

	getElementChildUl: function(elem)
	{
		for (let x of elem.childNodes.values())
			if (x instanceof HTMLUListElement) {return x;}
		return null;
	},

	directoryToggle: function(elem)
	{
		event.stopPropagation();
		var parent = elem.parentNode;
		ul = Explorer.getElementChildUl(parent);
		if (ul == null)
			return;

		if (ul.style.display == "none")
		{
			parent.classList.add("diropen");
			ul.removeAttribute("style");
		}
		else
		{
			parent.classList.remove("diropen");
			ul.style.display = "none"; 
		}
		
	},

	tabsWidthUpdate: function()
	{
		var sb = document.getElementById(Explorer.target);
		sb.style.width = "auto";
		var w = sb.offsetWidth + 16;
		sb.style.width = String(w)+"px";
		document.getElementById("window").style.width = "calc(100% - "+String(w+1)+"px)";
		document.getElementById("window").style.left = String(w)+"px";
	},

	fileLoad: function(path)
	{
		event.stopPropagation();
		bmco.getParamWrite("file", path);
		const dataRoot = "./files/";
		bmco.xml.awaitXmlFromFile( (dataRoot+path).replace("//", "/") ).then(function(xmldoc){
			GLOBAL_workingDoc = xmldoc;
			const template = xmldoc.childNodes[0].tagName;
			templateRender(xmldoc, template);
		});
	},

	buildListLine: function(xmlTag, type)
	{
		var li = document.createElement('li');

		var id = xmlTag.getAttribute("id");
			if (id)
				li.id = id;

		if (xmlTag.nodeName == "item")
		{
			li.classList.add("item");
			
			var a = document.createElement("a");
			var link = xmlTag.getAttribute("link");
			if (link)
				a.setAttribute("href", xmlTag.getAttribute("link"));
	
			if (xmlTag.getAttribute("blank") == "blank")
				a.setAttribute("target", "_blank");
			a.innerHTML = xmlTag.getAttribute("name");
			li.appendChild(a);

			var customIcon = xmlTag.getAttribute("icon");
			if (customIcon)
				li.setAttribute("style", "--icon: url('"+Explorer.iconDir+customIcon+"');");

			var onClick = xmlTag.getAttribute("onclick");
			if (onClick)
				li.setAttribute("onclick", onClick);
							
		}
		else
		{
			li.classList.add("directory");

			if (!type) 
			{
				var control = document.createElement("div");
				control.classList.add("dirControl");
				control.setAttribute("onclick", "Explorer.directoryToggle(this)");
				li.appendChild(control);
			}

			if (type == "root")
				li.setAttribute("root", "root");

			xmlTag.getAttribute("link") == null? type = "span" : type = "a";
			var label = document.createElement(type);
			label.innerHTML = xmlTag.getAttribute("name");
			if (type == "a")
			{
				li.classList.add("notebook");
				label.setAttribute("href", xmlTag.getAttribute("link"));
			}
			
			
			if (xmlTag.getAttribute("noclose") == "noclose")
			{
				li.classList.add("diropen");
				li.setAttribute("noclose", "noclose");	
			}
			li.appendChild(label);

			var vsel = document.createElement("div");
			vsel.classList.add("selectVert");
			li.appendChild(vsel);

		}

		if (xmlTag.getAttribute("menu") && xmlTag.getAttribute("menu") != "")
			li.setAttribute("oncontextmenu", `ContextMenu.show(event, "${xmlTag.getAttribute('menu')}")`);

		var hsel = document.createElement("div");
		hsel.classList.add("selectHor");
		li.appendChild(hsel);

		return li;
	},

	buildDirectory: function(xmlTag, type=null)
	{
		var li = Explorer.buildListLine(xmlTag, type);
		var ul = document.createElement("ul");
		for (var x = 0; x < xmlTag.childNodes.length; x++)
		{
			var child = xmlTag.childNodes[x];
			var newLi = undefined
			if (child.nodeName == "directory")
			{
				newLi = Explorer.buildDirectory(child);
				if (x+1==xmlTag.childNodes.length)
				{
					var selectHide = document.createElement("div");
					selectHide.classList.add("selectHide");
					newLi.appendChild(selectHide);
				}
			}
			else if (child.nodeName == "item")
				newLi = Explorer.buildListLine(child);

			
			ul.appendChild(newLi);
		}

		li.appendChild(ul);
		return li;
	},

	fillDevices: function(xmldoc) {

		// the Devices var should be filled by importing the Device class and then stuff from code/devices
		var allDevicesXmlNode  = bmco.xml.nodeGetByAttributeValue(xmldoc, "directory", "name", "Devices");
		for (const categoryName in Devices) {

			if (bmco.arrayHas(["defaultPackageData", "Device", "Templates"], categoryName))
				continue;

			var categoryXmlNode = xmldoc.createElement("directory");
			categoryXmlNode.setAttribute("name", categoryName);
			for (const deviceName in Devices[categoryName]) {
				Devices[categoryName][deviceName].category = {"name":categoryName, "object":Devices[categoryName]};
				if (Devices[categoryName][deviceName].doNotIndex)
					continue;
				var deviceXmlNode = xmldoc.createElement("item");
				deviceXmlNode.setAttribute("name", deviceName);
				deviceXmlNode.setAttribute("onclick", `window.sim.setTool('${categoryName}.${deviceName}')`);
				categoryXmlNode.appendChild(deviceXmlNode);
			}

			allDevicesXmlNode.appendChild(categoryXmlNode);
		}
	},

	onload: async function(xmlPath = "./data/explorer.xml")
	{
	
		xmldoc = await bmco.xml.awaitXmlFromFile(xmlPath);
		Explorer.fillDevices(xmldoc);// custom addition
		var target = document.getElementById(Explorer.target);
		var ul = document.createElement("ul");
		ul.id = "sitemap";
		var tree = Explorer.buildDirectory(bmco.xml.nodeGetFirstOfTag(xmldoc, "sitemap"), "root");
		ul.appendChild(tree);
		target.appendChild(ul);
		Explorer.closeFolders();
	},

	closeFolders: function()
	{
		var lis = document.getElementById(Explorer.target).getElementsByTagName("li");
		for (var j = 0; j < lis.length; j++)
		{
			if (lis[j].getAttribute("noclose") == "noclose")
				continue;
			var ul = Explorer.getElementChildUl(lis[j]);
			if (ul != null)
				ul.style.display = "none";    
		}
	},

	highlight(itemElement) {
		var previousCaller = document.getElementsByClassName("loadedItem")[0];
		if (previousCaller)
			previousCaller.classList.remove("loadedItem");
		itemElement.classList.add("loadedItem");
	},

	getHighlighted(asElement=false) {
		var li = document.getElementsByClassName("loadedItem")[0];
		return asElement?  li : li.getElementsByTagName("a")[0].innerHTML;
	},

	toggleFolded: function()
	{
		var nav = document.getElementsByTagName("nav");
		if (!nav)
			return;
		nav = nav[0];
		if (nav.classList.contains("folded"))
			return nav.classList.remove("folded");
		return nav.classList.add("folded");

	},

	itemAdd: function(type, name)
	{
		var targetId = `explorer${type.charAt(0).toUpperCase()+type.slice(1)}s`;
		var target = document.getElementById(targetId).getElementsByTagName("ul")[0];
		var li = document.createElement("li");
		li.classList.add("item");
		var ctx = `ContextMenu.show(event, '${type}Edit')`;
		li.innerHTML = `<a oncontextmenu="${ctx}">${name}</a><div class='selectHor'></div>`;
		li.setAttribute("onclick", `HierarchyManager.${type}.show('${name}', this)`);
		target.appendChild(li);
		return li;
	},

}
