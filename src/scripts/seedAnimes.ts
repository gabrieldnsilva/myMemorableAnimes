import Anime from '../models/Anime';
import { testConnection, syncDatabase } from '../config/database';

// Anime data from animeData.js (converted to TypeScript structure)
const animeSeedData = [
  {
    title: 'Naruto Shippuden',
    synopsis:
      'Naruto Uzumaki, um jovem ninja impulsivo e determinado, retorna à sua vila natal, Konoha, após dois anos e meio de treinamento intenso com Jiraiya...',
    genre: 'Shōnen',
    year: '2004',
    rating: '12+',
    duration: '1h 49m',
    imageUrl: '/src/assets/images/titles/narutoShippuden-title.webp',
    backgroundImage: 'narutoShippuden-background.webp',
  },
  {
    title: 'Demon Slayer',
    synopsis:
      'Tanjirou Kamado é um bondoso garoto de família que vende carvão para sustentar sua mãe e seus irmãos mais novos. Um dia, ao voltar para casa, ele encontra sua família brutalmente assassinada por demônios...',
    genre: 'Shōnen',
    year: '2019',
    rating: '16+',
    duration: '1h 26m',
    imageUrl: '/src/assets/images/titles/demonSlayer-title.webp',
    backgroundImage: 'demonSlayer-background-2.webp',
  },
  {
    title: 'Jujutsu Kaisen',
    synopsis:
      'Yuuji Itadori é um estudante do ensino médio que possui uma força física extraordinária. Apesar de sua habilidade, ele prefere levar uma vida normal e evitar envolvimento com o oculto...',
    genre: 'Shōnen',
    year: '2020',
    rating: '16+',
    duration: '1h 45m',
    imageUrl: '/src/assets/images/titles/jujutsuKaisen-title.webp',
    backgroundImage: 'jujutsuKaisen-background.webp',
  },
  {
    title: 'Attack on Titan',
    synopsis:
      'Em um mundo onde a humanidade vive dentro de cidades cercadas por enormes muralhas devido aos Titãs, criaturas humanoides gigantes que devoram humanos...',
    genre: 'Shōnen',
    year: '2013',
    rating: '16+',
    duration: '1h 57m',
    imageUrl: '/src/assets/images/titles/attackOnTitan-title.webp',
    backgroundImage: 'attackOnTitan-background.webp',
  },
  {
    title: 'Sousou no Frieren',
    synopsis:
      'Após a derrota do Rei Demônio, a heroína humana Himmel e seus companheiros, o anão Eisen e o elfo Frieren, embarcam em uma jornada para explorar o mundo e viver novas aventuras...',
    genre: 'Shōnen',
    year: '2023',
    rating: '12+',
    duration: '1h 30m',
    imageUrl: '/src/assets/images/titles/sousouNoFrieren-title.webp',
    backgroundImage: 'sousouNoFrieren-background.webp',
  },
];

async function seedAnimes() {
  try {
    console.log('🌱 Starting anime database seed...');

    // Connect to database
    await testConnection();
    await syncDatabase();

    // Check if animes already exist
    const count = await Anime.count();
    if (count > 0) {
      console.log(`⚠️  Database already has ${count} animes. Skipping seed.`);
      console.log('💡 To re-seed, delete the database and run again.');
      process.exit(0);
    }

    // Insert animes
    const createdAnimes = await Anime.bulkCreate(animeSeedData);
    console.log(`✅ Successfully seeded ${createdAnimes.length} animes!`);

    // Display created animes
    createdAnimes.forEach((anime) => {
      console.log(`  - ${anime.title} (${anime.year}) - ID: ${anime.id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed
seedAnimes();
