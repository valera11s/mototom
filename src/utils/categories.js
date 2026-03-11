// Структура категорий товаров
export const CATEGORIES = {
  Leica: {
    label: 'Leica',
    subcategories: {
      'Дальномерные': [],
      'Компактные': [],
      'Системные': [],
      'Зеркальные': [],
      'Объективы': {
        subcategories: ['Серия M', 'Серия S', 'Серия T', 'Серия SL']
      },
      'Бинокли': [],
      'Прицелы и дальномеры': [],
      'Футляры,чехлы,ремни': [],
      'Billingham': [],
      'Аксессуары': {
        subcategories: [
          'Аккумуляторы',
          'Наглазники и видоискатели',
          'Рукоятки',
          'Тросики',
          'Чистящие средства',
          'Корректирующие линзы',
          'Светофильтры, бленды и крышки',
          'Кнопки спускового механизма',
          'Защитные плёнки'
        ]
      },
      'Вспышки': []
    }
  },
  'Фотоаппараты': {
    label: 'Фотоаппараты',
    subcategories: {
      'Зеркальные фотоаппараты': {
        subcategories: ['Canon', 'Nikon', 'Sony']
      },
      'Беззеркальные фотоаппараты': {
        subcategories: ['Sony', 'Olympus', 'Canon', 'Fujifilm', 'Panasonic', 'Nikon', 'Zenit', 'Hasselblad']
      },
      'Компактные фотокамеры': {
        subcategories: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Sigma', 'Hasselblad', 'Olympus', 'Panasonic']
      },
      'Для блоггеров': []
    }
  },
  'Объективы': {
    label: 'Объективы',
    subcategories: {
      'Canon': [],
      'Nikon': [],
      'Sony': [],
      'Sigma': {
        subcategories: ['Для Canon', 'Для Nikon', 'Для Sony', 'для Pentax', 'Для Fujifilm', 'Для Leica', 'Для Micro 4/3']
      },
      'Tamron': {
        subcategories: ['Для Canon', 'Для Nikon', 'Для Sony', 'для Pentax', 'Для Fujifilm']
      },
      'Samyang': {
        subcategories: ['Для Canon', 'Для Nikon', 'Для Sony', 'для Pentax', 'Для Samsung', 'Для Panasonic/Olympus', 'T-Mount']
      },
      'Tokina': {
        subcategories: ['Для Canon', 'Для Nikon']
      },
      'Pentax': [],
      'Fujifilm': [],
      'Panasonic': [],
      'Voigtlaender': [],
      'Olympus': [],
      'Зенит': [],
      'Hasselblad': [],
      'Leica': [],
      'Carl Zeiss': [],
      'ZEISS Batis': [],
      'Yongnuo': {
        subcategories: ['Для Nikon', 'Для Canon']
      },
      'JVC': [],
      'Micro 4/3': []
    }
  },
  'Видеокамеры': {
    label: 'Видеокамеры',
    subcategories: {
      'Canon': [],
      'Sony': [],
      'Panasonic': [],
      'GoPro': [],
      'JVC': [],
      'Blackmagic': [],
      'Экшн камеры': {
        subcategories: ['Экшн-камеры DJI', 'Экшн камеры GoPro']
      }
    }
  },
  'Вспышки': {
    label: 'Вспышки',
    subcategories: {
      'Canon': [],
      'Leica': [],
      'Nikon': [],
      'Pentax': [],
      'Sigma': [],
      'Sony': [],
      'Fujifilm': [],
      'Metz': [],
      'Nissin': [],
      'Micro 4/3': []
    }
  },
  'Штативы': {
    label: 'Штативы',
    subcategories: {
      'Manfrotto': [],
      'Giottos': [],
      'Vlebon': [],
      'Benro': [],
      'Miliboo': [],
      'Viltrox': [],
      'Sony': [],
      'SIRUI': [],
      'Falcon Eyes': [],
      'Sachtler': [],
      'Era': [],
      'JMARY': []
    }
  },
  'Аксессуары': {
    label: 'Аксессуары',
    subcategories: {
      'Аккумуляторы и ЗУ': {
        subcategories: ['Canon', 'Leica', 'Nikon', 'Sanyo', 'Fujifilm', 'Sony', 'DBK', 'Lenmar', 'Olympus', 'Panasonic']
      },
      'Батарейные блоки': {
        subcategories: ['Canon', 'Olympus', 'Nikon', 'Phottix', 'Sony']
      },
      'Батарейные ручки': {
        subcategories: ['Canon']
      },
      'Зарядные устройства': {
        subcategories: ['Canon', 'Leica', 'Nikon', 'Sanyo', 'Fujifilm', 'Sony', 'Для Nikon', 'JJC']
      },
      'Д/У пульты': {
        subcategories: ['Canon', 'Flama', 'Nikon', 'Leica', 'Pixel']
      },
      'Крышки': {
        subcategories: ['Flama']
      },
      'Наглазники и видоискатели': {
        subcategories: ['Leica', 'Sony', 'Canon']
      },
      'Видоискатели': {
        subcategories: ['Canon']
      },
      'Светофильтры': {
        subcategories: ['Carl Zeiss', 'Rodenstock', 'Canon', 'Hoya', 'Marumi', 'Flama', 'B+W', 'Schneider', 'JJC']
      },
      'Сумки и кейсы': {
        subcategories: ['Leica', 'Lowepro', 'Vanguard', 'Billingham', 'Manfrotto', 'Kata', 'Sont', 'FOSOTO', 'E-image', 'Almi', 'HDV']
      },
      'Рюкзаки': [],
      'Ремни для фотоаппаратов': [],
      'Силиконовые чехлы': [],
      'Фотобумага': [],
      'Чистящие средства': {
        subcategories: ['Lenspen', 'Marumi', 'Parity/Aropolis/Flama', 'Vanguard']
      },
      'Карты памяти': {
        subcategories: ['Panasonic', 'Lexar', 'Samsung', 'Sony', 'Transcend', 'Sandisk']
      },
      'Картридеры': [],
      'Лампы накамерные, вспышки и студийное оборудование': {
        subcategories: [
          'Вспышки Micro 4/3',
          'Накамерный свет VILTROX',
          'Накамерный свет YongNuo',
          'Накамерный свет Aputure',
          'Вспышки Canon',
          'Накамерный свет LED',
          'Накамерный свет NanGuang',
          'Накамерный свет Dedolight',
          'Накамерный свет CAME-TV',
          'Вспышки для фотоаппаратов Nikon',
          'Вспышки для фотоаппаратов Sony'
        ]
      },
      'Адаптеры и переходники': {
        subcategories: ['Metabones', 'Leica', 'Sony']
      },
      'Адаптеры, конвертеры, переходные кольца': {
        subcategories: ['Переходные кольца KIWIFOTOS', 'Переходные кольца JJC', 'Переходные кольца Commlite', 'Адаптеры Canon', 'Адаптеры Nikon', 'Адаптеры Sigma', 'Переходные кольца Viltrox']
      },
      'Дистанционное управление': {
        subcategories: ['Радиосинхронизаторы']
      },
      'Дополнительные устройства': [],
      'Подводные боксы': {
        subcategories: ['Meikon', 'Canon', 'Sony']
      },
      'Стабилизаторы': [],
      'Бленды и Крышки': [],
      'Дождевые и Зимние чехлы для видеокамер': []
    }
  },
  'Карты памяти': {
    label: 'Карты памяти',
    subcategories: {
      'Apacer': [],
      'Kingston': [],
      'Lexar': [],
      'Olympux/Kingmax': [],
      'Reader': [],
      'Sandisk': [],
      'Silicon Power': [],
      'Sony': [],
      'Transcend': [],
      'Qumo': [],
      'Panasonic': [],
      'Samsung': []
    }
  },
  'Бинокли': {
    label: 'Бинокли',
    subcategories: {
      'Canon': [],
      'Steiner': [],
      'Leica': [],
      'Praktica': []
    }
  },
  'Телеконвертер': {
    label: 'Телеконвертер',
    subcategories: {
      'Olympus': [],
      'Canon': [],
      'Fuji': [],
      'Sony': [],
      'Nikon': []
    }
  },
  'Средства по уходу за оптикой': {
    label: 'Средства по уходу за оптикой',
    subcategories: {
      'Чистящие наборы': [],
      'Чистящие карандаши и груши': [],
      'Чистящие салфетки': []
    }
  },
  'Периферия': {
    label: 'Периферия',
    subcategories: {
      'Моноподы': {
        subcategories: ['Моноподы Canon', 'Моноподы JJC', 'Моноподы ERA', 'Монопод SIRUI']
      },
      'Системы стабилизации': {
        subcategories: ['Стабилизатор Jmary', 'Стабилизатор JJC', 'Стабилизатор Commlite', 'Стабилизатор WENPOD', 'Стабилизатор Zhiyun', 'Стабилизатор DJI', 'Стабилизатор LituFoto']
      },
      'Микрофоны': {
        subcategories: [
          'Микрофоны Canon',
          'Микрофон Hollyland',
          'Микрофоны Jmary',
          'Микрофоны Aputure',
          'Микрофоны Comica',
          'Микрофоны Yoga',
          'Микрофоны DJI',
          'Микрофоны SENNHEISER',
          'Микрофоны Panasonic',
          'Микрофоны Rode',
          'Микрофоны Boya',
          'Микрофоны Sony',
          'Микрофоны Saramonic',
          'Рекордеры, диктофоны'
        ]
      },
      'Сумки/рюкзаки/чехлы/ремни': {
        subcategories: ['Силиконовые чехлы', 'Сумки FOSOTO', 'Ремни для фотоаппаратов', 'Сумки E-image', 'Сумка Almi', 'Сумка Lowepro', 'Сумки HDV', 'Рюкзаки']
      },
      'Фильтры и Стекла': {
        subcategories: ['Светофильтр Schneider', 'Светофильтр JJC', 'Светофильтр HOYA']
      },
      'Мониторы и Конвертеры': {
        subcategories: ['Мониторы Aputure', 'Конвертеры Blackmagic', 'Мониторы Feelworld', 'Мониторы VILTROX', 'Мониторы Sony']
      },
      'Видеомикшеры, телесуфлёры и др.': {
        subcategories: ['Blackmagic', 'Музыкально-студийное и концертное оборудование']
      },
      'Разное': {
        subcategories: ['Кабели', 'Бинокли', 'Apple TV']
      }
    }
  }
};

// Статусы заказов
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Создан' },
  { value: 'processing', label: 'В обработке' },
  { value: 'cancelled', label: 'Отменен' },
  { value: 'assembling', label: 'Собирается' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' }
];
