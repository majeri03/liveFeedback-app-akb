const ADJECTIVES = [
  'Cerdik', 'Cepat', 'Kuat', 'si paling', 'sang legenda kelas A', 'noname', 'Tangguh',
  'Jenaka', 'Misterius', 'x', 'Intropert', 'Juara'
];

const ANIMALS = [
  'Panda', 'Garuda', 'Harimau', 'Kancil', 'Serigala', 'Naga',
  'Kuda', 'Merpati', 'tikus', 'Macan', 'kucing', 'Lumba-lumba'
];

export const generateRandomName = () => {
  const randomAdjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${randomAdjective} ${randomAnimal}`;
};