// Lokasi: src/utils/nameGenerator.js

const ADJECTIVES = [
  'Cerdik', 'Cepat', 'Kuat', 'Bijak', 'Unik', 'Gesit', 'Tangguh',
  'Jenaka', 'Misterius', 'Elegan', 'Sederhana', 'Juara'
];

const ANIMALS = [
  'Panda', 'Elang', 'Harimau', 'Kancil', 'Serigala', 'Naga',
  'Kuda', 'Merpati', 'Rajawali', 'Macan', 'Penyu', 'Lumba-lumba'
];

export const generateRandomName = () => {
  const randomAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${randomAdjective} ${randomAnimal}`;
};