function sublimadColor(name, swatch, hex, img, alt) {
  return { name, swatch, hex, img, alt };
}

function sublimadLead(colors, name) {
  const index = colors.findIndex((color) => color.name === name);
  if (index <= 0) return colors;
  return colors.slice(index).concat(colors.slice(0, index));
}

function sublimadCapHombreColors() {
  return [
    sublimadColor('Negro', 'bg-black border-2 border-gray-300', '#111827', 'img/audiencia/hombre-gorra-negra.jpg', 'Hombre con gorra negra'),
    sublimadColor('Verde', 'bg-green-600 border-2 border-gray-300', '#16a34a', 'img/gorras/verde.jpg', 'Hombre con gorra verde')
  ];
}

function sublimadCapMujerColors() {
  return [
    sublimadColor('Negro', 'bg-black border-2 border-gray-300', '#111827', 'img/gorras/negra.jpg', 'Mujer con gorra negra'),
    sublimadColor('Celeste', 'bg-sky-400 border-2 border-gray-300', '#38bdf8', 'img/gorras/celeste.jpg', 'Mujer con gorra celeste')
  ];
}

function sublimadCapNinoColors() {
  return [
    sublimadColor('Negro', 'bg-black border-2 border-gray-300', '#111827', 'img/audiencia/nino-gorra-atras.jpg', 'Niño con gorra negra'),
    sublimadColor('Beige', 'bg-amber-200 border-2 border-gray-300', '#f5deb3', 'img/audiencia/nino-gorra-roja.jpg', 'Niño con gorra beige')
  ];
}

function sublimadCapNinaColors() {
  return [
    sublimadColor('Negro', 'bg-black border-2 border-gray-300', '#111827', 'img/audiencia/nina-gorra.jpg', 'Niña con gorra negra')
  ];
}

function sublimadMugColor(img, alt) {
  return [
    { name: 'Blanco', swatch: 'bg-white border-2 border-gray-400', img, alt }
  ];
}

function sublimadPoloHombreColors() {
  return [
    sublimadColor('Blanco', 'bg-white border-2 border-gray-400', '#f8fafc', 'img/polos/blanca.jpg', 'Hombre con polo blanco'),
    sublimadColor('Negro', 'bg-black border-2 border-gray-300', '#111827', 'img/audiencia/hombre-polo-producto.jpg', 'Hombre con polo negro'),
    sublimadColor('Celeste', 'bg-sky-300 border-2 border-gray-300', '#7dd3c7', 'img/polos/celeste.jpg', 'Hombre con polo celeste'),
    sublimadColor('Rojo', 'bg-red-600 border-2 border-gray-300', '#dc2626', 'img/polos/roja.jpg', 'Hombre con polo rojo')
  ];
}

function sublimadPoloMujerColors() {
  return [
    sublimadColor('Verde', 'bg-green-700 border-2 border-gray-300', '#15803d', 'img/polos/verde.jpg', 'Mujer con polo verde'),
    sublimadColor('Azul', 'bg-blue-900 border-2 border-gray-300', '#1e3a8a', 'img/audiencia/mujer-polo-negro2.jpg', 'Mujer con polo azul'),
    sublimadColor('Rayas', 'bg-red-600 border-2 border-gray-300', '#dc2626', 'img/audiencia/mujer-polo-rayas.jpg', 'Mujer con polo a rayas')
  ];
}

function sublimadPoloNinoColors() {
  return [
    sublimadColor('Azul', 'bg-blue-600 border-2 border-gray-300', '#2563eb', 'img/audiencia/nino-polo-blanco.jpg', 'Niño con polo azul')
  ];
}

function sublimadPoloNinaColors() {
  return [
    sublimadColor('Fucsia', 'bg-pink-600 border-2 border-gray-300', '#db2777', 'img/audiencia/nina-polo.jpg', 'Niña con polo fucsia')
  ];
}

const SUBLIMAD_DEFAULT_CATALOG = {
  banners: [
    {
      id: 'banner-polos',
      name: 'Polos para Programadores',
      description: 'Polos con estampado para el día a día del taller.',
      discount: 0,
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbP9C6xTQyw0MtOnZzubhSYay5dKlbsB9gDpr4bmL_hTZUVxAaMD3fNDNJ&s=10'
    },
    {
      id: 'banner-medida',
      name: 'Polos y Gorras a tu Medida',
      description: 'Prendas personalizadas listas para sublimar.',
      discount: 0,
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbE-LPvOdM3sf0Iu4M7Bwh4rgnF2_uefhb9aVZAdnQ2Q&s=10'
    },
    {
      id: 'banner-gorras',
      name: 'Gorras Personalizadas',
      description: 'Gorras con diseño a tu medida.',
      discount: 0,
      img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpcTolPAJHT9EAn7-yROcyjJ-jHv9Uu9OGI_tTI7nYHbjn_vGGX0tTf9w&s=10'
    },
    {
      id: 'banner-taza',
      name: 'Taza "Java" para Programadores',
      description: 'Taza temática para el escritorio.',
      discount: 0,
      img: 'https://m.media-amazon.com/images/I/81uh1HEFYuL.jpg'
    }
  ],
  garments: [
    {
      id: 'polo',
      group: 'polo',
      audience: 'hombres',
      slideId: 'slide-polos',
      colorLabelId: 'polo-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Polo Programador "FullStack"',
      description: 'Algodón 100% reactivo con estampado DTF.',
      price: 45,
      img: 'img/polos/blanca.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: sublimadPoloHombreColors()
    },
    {
      id: 'polo-hombre-classic',
      group: 'polo',
      audience: 'hombres',
      slideId: 'slide-polo-hombre-classic',
      colorLabelId: 'polo-hombre-classic-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Polo Clásico "Backend"',
      description: 'Polo de hombre, corte regular, listo para sublimar.',
      price: 40,
      img: 'img/audiencia/hombre-polo-producto.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: sublimadLead(sublimadPoloHombreColors(), 'Negro')
    },
    {
      id: 'polo-mujer-fit',
      group: 'polo',
      audience: 'mujeres',
      slideId: 'slide-polo-mujer-fit',
      colorLabelId: 'polo-mujer-fit-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Polo Dama "Frontend"',
      description: 'Polo de mujer, corte entallado, algodón para estampado DTF.',
      price: 42,
      img: 'img/audiencia/mujer-polo-negro2.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: sublimadLead(sublimadPoloMujerColors(), 'Azul')
    },
    {
      id: 'polo-mujer-oversize',
      group: 'polo',
      audience: 'mujeres',
      slideId: 'slide-polo-mujer-oversize',
      colorLabelId: 'polo-mujer-oversize-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Polo Dama Oversize "UX"',
      description: 'Polo de mujer oversize, cómodo para el día a día.',
      price: 46,
      img: 'img/polos/verde.jpg',
      sizes: ['S', 'M', 'L', 'XL'],
      colors: sublimadPoloMujerColors()
    },
    {
      id: 'polo-nino',
      group: 'polo',
      audience: 'ninos',
      slideId: 'slide-polo-nino',
      colorLabelId: 'polo-nino-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Polo Niño "Mini Dev"',
      description: 'Polo de niño en algodón, tallas infantiles.',
      price: 32,
      img: 'img/audiencia/nino-polo-blanco.jpg',
      sizes: ['6', '8', '10', '12', '14'],
      colors: sublimadPoloNinoColors()
    },
    {
      id: 'polo-nina',
      group: 'polo',
      audience: 'ninos',
      slideId: 'slide-polo-nina',
      colorLabelId: 'polo-nina-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Polo Niña "Pixel"',
      description: 'Polo de niña en algodón, listo para personalizar.',
      price: 32,
      img: 'img/audiencia/nina-polo.jpg',
      sizes: ['6', '8', '10', '12', '14'],
      colors: sublimadPoloNinaColors()
    },
    {
      id: 'gorra',
      group: 'gorra',
      audience: 'hombres',
      slideId: 'slide-gorras',
      colorLabelId: 'cap-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Gorra Trucker "Developer"',
      description: 'Malla transpirable con parche bordado/sublimado.',
      price: 25,
      img: 'img/audiencia/hombre-gorra-negra.jpg',
      colors: sublimadCapHombreColors()
    },
    {
      id: 'gorra-hombre-snap',
      group: 'gorra',
      audience: 'hombres',
      slideId: 'slide-gorra-hombre-snap',
      colorLabelId: 'gorra-hombre-snap-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Gorra Snapback "Commit"',
      description: 'Gorra de hombre, visera plana, lista para sublimar.',
      price: 28,
      img: 'img/gorras/verde.jpg',
      colors: sublimadLead(sublimadCapHombreColors(), 'Verde')
    },
    {
      id: 'gorra-mujer',
      group: 'gorra',
      audience: 'mujeres',
      slideId: 'slide-gorra-mujer',
      colorLabelId: 'gorra-mujer-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Gorra Dama "Frontend"',
      description: 'Gorra de mujer, corte liviano para el día a día.',
      price: 25,
      img: 'img/gorras/negra.jpg',
      colors: sublimadCapMujerColors()
    },
    {
      id: 'gorra-mujer-trucker',
      group: 'gorra',
      audience: 'mujeres',
      slideId: 'slide-gorra-mujer-trucker',
      colorLabelId: 'gorra-mujer-trucker-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Gorra Dama Trucker "UX"',
      description: 'Gorra trucker de mujer con malla transpirable.',
      price: 27,
      img: 'img/gorras/celeste.jpg',
      colors: sublimadLead(sublimadCapMujerColors(), 'Celeste')
    },
    {
      id: 'gorra-nino',
      group: 'gorra',
      audience: 'ninos',
      slideId: 'slide-gorra-nino',
      colorLabelId: 'gorra-nino-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Gorra Niño "Mini Dev"',
      description: 'Gorra infantil de niño, lista para personalizar.',
      price: 20,
      img: 'img/audiencia/nino-gorra-atras.jpg',
      colors: sublimadCapNinoColors()
    },
    {
      id: 'gorra-nina',
      group: 'gorra',
      audience: 'ninos',
      slideId: 'slide-gorra-nina',
      colorLabelId: 'gorra-nina-color-name',
      colorPrompt: 'Selecciona Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Gorra Niña "Pixel"',
      description: 'Gorra infantil de niña, lista para sublimar.',
      price: 20,
      img: 'img/audiencia/nina-gorra.jpg',
      colors: sublimadCapNinaColors()
    },
    {
      id: 'mug',
      group: 'mug',
      audience: 'medianas',
      slideId: 'slide-tazas',
      colorLabelId: 'mug-color-name',
      colorPrompt: 'Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Taza Cerámica "Coffee & Code"',
      description: 'Taza mediana de cerámica premium, 11oz, acabado brillante.',
      price: 20,
      img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&auto=format&fit=crop&q=80',
      colors: sublimadMugColor('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&auto=format&fit=crop&q=80', 'Taza mediana blanca')
    },
    {
      id: 'mug-mediana-java',
      group: 'mug',
      audience: 'medianas',
      slideId: 'slide-mug-mediana-java',
      colorLabelId: 'mug-mediana-java-color-name',
      colorPrompt: 'Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Taza Mediana "Java"',
      description: 'Taza mediana 11oz para el escritorio.',
      price: 22,
      img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&auto=format&fit=crop&q=80',
      colors: sublimadMugColor('https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700&auto=format&fit=crop&q=80', 'Taza mediana Java')
    },
    {
      id: 'mug-grande-latte',
      group: 'mug',
      audience: 'grandes',
      slideId: 'slide-mug-grande-latte',
      colorLabelId: 'mug-grande-latte-color-name',
      colorPrompt: 'Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Taza Grande "Latte"',
      description: 'Taza grande 15oz, ideal para bebidas largas.',
      price: 28,
      img: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=700&auto=format&fit=crop&q=80',
      colors: sublimadMugColor('https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=700&auto=format&fit=crop&q=80', 'Taza grande Latte')
    },
    {
      id: 'mug-grande-fullstack',
      group: 'mug',
      audience: 'grandes',
      slideId: 'slide-mug-grande-fullstack',
      colorLabelId: 'mug-grande-fullstack-color-name',
      colorPrompt: 'Color:',
      selectedPrompt: 'Color seleccionado:',
      name: 'Taza Grande "Full Stack"',
      description: 'Taza grande de cerámica, 15oz, lista para sublimar.',
      price: 30,
      img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&auto=format&fit=crop&q=80',
      colors: sublimadMugColor('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&auto=format&fit=crop&q=80', 'Taza grande Full Stack')
    }
  ],
  categories: [
    {
      id: 'tintas',
      title: 'Tintas de Sublimación',
      products: [
        { id: 'tinta-cmyk', name: 'Tinta Sublimación CMYK 100ml (Set 4 colores)', price: 65, img: 'https://images.unsplash.com/photo-1703950104186-aeb81511cfd2?w=500&auto=format&fit=crop&q=80' },
        { id: 'tinta-tanque', name: 'Sistema de Tinta Continuo (Tanque)', price: 180, img: 'https://images.unsplash.com/photo-1740884730591-8f4878e2cc64?w=500&auto=format&fit=crop&q=80' },
        { id: 'tinta-1l', name: 'Tinta Sublimación 1L (por color)', price: 85, img: 'https://images.unsplash.com/photo-1758183961426-88d64eb5f787?w=500&auto=format&fit=crop&q=80' },
        { id: 'papel-transfer', name: 'Papel Transfer Sublimación (Paquete x100)', price: 45, img: 'https://images.unsplash.com/photo-1672356203083-a0206308c7ea?w=500&auto=format&fit=crop&q=80' }
      ]
    },
    {
      id: 'impresoras',
      title: 'Impresoras Adaptadas',
      products: [
        { id: 'imp-l3210', name: 'Epson L3210 Adaptada Sublimación', price: 950, img: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=80' },
        { id: 'imp-l1800', name: 'Epson L1800 A3 Adaptada', price: 1450, img: 'https://images.unsplash.com/photo-1706895040634-62055892cbbb?w=500&auto=format&fit=crop&q=80' },
        { id: 'imp-dtf', name: 'Impresora DTF Formato Ancho', price: 3200, img: 'https://images.unsplash.com/photo-1693031630369-bd429a57f115?w=500&auto=format&fit=crop&q=80' },
        { id: 'imp-ecotank', name: 'Sistema EcoTank Modificado', price: 780, img: 'https://images.unsplash.com/photo-1650094980833-7373de26feb6?w=500&auto=format&fit=crop&q=80' }
      ]
    },
    {
      id: 'dtf',
      title: 'Metros DTF Impreso',
      products: [
        { id: 'dtf-personalizado', name: 'Metro DTF Diseño Personalizado (60cm)', price: 35, img: 'https://images.unsplash.com/photo-1678872844677-d650b788709b?w=500&auto=format&fit=crop&q=80' },
        { id: 'dtf-full', name: 'Metro DTF Full Color (60cm)', price: 40, img: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&auto=format&fit=crop&q=80' },
        { id: 'dtf-blanco', name: 'Metro DTF Blanco Denso (60cm)', price: 38, img: 'https://images.unsplash.com/photo-1600805624740-ebe68a29ac69?w=500&auto=format&fit=crop&q=80' },
        { id: 'dtf-rollo', name: 'Rollo DTF por Metro (Mayoreo x10m)', price: 320, img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80' }
      ]
    }
  ]
};
