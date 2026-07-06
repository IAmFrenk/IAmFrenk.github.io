const projects = [
	{
		title: "Civ 5 Drafter",
		description: "Civ 5 Frenkmod Drafter: A Civilization V drafter used for Frenkmod games. Forked from HellBlazer-TV/HellBlazer-TV.github.io, with my own custom civs added: Mikeronesia, Iekeland, Liechtenstijn, and Frenkrijk.",
		href: "projects/civ5-drafter/"
	},
];

const projectList = document.querySelector("#project-list");

function createProjectCard(project) {
	const card = document.createElement("a");
	card.className = "project-card";
	card.href = project.href;
	card.setAttribute("aria-label", `Open ${project.title}`);

	card.innerHTML = `
		<h3>${project.title}</h3>
		<p>${project.description}</p>
	`;

	return card;
}

if (projectList) {
	const fragment = document.createDocumentFragment();
	projects.forEach((project) => fragment.appendChild(createProjectCard(project)));
	projectList.appendChild(fragment);
}
