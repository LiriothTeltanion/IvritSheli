// Module: Hebrew Letter Stroke Paths (Authentic Calligraphy - Calibrated)
// Purpose: Exact Bézier vector curves matching standard Israeli print (Dfus) and cursive (Ktav).
// Date: 2026-08-22 | TZ: Asia/Jerusalem

export interface StrokePath {
  id: string;
  order: number;
  d: string;
  startPoint: { x: number; y: number };
  directionLabel?: string;
}

export interface LetterStrokeData {
  key: string;
  letter: string;
  name: string;
  printStrokes: StrokePath[];
  cursiveStrokes: StrokePath[];
  description: {
    en: string;
    es: string;
    he: string;
  };
}

export const HEBREW_STROKES: Record<string, LetterStrokeData> = {
  "alef": {
    "key": "alef",
    "letter": "א",
    "name": "Alef",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 70 20 C 60 40, 45 60, 25 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Diagonal central (arriba-derecha a abajo-izquierda)"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 25 20 C 35 30, 45 40, 50 45",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Brazo superior izquierdo"
      },
      {
        "id": "p3",
        "order": 3,
        "d": "M 50 45 C 60 55, 70 65, 75 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pierna inferior derecha"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 46 16 C 43 29, 37 49, 31 69",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Trazo largo inclinado izquierdo"
      },
      {
        "id": "c2",
        "order": 2,
        "d": "M 73 28 C 55 31, 52 51, 70 57",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Arco abierto derecho"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "bet": {
    "key": "bet",
    "letter": "ב",
    "name": "Bet",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 H 75 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo y pared derecha"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 80 70 H 20",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Base sobresaliente"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 34 28 C 46 18, 67 18, 73 31 C 77 43, 63 50, 50 45 C 46 43, 43 47, 40 54 L 32 68",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Bucle curvo continuo"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "gimel": {
    "key": "gimel",
    "letter": "ג",
    "name": "Gimel",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 40 20 H 65 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo corto y tallo vertical"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 65 45 L 40 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pierna izquierda avanzando"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 49 18 C 48 28, 57 34, 69 31 C 58 35, 47 40, 42 50 C 37 61, 42 70, 50 73",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Curva fluida hacia la izquierda"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "dalet": {
    "key": "dalet",
    "letter": "ד",
    "name": "Dalet",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 H 75",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo con sobresaliente"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 65 20 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pared derecha vertical"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 35 24 C 49 16, 68 18, 69 31 C 69 42, 56 46, 45 45 C 57 46, 69 52, 66 63 C 62 72, 46 73, 34 67",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Lazo curvo"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "he": {
    "key": "he",
    "letter": "ה",
    "name": "He",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 H 75 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo y pared derecha"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 40 40 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pierna izquierda flotante"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 68 24 C 53 15, 34 22, 30 39 C 27 54, 38 68, 54 66",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Curva externa"
      },
      {
        "id": "c2",
        "order": 2,
        "d": "M 49 41 C 47 49, 44 57, 40 64",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Línea flotante interna"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "vav": {
    "key": "vav",
    "letter": "ו",
    "name": "Vav",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 40 20 H 60 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cabeza y tallo vertical"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 60 18 C 57 31, 52 46, 46 61 C 44 66, 42 70, 40 72",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Línea recta vertical"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "zayin": {
    "key": "zayin",
    "letter": "ז",
    "name": "Zayin",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 35 20 H 65",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Corona superior"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 50 20 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Tallo central"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 39 22 C 51 14, 66 17, 67 29 C 67 38, 58 43, 47 43 C 58 43, 69 49, 67 60 C 65 71, 49 75, 35 68",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Curva ondulada"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "het": {
    "key": "het",
    "letter": "ח",
    "name": "Chet",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 70 V 20 H 70 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Paredes completas con techo"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 43 18 C 40 32, 35 51, 30 69",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Descenso inclinado izquierdo"
      },
      {
        "id": "c2",
        "order": 2,
        "d": "M 57 24 C 66 15, 78 25, 75 43 C 73 56, 66 65, 58 69",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Arco manuscrito derecho"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "tet": {
    "key": "tet",
    "letter": "ט",
    "name": "Tet",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 20 V 70 H 70 V 35 C 70 25, 55 25, 55 35",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Base curvada hacia adentro"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 65 20 C 49 15, 33 24, 29 39 C 25 54, 34 68, 49 70 C 63 72, 74 63, 73 50 C 72 39, 64 35, 57 41 C 51 46, 51 55, 57 59",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Bucle hacia el centro"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "yod": {
    "key": "yod",
    "letter": "י",
    "name": "Yod",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 45 20 H 65 V 40",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pequeño trazo superior"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 56 18 L 48 36",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pequeña línea vertical"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "kaf": {
    "key": "kaf",
    "letter": "כ",
    "name": "Kaf",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 20 H 70 V 70 H 30",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "C invertida cuadrada"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 30 20 C 80 20, 80 70, 30 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Curva C invertida fluida"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "final_kaf": {
    "key": "final_kaf",
    "letter": "ך",
    "name": "Kaf Sofit",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 20 H 70 V 85",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo y cola larga"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 34 21 C 48 14, 64 17, 68 28 C 71 39, 64 53, 56 66 C 49 78, 44 85, 40 89",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cabeza curva y descenso prolongado"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "lamed": {
    "key": "lamed",
    "letter": "ל",
    "name": "Lamed",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 45 5 V 35 H 70 V 70 H 30",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cuello alto y base"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 66 8 C 54 13, 51 25, 52 38 C 53 52, 49 66, 39 72 C 34 75, 30 71, 31 65",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Curva de cisne característica"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "mem": {
    "key": "mem",
    "letter": "מ",
    "name": "Mem",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 70 V 20 H 70 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Paredes y techo"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 30 20 L 50 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Corte diagonal central"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 72 18 C 66 33, 61 48, 57 62 C 52 52, 47 41, 44 30 C 40 44, 35 59, 30 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Círculo que cierra a la izquierda"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "final_mem": {
    "key": "final_mem",
    "letter": "ם",
    "name": "Mem Sofit",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 H 75 V 70 H 25 Z",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cuadrado perfecto"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 31 69 C 37 54, 43 38, 51 25 C 58 14, 70 17, 72 28 C 74 39, 65 47, 56 43 C 48 39, 46 31, 50 24 C 54 35, 61 49, 69 65",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Lazo cerrado con salida fluida"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "nun": {
    "key": "nun",
    "letter": "נ",
    "name": "Nun",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 35 20 H 65 V 70 H 35",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Línea con base"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 62 18 C 61 36, 60 54, 54 64 C 48 72, 38 73, 30 68",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Descenso vertical con gancho inferior"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "final_nun": {
    "key": "final_nun",
    "letter": "ן",
    "name": "Nun Sofit",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 35 20 H 65 V 85",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Tallo largo sin base"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 68 16 C 62 34, 55 52, 48 69 C 45 77, 42 84, 39 89",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Descenso largo ligeramente inclinado"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "samekh": {
    "key": "samekh",
    "letter": "ס",
    "name": "Samekh",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 50 20 C 75 20, 75 70, 50 70 C 25 70, 25 20, 50 20",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Círculo redondo"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 58 18 C 72 20, 76 35, 72 49 C 68 64, 56 73, 42 69 C 29 65, 25 50, 29 36 C 33 23, 44 17, 58 18",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Círculo manuscrito"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "ayin": {
    "key": "ayin",
    "letter": "ע",
    "name": "Ayin",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 L 50 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Brazo izquierdo"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 75 20 L 50 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Brazo derecho largo"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 72 18 C 62 30, 55 41, 50 51 C 44 63, 39 74, 29 68 C 21 63, 25 52, 35 51 C 46 50, 49 39, 44 29 C 40 22, 35 18, 30 16",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cruce continuo con lazo inferior"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "pe": {
    "key": "pe",
    "letter": "פ",
    "name": "Pe",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 20 H 70 V 70 H 30 V 40 H 50",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Caja abierta con remolino interno"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 69 22 C 55 14, 38 20, 32 34 C 25 50, 34 66, 50 69 C 64 72, 75 64, 73 52 C 71 42, 60 39, 52 45 C 45 50, 46 59, 54 61",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Curva fluida con espiral interna"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "final_pe": {
    "key": "final_pe",
    "letter": "ף",
    "name": "Pe Sofit",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 20 H 70 V 85",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cabeza abierta y cola larga"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 31 34 C 40 20, 54 15, 66 18 C 76 21, 75 31, 67 35 C 58 39, 49 33, 51 25 C 55 39, 54 56, 48 70 C 44 79, 39 85, 34 89",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Lazo superior y cola descendente"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "tsadi": {
    "key": "tsadi",
    "letter": "צ",
    "name": "Tsadi",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 L 45 50",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Brazo izquierdo pequeño"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 70 20 V 70 H 30",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cuerpo principal con base"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 35 22 C 50 16, 67 19, 68 31 C 68 40, 58 45, 46 45 C 58 46, 70 52, 67 63 C 64 73, 48 75, 34 68",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Doble curva continua como un 3"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "final_tsadi": {
    "key": "final_tsadi",
    "letter": "ץ",
    "name": "Tsadi Sofit",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 L 45 50",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Brazo izquierdo pequeño"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 70 20 V 85",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cola larga vertical"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 34 18 C 35 30, 42 37, 51 35 C 62 33, 71 23, 67 17 C 63 11, 53 15, 50 25 C 47 40, 46 60, 42 85",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Lazo superior y descenso continuo"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "qof": {
    "key": "qof",
    "letter": "ק",
    "name": "Qof",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 30 20 H 70 V 55 H 45",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo y oreja derecha"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 30 35 V 85",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pierna larga flotante izquierda"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 35 24 C 48 15, 65 18, 69 31 C 72 42, 63 51, 51 50 C 42 49, 35 43, 35 36",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Cabeza circular"
      },
      {
        "id": "c2",
        "order": 2,
        "d": "M 53 42 C 51 56, 48 71, 43 86",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pierna flotante"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "resh": {
    "key": "resh",
    "letter": "ר",
    "name": "Resh",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 H 75 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo y pared redondeados"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 30 20 C 50 10, 75 10, 75 30 C 75 50, 55 70, 30 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Semiarco suave (similar a media luna abierta)"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "shin": {
    "key": "shin",
    "letter": "ש",
    "name": "Shin",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 75 20 V 70 H 25 V 20",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Base plana y brazos exteriores"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 50 20 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Brazo central"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 32 55 C 45 54, 58 48, 66 38 C 73 29, 69 18, 59 18 C 48 18, 39 29, 41 41 C 43 53, 56 57, 68 50 C 71 48, 73 46, 75 43",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Lazo continuo"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  },
  "tav": {
    "key": "tav",
    "letter": "ת",
    "name": "Tav",
    "printStrokes": [
      {
        "id": "p1",
        "order": 1,
        "d": "M 25 20 H 75 V 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Techo y pared derecha"
      },
      {
        "id": "p2",
        "order": 2,
        "d": "M 35 20 V 70 C 35 80, 20 80, 20 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Pie izquierdo rematado"
      }
    ],
    "cursiveStrokes": [
      {
        "id": "c1",
        "order": 1,
        "d": "M 70 32 C 74 23, 70 15, 64 18 C 60 35, 56 58, 43 67 C 38 70, 33 71, 28 70",
        "startPoint": {
          "x": 0,
          "y": 0
        },
        "directionLabel": "Gancho superior y cola basal"
      }
    ],
    "description": {
      "en": "",
      "es": "",
      "he": ""
    }
  }
};
