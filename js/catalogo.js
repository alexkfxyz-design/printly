// Catálogo inicial de la tienda (precios en MXN, IVA incluido). Se carga la primera vez; luego los cambios del panel se guardan en el navegador.
// Para agregar fotos a un producto, pon la imagen en img/productos/ y añade su ruta en "photos" (la primera es la portada).
// Si editas este archivo, sube el número de "version" para que los navegadores carguen el catálogo nuevo.
const DEFAULT_CATALOG = {
  "version": 3,
  "categories": [
    {
      "id": "ropa",
      "name": "Ropa"
    },
    {
      "id": "tazas",
      "name": "Tazas, termos y tarros"
    },
    {
      "id": "accesorios",
      "name": "Accesorios"
    }
  ],
  "colors": [
    {
      "id": "blanco",
      "name": "Blanco",
      "hex": "#FFFFFF"
    },
    {
      "id": "negro",
      "name": "Negro",
      "hex": "#1E1D22"
    },
    {
      "id": "jaspeado",
      "name": "Gris jaspeado",
      "hex": "#B9B7B5"
    },
    {
      "id": "marino",
      "name": "Azul marino",
      "hex": "#1F2A44"
    },
    {
      "id": "rojo",
      "name": "Rojo",
      "hex": "#BE3A31"
    },
    {
      "id": "mostaza",
      "name": "Mostaza",
      "hex": "#DCA22C"
    },
    {
      "id": "botella",
      "name": "Verde botella",
      "hex": "#1F4D3A"
    },
    {
      "id": "rosa",
      "name": "Rosa palo",
      "hex": "#E9B7BA"
    },
    {
      "id": "lila",
      "name": "Lila",
      "hex": "#B8A4D8"
    },
    {
      "id": "vino",
      "name": "Vino",
      "hex": "#5E1F2E"
    }
  ],
  "sizes": [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL"
  ],
  "techniques": [
    {
      "id": "sublimacion",
      "name": "Sublimación",
      "add": 0,
      "desc": "Full color que no se siente al tacto. Para poliéster, prendas claras y superficies sublimables."
    },
    {
      "id": "dtf",
      "name": "DTF textil",
      "add": 30,
      "desc": "Full color sobre cualquier color de prenda. Resiste bien el lavado."
    },
    {
      "id": "vinil",
      "name": "Vinil",
      "add": 20,
      "desc": "Nombres, frases y logos de 1 o 2 colores sólidos."
    },
    {
      "id": "serigrafia",
      "name": "Serigrafía",
      "add": 0,
      "desc": "La opción más económica en volumen (desde 12 piezas)."
    },
    {
      "id": "bordado",
      "name": "Bordado",
      "add": 60,
      "desc": "Acabado premium y muy duradero, ideal para logos."
    },
    {
      "id": "uvdtf",
      "name": "UV DTF",
      "add": 35,
      "desc": "Sticker full color para vidrio, acero y acrílico."
    },
    {
      "id": "foto",
      "name": "Impresión fotográfica",
      "add": 0,
      "desc": "Foto en papel fotográfico dentro del llavero."
    }
  ],
  "materials": [
    {
      "id": "alg-peinado",
      "name": "Algodón 100% peinado",
      "add": 0,
      "desc": "Suave y fresco. El más pedido.",
      "techs": [
        "dtf",
        "vinil",
        "serigrafia",
        "bordado"
      ]
    },
    {
      "id": "alg-pima",
      "name": "Algodón premium heavyweight",
      "add": 60,
      "desc": "Tela gruesa de 220 g, más suave y durable.",
      "techs": [
        "dtf",
        "vinil",
        "serigrafia",
        "bordado"
      ]
    },
    {
      "id": "poliester",
      "name": "Poliéster dry-fit",
      "add": -15,
      "desc": "Deportivo y ligero. Perfecto para sublimación.",
      "techs": [
        "sublimacion",
        "dtf",
        "vinil"
      ]
    },
    {
      "id": "franela",
      "name": "Felpa perchada",
      "add": 0,
      "desc": "Calientita por dentro, ideal para sudaderas.",
      "techs": [
        "dtf",
        "vinil",
        "serigrafia",
        "bordado"
      ]
    },
    {
      "id": "ceramica",
      "name": "Cerámica blanca AAA",
      "add": 0,
      "desc": "Apta para microondas y lavavajillas.",
      "techs": [
        "sublimacion"
      ]
    },
    {
      "id": "magica",
      "name": "Cerámica mágica",
      "add": 60,
      "desc": "Negra en frío; el diseño aparece con la bebida caliente.",
      "techs": [
        "sublimacion"
      ]
    },
    {
      "id": "vidrio",
      "name": "Vidrio transparente",
      "add": 0,
      "desc": "Tarro grueso de 400 ml.",
      "techs": [
        "vinil",
        "uvdtf"
      ]
    },
    {
      "id": "acero",
      "name": "Acero inoxidable",
      "add": 0,
      "desc": "Doble pared, mantiene la temperatura.",
      "techs": [
        "sublimacion",
        "uvdtf",
        "vinil"
      ]
    },
    {
      "id": "acrilico",
      "name": "Acrílico transparente",
      "add": 0,
      "desc": "Funda con foto intercambiable.",
      "techs": [
        "foto",
        "uvdtf"
      ]
    },
    {
      "id": "mdf",
      "name": "MDF sublimable",
      "add": 5,
      "desc": "Ligero, impreso a todo color.",
      "techs": [
        "sublimacion"
      ]
    },
    {
      "id": "drill",
      "name": "Gabardina de algodón",
      "add": 0,
      "desc": "Gorra de 6 paneles con ajustador.",
      "techs": [
        "bordado",
        "dtf",
        "vinil"
      ]
    },
    {
      "id": "lona",
      "name": "Manta de algodón",
      "add": 0,
      "desc": "Resistente, asas largas.",
      "techs": [
        "dtf",
        "vinil",
        "serigrafia"
      ]
    }
  ],
  "products": [
    {
      "id": "polo-oversize",
      "name": "Playera oversize",
      "cat": "ropa",
      "shape": "tee",
      "base": 260,
      "minQty": 1,
      "active": true,
      "desc": "Hombro caído y tela gruesa. Para diseños grandes en la espalda.",
      "mats": [
        "alg-peinado",
        "alg-pima"
      ],
      "colors": [
        "negro",
        "blanco",
        "jaspeado",
        "vino",
        "botella"
      ],
      "useSizes": true,
      "sizes": [
        "S",
        "M",
        "L",
        "XL",
        "XXL"
      ],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        },
        {
          "key": "espalda",
          "label": "Espalda",
          "extra": 60
        }
      ],
      "photos": [
        "img/productos/oversize-1.webp",
        "img/productos/oversize-2.webp",
        "img/productos/oversize-3.webp",
        "img/productos/oversize-4.webp",
        "img/productos/oversize-5.webp"
      ],
      "badge": "Más pedido"
    },
    {
      "id": "polo-clasico",
      "name": "Playera clásica",
      "cat": "ropa",
      "shape": "tee",
      "base": 180,
      "minQty": 1,
      "active": true,
      "desc": "Corte regular, cuello redondo. El lienzo de siempre.",
      "mats": [
        "alg-peinado",
        "alg-pima",
        "poliester"
      ],
      "colors": [
        "blanco",
        "negro",
        "jaspeado",
        "marino",
        "rojo",
        "mostaza",
        "botella",
        "rosa",
        "lila",
        "vino"
      ],
      "useSizes": true,
      "sizes": [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL"
      ],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        },
        {
          "key": "espalda",
          "label": "Espalda",
          "extra": 50
        },
        {
          "key": "manga_izq",
          "label": "Manga izquierda",
          "extra": 30
        },
        {
          "key": "manga_der",
          "label": "Manga derecha",
          "extra": 30
        }
      ],
      "photos": [
        "img/productos/polo-1.webp",
        "img/productos/polo-2.webp"
      ],
      "badge": ""
    },
    {
      "id": "tomatodo",
      "name": "Termo de acero 20 oz",
      "cat": "tazas",
      "shape": "tumbler",
      "base": 320,
      "minQty": 1,
      "active": true,
      "desc": "Con tapa y doble pared. Regalo corporativo favorito.",
      "mats": [
        "acero"
      ],
      "colors": [
        "blanco",
        "negro",
        "rosa",
        "lila"
      ],
      "useSizes": false,
      "sizes": [],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        },
        {
          "key": "reverso",
          "label": "Reverso",
          "extra": 40
        }
      ],
      "photos": [
        "img/productos/tomatodo-4.webp",
        "img/productos/tomatodo-1.webp",
        "img/productos/tomatodo-2.webp",
        "img/productos/tomatodo-3.webp",
        "img/productos/tomatodo-5.webp"
      ],
      "badge": "Regalo ideal"
    },
    {
      "id": "jarro",
      "name": "Tarro cervecero",
      "cat": "tazas",
      "shape": "beer",
      "base": 160,
      "minQty": 1,
      "active": true,
      "desc": "Vidrio grueso con asa. Ideal para nombres.",
      "mats": [
        "vidrio"
      ],
      "colors": [],
      "useSizes": false,
      "sizes": [],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        }
      ],
      "photos": [
        "img/productos/jarro-1.webp",
        "img/productos/jarro-2.webp",
        "img/productos/jarro-3.webp",
        "img/productos/jarro-4.webp",
        "img/productos/jarro-5.webp"
      ],
      "badge": "Con tu nombre"
    },
    {
      "id": "llavero",
      "name": "Llavero",
      "cat": "accesorios",
      "shape": "keychain",
      "base": 45,
      "minQty": 1,
      "active": true,
      "desc": "Con tu foto, tu logo o tu frase favorita.",
      "mats": [
        "acrilico",
        "mdf"
      ],
      "colors": [],
      "useSizes": false,
      "sizes": [],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        },
        {
          "key": "reverso",
          "label": "Reverso",
          "extra": 10
        }
      ],
      "photos": [
        "img/productos/llavero-1.webp",
        "img/productos/llavero-2.webp"
      ],
      "badge": ""
    },
    {
      "id": "polera",
      "name": "Sudadera con capucha",
      "cat": "ropa",
      "shape": "hoodie",
      "base": 450,
      "minQty": 1,
      "active": true,
      "desc": "Bolsa canguro y gorro forrado.",
      "mats": [
        "franela"
      ],
      "colors": [
        "negro",
        "jaspeado",
        "marino",
        "vino",
        "botella",
        "blanco"
      ],
      "useSizes": true,
      "sizes": [
        "S",
        "M",
        "L",
        "XL",
        "XXL"
      ],
      "zones": [
        {
          "key": "frente",
          "label": "Pecho",
          "extra": 0
        },
        {
          "key": "espalda",
          "label": "Espalda",
          "extra": 60
        },
        {
          "key": "manga_izq",
          "label": "Manga izquierda",
          "extra": 35
        },
        {
          "key": "manga_der",
          "label": "Manga derecha",
          "extra": 35
        }
      ],
      "photos": [],
      "badge": ""
    },
    {
      "id": "taza",
      "name": "Taza 11 oz",
      "cat": "tazas",
      "shape": "mug",
      "base": 120,
      "minQty": 1,
      "active": true,
      "desc": "La clásica de regalo. Diseño a uno o ambos lados.",
      "mats": [
        "ceramica",
        "magica"
      ],
      "colors": [],
      "useSizes": false,
      "sizes": [],
      "zones": [
        {
          "key": "frente",
          "label": "Lado derecho",
          "extra": 0
        },
        {
          "key": "reverso",
          "label": "Lado izquierdo",
          "extra": 20
        }
      ],
      "photos": [],
      "badge": ""
    },
    {
      "id": "gorra",
      "name": "Gorra",
      "cat": "accesorios",
      "shape": "cap",
      "base": 180,
      "minQty": 1,
      "active": true,
      "desc": "Seis paneles, visera curva y ajustador.",
      "mats": [
        "drill"
      ],
      "colors": [
        "negro",
        "blanco",
        "marino",
        "botella",
        "mostaza"
      ],
      "useSizes": false,
      "sizes": [],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        },
        {
          "key": "lateral",
          "label": "Lateral",
          "extra": 35
        }
      ],
      "photos": [],
      "badge": ""
    },
    {
      "id": "tote",
      "name": "Tote bag",
      "cat": "accesorios",
      "shape": "bag",
      "base": 150,
      "minQty": 1,
      "active": true,
      "desc": "Bolsa de manta para el día a día.",
      "mats": [
        "lona"
      ],
      "colors": [
        "blanco",
        "negro"
      ],
      "useSizes": false,
      "sizes": [],
      "zones": [
        {
          "key": "frente",
          "label": "Frente",
          "extra": 0
        },
        {
          "key": "reverso",
          "label": "Reverso",
          "extra": 40
        }
      ],
      "photos": [],
      "badge": ""
    }
  ],
  "settings": {
    "shopName": "Printly",
    "currency": "$",
    "whatsapp": "",
    "payNumber": "",
    "payHolder": "",
    "pickupAddress": "",
    "deliveryFee": 99,
    "deliveryNote": "Envío local o por paquetería a todo México",
    "normalDays": 5,
    "rushDays": 2,
    "rushPct": 25,
    "depositPct": 50,
    "designFee": 100,
    "payMethods": [
      "Transferencia SPEI",
      "Depósito en OXXO",
      "Tarjeta de débito o crédito",
      "Efectivo al recoger"
    ],
    "discounts": [
      {
        "qty": 6,
        "pct": 5
      },
      {
        "qty": 12,
        "pct": 10
      },
      {
        "qty": 50,
        "pct": 18
      }
    ]
  }
};
