
window.onload = async function() {
{		
	window.sim = new Sim(GLOBAL_sizing);
	await Explorer.onload();
	await ContextMenu.onload();
	await HierarchyManager.onload();
	window.sim.onload();

}}

