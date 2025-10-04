import { animesData } from "../data/animeData.js";
import { changeBackground } from "./modules/carousel.js";
import { initAuth } from "./modules/auth.js";
import { initContactForm } from "./modules/form.js";

/**
 * Updates the content displayed for a specific anime.
 * @param {string} animeKey
 */
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

// --- Event Listener Init ---
document.addEventListener("DOMContentLoaded", () => {
	const mobileNavEl = document.getElementById("mobile-nav");
	if (mobileNavEl && mobileNavEl.parentElement !== document.body) {
		document.body.appendChild(mobileNavEl);
	}

	// --- Sidenav: init each element once, with ARIA callbacks ---
	const sidenavEls = Array.from(document.querySelectorAll(".sidenav"));
	const sidenavTrigger = document.querySelector(".sidenav-trigger");

	const sidenavOptions = {
		edge: "left",
		onOpenStart: () => {
			if (sidenavTrigger)
				sidenavTrigger.setAttribute("aria-expanded", "true");

			// ensure overlay is below the sidenav (overlay is added dynamically by Materialize -> use rAF)
			requestAnimationFrame(() => {
				const overlay = document.querySelector(".sidenav-overlay");
				const sidenavEl = document.querySelector(".sidenav");
				if (overlay && sidenavEl) {
					overlay.style.zIndex = "2000";
					overlay.style.pointerEvents = "auto";
					sidenavEl.style.zIndex = "2200";
					sidenavEl.style.pointerEvents = "auto";
				}
			});
		},
		onCloseEnd: () => {
			if (sidenavTrigger)
				sidenavTrigger.setAttribute("aria-expanded", "false");
		},
	};

	// Initialize each sidenav element individually
	const sidenavInstances = sidenavEls.map((el) =>
		M.Sidenav.init(el, sidenavOptions)
	);

	// --- Delegated click handler for modal triggers (desktop + mobile) ---
	document.body.addEventListener("click", (event) => {
		const loginTrigger = event.target.closest(
			"#login-open, #login-open-mobile"
		);
		const contactTrigger = event.target.closest(
			"#contact-open, #contact-open-mobile"
		);

		// Helper to close mobile sidenav if trigger came from mobile menu
		const closeMobileIfNeeded = (triggerEl) => {
			if (!triggerEl) return;
			if (triggerEl.id && triggerEl.id.endsWith("-mobile")) {
				const mobileNavEl = document.getElementById("mobile-nav");
				const mobileSidenav =
					mobileNavEl && M.Sidenav.getInstance(mobileNavEl);
				if (
					mobileSidenav &&
					typeof mobileSidenav.close === "function"
				) {
					mobileSidenav.close();
				}
			}
		};

		if (loginTrigger) {
			event.preventDefault();
			closeMobileIfNeeded(loginTrigger);

			const loginModalEl = document.getElementById("login-modal");
			let loginModalInst =
				loginModalEl && M.Modal.getInstance(loginModalEl);
			if (!loginModalInst && loginModalEl)
				loginModalInst = M.Modal.init(loginModalEl);
			if (loginModalInst) {
				loginModalInst.open();
				const emailInput = document.getElementById("login-email");
				if (emailInput) emailInput.focus();
			}
			return;
		}

		if (contactTrigger) {
			event.preventDefault();
			closeMobileIfNeeded(contactTrigger);

			const contactModalEl = document.getElementById("contact-modal");
			let contactModalInst =
				contactModalEl && M.Modal.getInstance(contactModalEl);
			if (!contactModalInst && contactModalEl)
				contactModalInst = M.Modal.init(contactModalEl);
			if (contactModalInst) {
				contactModalInst.open();
				const nameInput = document.getElementById("name");
				if (nameInput) nameInput.focus();
			}
			return;
		}
	});

	// Init auth/form modules
	initAuth();
	initContactForm();

	/**
	 * Carousel init
	 * This section initializes the carousel and sets up accessibility features.
	 */
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
