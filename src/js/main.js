// Importa o objeto com os dados dos animes.
import { animesData } from "../data/animeData.js";

import { changeBackground } from "./modules/carousel.js";

/**
 * Função principal que atualiza o conteúdo da página com base no anime selecionado
 * @param {string} animeKey - A chave do anime no objeto animesData
 */
function updateAnimeContent(animeKey) {
	const anime = animesData[animeKey];
	if (!anime) {
		console.error(`Anime com a chave "${animeKey}" não encontrato.`);
		return;
	}

	const container = document.getElementById("anime-content-container");
	container.innerHTML = ""; // Limpa o conteúdo anterior

	// --- Criação dos elementos do DOM ---
	// createElement e textContent em vez de innerHTML para boa prática de segurança

	const contentDiv = document.createElement("div");
	contentDiv.className = `content ${animeKey}`;

	const titleImage = document.createElement("img");
	titleImage.className = "anime-title";
	titleImage.src = anime.titleImage;
	titleImage.alt = `${animeKey.replace(/([A-Z])/g, " $1")} Title`; // Formata o alt text
	titleImage.width = 280; // Atributos para evitar Layout Shift
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
	synopsis.append(anime.synopsis); // Adiciona o texto da sinopse (segurança)

	const buttonDiv = document.createElement("div");
	buttonDiv.className = "button";
	buttonDiv.innerHTML = `
        <a href="#" class="watch-now" aria-label="Assistir Agora"><i class="ri-play-circle-line"></i>Assistir Agora</a>
        <a href="#" class="add-to-list" aria-label="Adicionar à Lista"><i class="ri-add-line"></i>Adicionar à Lista</a>
    `;

	// Adiciona todos os elementos criados ao container principal
	contentDiv.appendChild(titleImage);
	contentDiv.appendChild(details);
	contentDiv.appendChild(synopsis);
	contentDiv.appendChild(buttonDiv);
	container.appendChild(contentDiv);

	// Isso garante que a animação de transição (transform: scale) funcione corretamente.
	requestAnimationFrame(() => {
		contentDiv.classList.add("active");
	});

	// Atualiza a imagem de fundo do banner
	const banner = document.querySelector(".banner");
	banner.style.backgroundImage = `url('/src/assets/images/backgrounds/${anime.background}')`;
}

/**
 * Função que inicializa todos os componentes da página quando o DOM estiver pronto
 */
function initializeApp() {
	// Inicializa o Sidenav (menu sanduíche)
	const sidenav = document.querySelectorAll(".sidenav");
	M.Sidenav.init(sidenav);

	// Inicializa o Carousel
	const carouselElem = document.querySelectorAll(".carousel");

	// onCycleTo é chamado toda vez que um item do carrossel é selecionado
	M.Carousel.init(carouselElem, {
		padding: 20,
		numVisible: 5,
		indicators: true,
		duration: 300,
		noWrap: false,

		// Função chamada quando o carrossel muda de item
		onCycleTo: (activeItem) => {
			const animeKey = activeItem.dataset.animekey;
			if (animeKey) {
				updateAnimeContent(animeKey);
			}
		},
	});
}
// --- Inicialização da Aplicação ---
// Usamos DOMContentLoaded para garantir que o script só rode após o HTML estar pronto.
document.addEventListener("DOMContentLoaded", initializeApp);
