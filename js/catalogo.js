// Catálogo inicial de la tienda. Se carga la primera vez; luego los cambios del panel se guardan en el navegador.
// Para agregar fotos a un producto, pon la imagen en img/productos/ y añade su ruta en "photos" (la primera es la portada).
const DEFAULT_CATALOG = {
  "version": 2,
  "categories": [
    {
      "id": "ropa",
      "name": "Ropa"
    },
    {
      "id": "tazas",
      "name": "Tazas y vasos"
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
      "add": 5,
      "desc": "Full color sobre cualquier color de prenda. Resiste bien el lavado."
    },
    {
      "id": "vinil",
      "name": "Vinil",
      "add": 3,
      "desc": "Nombres, frases y logos de 1 o 2 colores sólidos."
    },
    {
      "id": "serigrafia",
      "name": "Serigrafía",
      "add": 0,
      "desc": "La opción más económica en volumen (desde 12 unidades)."
    },
    {
      "id": "bordado",
      "name": "Bordado",
      "add": 10,
      "desc": "Acabado premium y muy duradero, ideal para logos."
    },
    {
      "id": "uvdtf",
      "name": "UV DTF",
      "add": 6,
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
      "name": "Algodón peinado 30/1",
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
      "name": "Algodón pima",
      "add": 12,
      "desc": "Fibra larga peruana, más suave y durable.",
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
      "add": -3,
      "desc": "Deportivo y liviano. Perfecto para sublimación.",
      "techs": [
        "sublimacion",
        "dtf",
        "vinil"
      ]
    },
    {
      "id": "franela",
      "name": "Franela french terry",
      "add": 0,
      "desc": "Abrigadora por dentro, ideal para poleras.",
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
      "add": 10,
      "desc": "Negra en frío; el diseño aparece con la bebida caliente.",
      "techs": [
        "sublimacion"
      ]
    },
    {
      "id": "vidrio",
      "name": "Vidrio transparente",
      "add": 0,
      "desc": "Jarro grueso de 400 ml.",
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
      "add": 1,
      "desc": "Liviano, impreso a todo color.",
      "techs": [
        "sublimacion"
      ]
    },
    {
      "id": "drill",
      "name": "Drill de algodón",
      "add": 0,
      "desc": "Gorra de 6 paneles con regulador.",
      "techs": [
        "bordado",
        "dtf",
        "vinil"
      ]
    },
    {
      "id": "lona",
      "name": "Lona de algodón",
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
      "name": "Polo oversize",
      "cat": "ropa",
      "shape": "tee",
      "base": 35,
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
          "extra": 10
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
      "name": "Polo clásico",
      "cat": "ropa",
      "shape": "tee",
      "base": 25,
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
          "extra": 8
        },
        {
          "key": "manga_izq",
          "label": "Manga izquierda",
          "extra": 4
        },
        {
          "key": "manga_der",
          "label": "Manga derecha",
          "extra": 4
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
      "name": "Tomatodo térmico 20 oz",
      "cat": "tazas",
      "shape": "tumbler",
      "base": 45,
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
          "extra": 5
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
      "name": "Jarro cervecero",
      "cat": "tazas",
      "shape": "beer",
      "base": 22,
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
      "base": 6,
      "minQty": 1,
      "active": true,
      "desc": "Con tu foto, logo o el de tu idol favorito.",
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
          "extra": 1.5
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
      "name": "Polera con capucha",
      "cat": "ropa",
      "shape": "hoodie",
      "base": 65,
      "minQty": 1,
      "active": true,
      "desc": "Bolsillo canguro y capucha forrada.",
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
          "extra": 10
        },
        {
          "key": "manga_izq",
          "label": "Manga izquierda",
          "extra": 5
        },
        {
          "key": "manga_der",
          "label": "Manga derecha",
          "extra": 5
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
      "base": 15,
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
          "extra": 3
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
      "base": 22,
      "minQty": 1,
      "active": true,
      "desc": "Seis paneles, visera curva y regulador.",
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
          "extra": 5
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
      "base": 18,
      "minQty": 1,
      "active": true,
      "desc": "Bolsa de lona para el día a día.",
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
          "extra": 6
        }
      ],
      "photos": [],
      "badge": ""
    }
  ],
  "settings": {
    "shopName": "Printly",
    "currency": "S/",
    "whatsapp": "",
    "payNumber": "",
    "payHolder": "",
    "pickupAddress": "",
    "deliveryFee": 10,
    "deliveryNote": "Envío dentro de la ciudad",
    "normalDays": 5,
    "rushDays": 2,
    "rushPct": 25,
    "depositPct": 50,
    "designFee": 15,
    "payMethods": [
      "Yape",
      "Plin",
      "Transferencia bancaria",
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
