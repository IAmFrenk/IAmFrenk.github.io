const projects = [
    {
        title: "Donkey Kong 64 Font Typer",
        description: "A browser-based PNG font typer that renders text from DK64-style symbol images and exports the result.",
        href: "projects/dk64-font-typer/",
        date: "7 July 2026",
        datetime: "2026-07-07"
    },
    {
        title: "Frenkmod Drafter",
        description: "A Civilization V drafter used for multiplayer Frenkmod games. With my own custom civs: Mikeronesia, Liechtenstijn, Iekeland, and Frenkrijk.",
        href: "projects/civ5-drafter/",
        date: "Sep 1, 2024",
        datetime: "2024-09-01"
    },
    {
        title: "Elden Ring Optimal Starting Class Calculator",
        description: "A calculator that compares Elden Ring starting classes against a target stat spread and ranks them by minimum level.",
        href: "projects/elden-ring-starting-class-calculator/",
        date: "31 March 2022",
        datetime: "2022-03-31"
    }
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
		<div class="project-meta">
			<span><time datetime="${project.datetime}">${project.date}</time></span>
		</div>
	`;

    return card;
}

if (projectList) {
    const fragment = document.createDocumentFragment();
    [...projects]
        .sort((a, b) => b.datetime.localeCompare(a.datetime))
        .forEach((project) => fragment.appendChild(createProjectCard(project)));
    projectList.appendChild(fragment);
}
