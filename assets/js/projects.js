const projects = [
	{
		title: "Civ 5 Drafter",
		description: "A Civilization V drafter used for multiplayer Frenkmod games. With my own custom civs: Mikeronesia, Liechtenstijn, Iekeland, and Frenkrijk.",
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
