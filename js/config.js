/* SENKI BIO v5.1 — otomatik üretilen ayar dosyası (2026-10-16T12:04:43.542Z) */
/* Kullanım: repo'daki js/config.js ile değiştir, commit + push. */
/* EDIT_MODE'i false bırakmayı unutma. */

"use strict";

window.CONFIG = {
  "meta": {
    "title": "yakan12 | Bio",
    "description": "yup.",
    "favicon": "assets/favicon.svg"
  },
  "entry": {
    "hint": "203.Tabura Girmek için Tıkla.",
    "note": "Her Şey İmparatorluk İçin!",
    "showCube": true,
    "cubeSize": 72,
    "cubeSpeed": 15,
    "cubeColor": ""
  },
  "intro": {
    "enabled": false,
    "mode": "style",
    "style": "boot",
    "lines": [
      "IMPERIAL SYSTEMS v5.1",
      "BAĞLANTI KURULUYOR...",
      "BEING X TESPİT EDİLDİ",
      "SİSTEM HAZIR"
    ],
    "elementDelay": 120,
    "bgReveal": "blur",
    "skipOnReload": true,
    "sound": true,
    "video": {
      "sources": [],
      "poster": "",
      "maxMs": 0,
      "lockOthers": false
    }
  },
  "profile": {
    "username": "yakan12",
    "division": "Bağıllar",
    "bio": "\"Varlık X\"...",
    "avatarFrame": "magic",
    "avatarShape": "circle",
    "badges": [
      {
        "icon": "verified",
        "title": "Doğrulanmış Kullanıcı",
        "anim": "shine",
        "color": ""
      },
      {
        "icon": "shield",
        "title": "Yüksek Onur Nişan'ı",
        "anim": "shine",
        "color": ""
      }
    ],
    "chips": [
      {
        "icon": "📍",
        "text": "İmparatorluk"
      },
      {
        "icon": "🕐",
        "text": "{time}"
      }
    ]
  },
  "avatar": {
    "src": "assets/avatar.jpg",
    "anim": "glowpulse"
  },
  "theme": {
    "accent": "#e6b34d",
    "text": "",
    "background": "",
    "icon": "",
    "cardBg": ""
  },
  "font": {
    "mode": "local",
    "googleFamily": "Cinzel",
    "weights": "400;600"
  },
  "bg": {
    "mode": "video",
    "blur": 6,
    "index": 0,
    "particleStyle": "embers",
    "list": []
  },
  "layout": {
    "autofit": true,
    "minScale": 0.5,
    "maxScale": 1.2,
    "marginY": 84,
    "marginX": 36
  },
  "card": {
    "width": 400,
    "radius": 18,
    "blur": 20,
    "opacity": 0.58
  },
  "elements": {
    "card": {
      "w": 400,
      "radius": 18,
      "rot": 0,
      "x": 0,
      "y": 0,
      "scale": 1,
      "fx": {
        "ambient": "liquid-glass",
        "interactive": "spotlight"
      },
      "media": {
        "src": "",
        "opacity": 0.3,
        "blend": "screen"
      }
    },
    "avatar": {
      "w": 112,
      "h": 112,
      "rot": 0,
      "x": 0,
      "y": 0,
      "scale": 1,
      "fx": {
        "ambient": "none",
        "interactive": "none"
      },
      "media": {
        "src": "",
        "opacity": 0.3,
        "blend": "screen"
      }
    },
    "username": {
      "size": 33,
      "rot": 0,
      "x": 0,
      "y": 0,
      "scale": 1,
      "fx": {
        "ambient": "none",
        "interactive": "none"
      },
      "media": {
        "src": "",
        "opacity": 0.3,
        "blend": "screen"
      }
    },
    "bio": {
      "size": 20,
      "rot": 0,
      "x": 0,
      "y": 0,
      "scale": 1,
      "fx": {
        "ambient": "none",
        "interactive": "none"
      },
      "media": {
        "src": "",
        "opacity": 0.3,
        "blend": "screen"
      }
    },
    "links": {
      "w": 100,
      "rot": 0,
      "x": 0,
      "y": 0,
      "scale": 1,
      "fx": {
        "ambient": "none",
        "interactive": "none"
      },
      "media": {
        "src": "",
        "opacity": 0.3,
        "blend": "screen"
      }
    }
  },
  "fx": {
    "sparks": true,
    "cursor": true,
    "parallax": true,
    "tilt": true,
    "typewriter": true,
    "blips": true,
    "shortcuts": false
  },
  "perf": {
    "quality": "high",
    "particleCap": 120,
    "dprCap": 2,
    "renderer": "auto"
  },
  "debug": {
    "triggers": false,
    "zones": true
  },
  "audio": {
    "source": "video",
    "defaultVolume": 0.35
  },
  "sounds": {
    "enabled": true,
    "volume": 0.4,
    "hover": "assets/sounds/hover.mp3",
    "click": "assets/sounds/click.mp3"
  },
  "tabs": {
    "style": "parallax",
    "list": [
      {
        "label": "Bağlantılar",
        "type": "links"
      }
    ]
  },
  "links": [],
  "shaders": [],
  "antiDebug": {
    "rightClick": true,
    "shortcuts": true,
    "debuggerTrap": true,
    "consoleWarn": true
  },
  "menus": [
    {
      "id": "main",
      "title": "HIZLI ERİŞİM",
      "items": [
        {
          "label": "Steam",
          "icon": "steam",
          "type": "link",
          "url": "https://steamcommunity.com/profiles/76561198397915471"
        },
        {
          "label": "Discord",
          "icon": "discord",
          "type": "copy",
          "text": "yakan12"
        }
      ]
    },
    {
      "id": "more",
      "title": "DAHA",
      "items": [
        {
          "label": "Tema Karışık",
          "icon": "🎨",
          "type": "action",
          "action": "theme-random"
        },
        {
          "label": "Çerçeve Değiştir",
          "icon": "🖼️",
          "type": "action",
          "action": "frame-next"
        },
        {
          "label": "Kıvılcım Fırtınası",
          "icon": "⚡",
          "type": "action",
          "action": "sparks-storm"
        }
      ]
    }
  ],
  "contextMenu": {
    "enabled": true,
    "menu": "main"
  },
  "dock": {
    "buttons": []
  },
  "zones": [
    {
      "id": "strip-top",
      "x": 0,
      "y": 0,
      "w": 100,
      "h": 10,
      "event": "enter",
      "cooldownMs": 250,
      "autoRevert": true,
      "hoverUnblur": false,
      "action": {
        "type": "toggle-blur",
        "params": {}
      }
    }
  ],
  "triggers": [],
  "quotes": [],
  "lanyard": {
    "enabled": false,
    "discordId": "",
    "showSpotify": true
  },
  "greeting": {
    "enabled": true,
    "template": "{selam} — İmparatorluk saati {saat}"
  },
  "cursor": {
    "image": ""
  },
  "stats": {
    "url": ""
  }
};

window.CONFIG_TEMPLATES = {
  "scratch": {
    "meta": {
      "title": "Yeni Bio",
      "description": "",
      "favicon": "assets/favicon.svg"
    },
    "entry": {
      "hint": "CLICK TO ENTER",
      "note": "ses açık önerilir",
      "showCube": true,
      "cubeSize": 72,
      "cubeSpeed": 10,
      "cubeColor": ""
    },
    "intro": {
      "enabled": true,
      "style": "boot",
      "lines": [
        "SYSTEM READY"
      ],
      "elementDelay": 120,
      "bgReveal": "blur",
      "skipOnReload": true,
      "sound": true
    },
    "profile": {
      "username": "isim",
      "division": "",
      "bio": "",
      "avatarFrame": "none",
      "avatarShape": "circle",
      "badges": [],
      "chips": []
    },
    "avatar": {
      "src": "assets/avatar.jpg",
      "anim": "none"
    },
    "theme": {
      "accent": "#e6b34d",
      "text": "",
      "background": "",
      "icon": "",
      "cardBg": ""
    },
    "font": {
      "mode": "local",
      "googleFamily": "Cinzel",
      "weights": "400;600"
    },
    "bg": {
      "mode": "image",
      "blur": 6,
      "index": 0,
      "particleStyle": "dust",
      "list": []
    },
    "layout": {
      "autofit": true,
      "minScale": 0.5,
      "maxScale": 1.2,
      "marginY": 84,
      "marginX": 36
    },
    "card": {
      "width": 400,
      "radius": 18,
      "blur": 20,
      "opacity": 0.58
    },
    "elements": {},
    "fx": {
      "sparks": true,
      "cursor": true,
      "parallax": true,
      "tilt": true,
      "typewriter": true,
      "blips": true,
      "shortcuts": true
    },
    "perf": {
      "quality": "auto",
      "particleCap": 120,
      "dprCap": 2,
      "renderer": "auto"
    },
    "debug": {
      "triggers": false,
      "zones": false
    },
    "audio": {
      "source": "video",
      "defaultVolume": 0.35
    },
    "sounds": {
      "enabled": true,
      "volume": 0.4,
      "hover": "assets/sounds/hover.mp3",
      "click": "assets/sounds/click.mp3"
    },
    "tabs": {
      "style": "animated",
      "list": [
        {
          "label": "Bağlantılar",
          "type": "links"
        }
      ]
    },
    "links": [],
    "shaders": [],
    "antiDebug": {
      "rightClick": true,
      "shortcuts": true,
      "debuggerTrap": false,
      "consoleWarn": true
    },
    "contextMenu": {
      "enabled": false,
      "menu": "main"
    },
    "menus": [],
    "dock": {
      "buttons": []
    },
    "zones": [],
    "triggers": [],
    "quotes": [],
    "lanyard": {
      "enabled": false,
      "discordId": "",
      "showSpotify": true
    },
    "greeting": {
      "enabled": true,
      "template": "{selam} — İmparatorluk saati {saat}"
    },
    "cursor": {
      "image": ""
    },
    "stats": {
      "url": ""
    }
  },
  "classic": {
    "meta": {
      "title": "Tanya Degurechaff | Bio",
      "description": "203. Hava Mage Taburu — bağlantılar.",
      "favicon": "assets/favicon.svg"
    },
    "entry": {
      "hint": "CLICK TO ENTER",
      "note": "ses açık önerilir",
      "showCube": true,
      "cubeSize": 72,
      "cubeSpeed": 10,
      "cubeColor": ""
    },
    "intro": {
      "enabled": true,
      "style": "boot",
      "lines": [
        "IMPERIAL ARMY OS",
        "CONNECTING...",
        "BEING X DETECTED",
        "SYSTEM READY"
      ],
      "elementDelay": 120,
      "bgReveal": "blur",
      "skipOnReload": true,
      "sound": true
    },
    "profile": {
      "username": "Tanya Degurechaff",
      "division": "203RD AERIAL MAGE BATTALION",
      "bio": "Yüzbaşı, İmparatorluk Ordusu. Being X ile hesaplaşma sürüyor — sinyaller, cepheler ve zafer günü kayıtları aşağıda.",
      "avatarFrame": "ring",
      "avatarShape": "circle",
      "badges": [
        {
          "icon": "verified",
          "title": "Doğrulanmış",
          "anim": "none"
        },
        {
          "icon": "shield",
          "title": "Mage Nişanı",
          "anim": "none"
        }
      ],
      "chips": []
    },
    "avatar": {
      "src": "assets/avatar.jpg",
      "anim": "none"
    },
    "theme": {
      "accent": "#e6b34d",
      "text": "",
      "background": "",
      "icon": "",
      "cardBg": ""
    },
    "font": {
      "mode": "local",
      "googleFamily": "Cinzel",
      "weights": "400;600"
    },
    "bg": {
      "mode": "video",
      "blur": 6,
      "index": 0,
      "particleStyle": "dust",
      "list": []
    },
    "layout": {
      "autofit": true,
      "minScale": 0.5,
      "maxScale": 1.2,
      "marginY": 84,
      "marginX": 36
    },
    "card": {
      "width": 400,
      "radius": 18,
      "blur": 20,
      "opacity": 0.58
    },
    "elements": {},
    "fx": {
      "sparks": true,
      "cursor": true,
      "parallax": true,
      "tilt": true,
      "typewriter": true,
      "blips": true,
      "shortcuts": true
    },
    "perf": {
      "quality": "auto",
      "particleCap": 120,
      "dprCap": 2,
      "renderer": "auto"
    },
    "debug": {
      "triggers": false,
      "zones": false
    },
    "audio": {
      "source": "video",
      "defaultVolume": 0.35
    },
    "sounds": {
      "enabled": true,
      "volume": 0.4,
      "hover": "assets/sounds/hover.mp3",
      "click": "assets/sounds/click.mp3"
    },
    "tabs": {
      "style": "animated",
      "list": [
        {
          "label": "Bağlantılar",
          "type": "links"
        }
      ]
    },
    "links": [
      {
        "type": "github",
        "label": "GitHub",
        "url": "https://github.com/tanya",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "none"
          }
        }
      },
      {
        "type": "telegram",
        "label": "Telegram",
        "url": "https://t.me/tanya",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "none"
          }
        }
      },
      {
        "type": "steam",
        "label": "Steam",
        "url": "https://steamcommunity.com/id/tanya",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "none"
          }
        }
      },
      {
        "type": "youtube",
        "label": "YouTube",
        "url": "https://youtube.com/@tanya",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "none"
          }
        }
      },
      {
        "type": "discord",
        "label": "Discord",
        "copy": "tanya.degurechaff",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "none"
          }
        }
      }
    ],
    "shaders": [],
    "antiDebug": {
      "rightClick": true,
      "shortcuts": true,
      "debuggerTrap": false,
      "consoleWarn": true
    },
    "contextMenu": {
      "enabled": false,
      "menu": "main"
    },
    "menus": [],
    "dock": {
      "buttons": []
    },
    "zones": [],
    "triggers": [],
    "quotes": [
      "Being X… sen yalnızca kötü bir şakasın."
    ],
    "lanyard": {
      "enabled": false,
      "discordId": "",
      "showSpotify": true
    },
    "greeting": {
      "enabled": true,
      "template": "{selam} — İmparatorluk saati {saat}"
    },
    "cursor": {
      "image": ""
    },
    "stats": {
      "url": ""
    }
  },
  "def": {
    "meta": {
      "title": "yakan12 | Bio",
      "description": "yakan12 — bağlantılar, Steam ve Discord. Koyu tema, altın vurgu.",
      "favicon": "assets/favicon.svg"
    },
    "entry": {
      "hint": "CLICK TO ENTER",
      "note": "ses açık önerilir",
      "showCube": true,
      "cubeSize": 72,
      "cubeSpeed": 10,
      "cubeColor": ""
    },
    "intro": {
      "enabled": true,
      "style": "boot",
      "lines": [
        "IMPERIAL SYSTEMS v5.1",
        "BAĞLANTI KURULUYOR...",
        "BEING X TESPİT EDİLDİ",
        "SİSTEM HAZIR"
      ],
      "elementDelay": 120,
      "bgReveal": "blur",
      "skipOnReload": true,
      "sound": true
    },
    "profile": {
      "username": "yakan12",
      "division": "OFFICIAL LINKS",
      "bio": "Senin için geliyorum 'Varhk X'…",
      "avatarFrame": "ring",
      "avatarShape": "circle",
      "badges": [
        {
          "icon": "verified",
          "title": "Doğrulanmış",
          "anim": "pulse",
          "color": ""
        },
        {
          "icon": "shield",
          "title": "Nişan",
          "anim": "none",
          "color": ""
        }
      ],
      "chips": [
        {
          "icon": "📍",
          "text": "İmparatorluk"
        },
        {
          "icon": "🕐",
          "text": "{time}"
        }
      ]
    },
    "avatar": {
      "src": "assets/avatar.jpg",
      "anim": "breathe"
    },
    "theme": {
      "accent": "#e6b34d",
      "text": "",
      "background": "",
      "icon": "",
      "cardBg": ""
    },
    "font": {
      "mode": "local",
      "googleFamily": "Cinzel",
      "weights": "400;600"
    },
    "bg": {
      "mode": "video",
      "blur": 6,
      "index": 0,
      "particleStyle": "dust",
      "list": [
        {
          "type": "video",
          "label": "Sahne",
          "src": "assets/bg.mp4"
        },
        {
          "type": "image",
          "label": "Klasik",
          "src": "assets/bg.jpg"
        }
      ]
    },
    "layout": {
      "autofit": true,
      "minScale": 0.5,
      "maxScale": 1.2,
      "marginY": 84,
      "marginX": 36
    },
    "card": {
      "width": 400,
      "radius": 18,
      "blur": 20,
      "opacity": 0.58
    },
    "elements": {
      "card": {
        "w": 400,
        "radius": 18,
        "rot": 0,
        "x": 0,
        "y": 0,
        "scale": 1,
        "fx": {
          "ambient": "none",
          "interactive": "none"
        },
        "media": {
          "src": "",
          "opacity": 0.3,
          "blend": "screen"
        }
      },
      "avatar": {
        "w": 112,
        "h": 112,
        "rot": 0,
        "x": 0,
        "y": 0,
        "scale": 1,
        "fx": {
          "ambient": "none",
          "interactive": "none"
        },
        "media": {
          "src": "",
          "opacity": 0.3,
          "blend": "screen"
        }
      },
      "username": {
        "size": 33,
        "rot": 0,
        "x": 0,
        "y": 0,
        "scale": 1,
        "fx": {
          "ambient": "none",
          "interactive": "none"
        },
        "media": {
          "src": "",
          "opacity": 0.3,
          "blend": "screen"
        }
      },
      "bio": {
        "size": 14.5,
        "rot": 0,
        "x": 0,
        "y": 0,
        "scale": 1,
        "fx": {
          "ambient": "none",
          "interactive": "none"
        },
        "media": {
          "src": "",
          "opacity": 0.3,
          "blend": "screen"
        }
      },
      "links": {
        "w": 100,
        "rot": 0,
        "x": 0,
        "y": 0,
        "scale": 1,
        "fx": {
          "ambient": "none",
          "interactive": "none"
        },
        "media": {
          "src": "",
          "opacity": 0.3,
          "blend": "screen"
        }
      }
    },
    "fx": {
      "sparks": true,
      "cursor": true,
      "parallax": true,
      "tilt": true,
      "typewriter": true,
      "blips": true,
      "shortcuts": true
    },
    "perf": {
      "quality": "auto",
      "particleCap": 120,
      "dprCap": 2,
      "renderer": "auto"
    },
    "debug": {
      "triggers": false,
      "zones": false
    },
    "audio": {
      "source": "video",
      "defaultVolume": 0.35
    },
    "sounds": {
      "enabled": true,
      "volume": 0.4,
      "hover": "assets/sounds/hover.mp3",
      "click": "assets/sounds/click.mp3"
    },
    "tabs": {
      "style": "animated",
      "list": [
        {
          "label": "Bağlantılar",
          "type": "links"
        }
      ]
    },
    "links": [
      {
        "type": "steam",
        "label": "Steam",
        "url": "https://steamcommunity.com/id/yakan12",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "burst"
          }
        }
      },
      {
        "type": "discord",
        "label": "Discord",
        "copy": "yakan12",
        "fx": {
          "hover": {
            "type": "none"
          },
          "click": {
            "type": "burst"
          }
        }
      }
    ],
    "shaders": [],
    "antiDebug": {
      "rightClick": true,
      "shortcuts": true,
      "debuggerTrap": false,
      "consoleWarn": true
    },
    "contextMenu": {
      "enabled": false,
      "menu": "main"
    },
    "menus": [
      {
        "id": "main",
        "title": "HIZLI ERİŞİM",
        "items": [
          {
            "label": "Steam",
            "icon": "steam",
            "type": "link",
            "url": "https://steamcommunity.com/id/yakan12"
          },
          {
            "label": "Discord",
            "icon": "discord",
            "type": "copy",
            "text": "yakan12"
          },
          {
            "label": "Söz",
            "icon": "✨",
            "type": "action",
            "action": "quote"
          },
          {
            "label": "Daha…",
            "icon": "chev",
            "type": "menu",
            "menuId": "more"
          }
        ]
      },
      {
        "id": "more",
        "title": "DAHA",
        "items": [
          {
            "label": "Tema Karışık",
            "icon": "🎨",
            "type": "action",
            "action": "theme-random"
          },
          {
            "label": "Çerçeve Değiştir",
            "icon": "🖼️",
            "type": "action",
            "action": "frame-next"
          },
          {
            "label": "Şok Dalgası",
            "icon": "⚡",
            "type": "action",
            "action": "shader",
            "params": {
              "name": "explosion",
              "duration": 3,
              "intensity": 1,
              "mode": "oneshot"
            }
          }
        ]
      }
    ],
    "dock": {
      "buttons": [
        {
          "label": "Steam",
          "icon": "steam",
          "action": {
            "type": "link",
            "params": {
              "url": "https://steamcommunity.com/id/yakan12"
            }
          }
        },
        {
          "label": "Discord",
          "icon": "discord",
          "action": {
            "type": "copy",
            "params": {
              "text": "yakan12",
              "label": "Discord"
            }
          }
        }
      ]
    },
    "zones": [],
    "triggers": [],
    "quotes": [
      "Being X… sen yalnızca kötü bir şakasın.",
      "Rütbe, sorumluluğun fiyat etiketidir.",
      "Planım yok diyen, yenilgiyi planlıyordur."
    ],
    "lanyard": {
      "enabled": false,
      "discordId": "",
      "showSpotify": true
    },
    "greeting": {
      "enabled": true,
      "template": "{selam} — İmparatorluk saati {saat}"
    },
    "cursor": {
      "image": ""
    },
    "stats": {
      "url": ""
    }
  }
};
