import { animesData } from "./../data/animeData.js";
import { changeBackground } from "./modules/carousel.js";
import { initAuth } from "./modules/auth.js";
import { initContactForm } from "./modules/form.js";

/** updateAnimeContent as before, but use changeBackground for consistency */
function updateAnimeContent(animeKey) {
	const anime = animesData[animeKey];
	if (!anime) return;

	const container = document.getElementById("anime-content-container");
	container.innerHTML = "";

	const contentDiv = document.createElement("div");
	contentDiv.className = `content ${animeKey}`;

	const titleImage = document.createElement("img");
	titleImage.className = "anime-title";
	titleImage.src = anime.titleImage;
	titleImage.alt = `${animeKey.replace(/([A-Z])/g, " $1")} Title`;
	titleImage.width = 280;
	titleImage.height = 120;

	const details = document.createElement("h4");
	details.innerHTML = `
        <span>${anime.year}</span>
        <span><i>${anime.rating}</i></span>
        <span>${anime.duration}</span>
        <span>${anime.genre}</span>
    `;

	const synopsis = document.createElement("p");
	const synopsisLabel = document.createElement("span");
	synopsisLabel.textContent = "Sinopse: ";
	synopsis.appendChild(synopsisLabel);
	synopsis.append(anime.synopsis);

	const buttonDiv = document.createElement("div");
	buttonDiv.className = "button";
	buttonDiv.innerHTML = `
        <a href="#" class="watch-now" aria-label="Assistir Agora"><i class="ri-play-circle-line"></i>Assistir Agora</a>
        <a href="#" class="add-to-list" aria-label="Adicionar à Lista"><i class="ri-add-line"></i>Adicionar à Lista</a>
    `;

	contentDiv.appendChild(titleImage);
	contentDiv.appendChild(details);
	contentDiv.appendChild(synopsis);
	contentDiv.appendChild(buttonDiv);
	container.appendChild(contentDiv);

	requestAnimationFrame(() => contentDiv.classList.add("active"));

	// use changeBackground module for consistency with other code
	changeBackground(anime.background, animeKey);
}

// --- Inicialização ---
document.addEventListener("DOMContentLoaded", () => {
	if (window.M) {
		// sidenav
		const sidenav = document.querySelectorAll(".sidenav");
		M.Sidenav.init(sidenav, { edge: "left" });
	}

	// Init auth/form modules
	initAuth();
	initContactForm();

	// Carousel init
	const carouselElem = document.querySelector(".carousel");
	const carouselBox = document.querySelector(".carousel-box");

	if (carouselElem && window.M) {
		const instances = M.Carousel.init(carouselElem, {
			padding: 20,
			numVisible: 5,
			indicators: true,
			noWrap: false,
			ariaLabel: "Carrossel de Animes",
			onCycleTo: (activeItem) => {
				if (
					carouselBox &&
					!carouselBox.classList.contains("initialized")
				) {
					carouselBox.classList.add("initialized");
				}
				const animeKey = activeItem.dataset.animekey;
				if (animeKey) updateAnimeContent(animeKey);
			},
		});

		// Add keyboard navigation for accessibility
		document.addEventListener("keydown", (event) => {
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				instances.prev();
			} else if (event.key === "ArrowRight") {
				event.preventDefault();
				instances.next();
			}
		});

		// Improve accessibility for indicators
		const indicators = carouselElem.querySelector(".indicators");
		if (indicators) {
			indicators.setAttribute(
				"aria-label",
				"Indicadores do Carrossel de Animes"
			);
			const indicatorButtons = indicators.querySelectorAll("li");
			indicatorButtons.forEach((button, index) => {
				button.setAttribute(
					"aria-label",
					`Ir para o anime ${index + 1}`
				);
			});
		}

		// Ensure first item shown on load after images are ready to avoid layout shift
		const firstItem = carouselElem.querySelector(
			".carousel-item[data-animekey]"
		);

		if (firstItem) {
			const imgs = Array.from(carouselElem.querySelectorAll("img"));

			// helper to run when all images are loaded (or errored)
			const whenImagesReady = (images, cb) => {
				let remaining = images.length;
				if (!remaining) return cb();
				images.forEach((img) => {
					if (img.complete) {
						remaining -= 1;
						if (!remaining) cb();
					} else {
						img.addEventListener("load", () => {
							remaining -= 1;
							if (!remaining) cb();
						});
						img.addEventListener("error", () => {
							remaining -= 1;
							if (!remaining) cb();
						});
					}
				});
			};

			whenImagesReady(imgs, () => {
				// mark carousel box initialized (fade in without layout jump)
				if (carouselBox) carouselBox.classList.add("initialized");

				// update content for first slide
				const firstKey = firstItem.dataset.animekey;
				if (firstKey) updateAnimeContent(firstKey);

				// Force a layout recalculation in Materialize to ensure centering
				try {
					// instances is a NodeList or single instance depending on selection
					if (instances && instances.toArray) {
						instances.toArray().forEach((i) => i._setup());
					} else if (instances && instances._setup) {
						instances._setup();
					}
				} catch (event) {
					// fallback: dispatch resize so layout engines recalc
					window.dispatchEvent(new Event("resize"));
				}
			});
		}
	}
});
