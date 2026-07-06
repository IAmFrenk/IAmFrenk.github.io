const projects = [
	{
		title: "Civ 5 Drafter",
		description: "A multiplayer Civilization V drafter with custom civs for Frenkmod sessions.",
		href: "projects/civ5-drafter/",
		status: "Live",
		icon: "projects/civ5-drafter/img/frenkrijk.png",
		tags: ["Civ 5", "Drafter", "Frenkmod"],
	},
];

const projectList = document.querySelector("#project-list");

function createProjectCard(project) {
	const card = document.createElement("a");
	card.className = "project-card";
	card.href = project.href;
	card.setAttribute("aria-label", `Open ${project.title}`);

	card.innerHTML = `
		<div class="project-topline">
			<span class="project-icon" aria-hidden="true">
				<img src="${project.icon}" alt="" />
			</span>
			<span class="project-status">${project.status}</span>
		</div>
		<h3>${project.title}</h3>
		<p>${project.description}</p>
		<div class="project-meta">
			${project.tags.map((tag) => `<span>${tag}</span>`).join("")}
		</div>
	`;

	return card;
}

if (projectList) {
	const fragment = document.createDocumentFragment();
	projects.forEach((project) => fragment.appendChild(createProjectCard(project)));
	projectList.appendChild(fragment);
}
