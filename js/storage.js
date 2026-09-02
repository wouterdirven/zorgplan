/**
 * Alle datatoegang voor Zorgplan.
 * De rest van de app spreekt localStorage nooit rechtstreeks aan.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "zorgplan";
  var CURRENT_VERSION = 1;

  function generateId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function emptyData() {
    return {
      versie: CURRENT_VERSION,
      personen: [],
      zorgverleners: [],
      afspraken: [],
      sessies: [],
      acties: [],
      vragen: []
    };
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function asString(value) {
    return value == null ? "" : String(value);
  }

  function asBoolean(value) {
    return value === true;
  }

  function normalizePersoon(item) {
    return {
      id: asString(item && item.id) || generateId(),
      naam: asString(item && item.naam),
      geboortedatum: asString(item && item.geboortedatum),
      notitie: asString(item && item.notitie)
    };
  }

  function normalizeZorgverlener(item) {
    return {
      id: asString(item && item.id) || generateId(),
      naam: asString(item && item.naam),
      organisatie: asString(item && item.organisatie),
      contact: asString(item && item.contact),
      waarvoor: asString(item && item.waarvoor),
      persoonIds: asArray(item && item.persoonIds).map(asString).filter(Boolean)
    };
  }

  function normalizeAfspraak(item) {
    return {
      id: asString(item && item.id) || generateId(),
      persoonId: asString(item && item.persoonId),
      zorgverlenerId: asString(item && item.zorgverlenerId),
      datum: asString(item && item.datum),
      locatie: asString(item && item.locatie),
      gedaan: asBoolean(item && item.gedaan)
    };
  }

  function normalizeSessie(item) {
    return {
      id: asString(item && item.id) || generateId(),
      persoonId: asString(item && item.persoonId),
      zorgverlenerId: asString(item && item.zorgverlenerId),
      datum: asString(item && item.datum),
      tekst: asString(item && item.tekst)
    };
  }

  function normalizeActie(item) {
    return {
      id: asString(item && item.id) || generateId(),
      persoonId: asString(item && item.persoonId),
      tekst: asString(item && item.tekst),
      gedaan: asBoolean(item && item.gedaan)
    };
  }

  function normalizeVraag(item) {
    return {
      id: asString(item && item.id) || generateId(),
      persoonId: asString(item && item.persoonId),
      zorgverlenerId: asString(item && item.zorgverlenerId),
      tekst: asString(item && item.tekst)
    };
  }

  function normalize(raw) {
    var data = emptyData();
    if (!raw || typeof raw !== "object") {
      return data;
    }
    data.versie = Number(raw.versie) || CURRENT_VERSION;
    data.personen = asArray(raw.personen).map(normalizePersoon);
    data.zorgverleners = asArray(raw.zorgverleners).map(normalizeZorgverlener);
    data.afspraken = asArray(raw.afspraken).map(normalizeAfspraak);
    data.sessies = asArray(raw.sessies).map(normalizeSessie);
    data.acties = asArray(raw.acties).map(normalizeActie);
    data.vragen = asArray(raw.vragen).map(normalizeVraag);
    return data;
  }

  function getBackend() {
    try {
      return global.localStorage;
    } catch (error) {
      return null;
    }
  }

  function loadData() {
    var backend = getBackend();
    if (!backend) {
      return emptyData();
    }
    try {
      var raw = backend.getItem(STORAGE_KEY);
      if (!raw) {
        return emptyData();
      }
      return normalize(JSON.parse(raw));
    } catch (error) {
      return emptyData();
    }
  }

  function saveData(data) {
    var backend = getBackend();
    var normalized = normalize(data);
    if (!backend) {
      return normalized;
    }
    backend.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function update(mutator) {
    var data = loadData();
    mutator(data);
    return saveData(data);
  }

  function findById(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id === id) {
        return list[i];
      }
    }
    return null;
  }

  function removeById(list, id) {
    return list.filter(function (item) {
      return item.id !== id;
    });
  }

  function exportJSON() {
    return JSON.stringify(loadData(), null, 2);
  }

  function remapIds(incoming) {
    var idMap = {
      personen: {},
      zorgverleners: {},
      afspraken: {},
      sessies: {},
      acties: {},
      vragen: {}
    };

    incoming.personen.forEach(function (item) {
      idMap.personen[item.id] = generateId();
    });
    incoming.zorgverleners.forEach(function (item) {
      idMap.zorgverleners[item.id] = generateId();
    });
    incoming.afspraken.forEach(function (item) {
      idMap.afspraken[item.id] = generateId();
    });
    incoming.sessies.forEach(function (item) {
      idMap.sessies[item.id] = generateId();
    });
    incoming.acties.forEach(function (item) {
      idMap.acties[item.id] = generateId();
    });
    incoming.vragen.forEach(function (item) {
      idMap.vragen[item.id] = generateId();
    });

    return {
      versie: CURRENT_VERSION,
      personen: incoming.personen.map(function (item) {
        return Object.assign({}, item, { id: idMap.personen[item.id] });
      }),
      zorgverleners: incoming.zorgverleners.map(function (item) {
        return Object.assign({}, item, {
          id: idMap.zorgverleners[item.id],
          persoonIds: (item.persoonIds || [])
            .map(function (pid) {
              return idMap.personen[pid];
            })
            .filter(Boolean)
        });
      }),
      afspraken: incoming.afspraken.map(function (item) {
        return Object.assign({}, item, {
          id: idMap.afspraken[item.id],
          persoonId: idMap.personen[item.persoonId] || "",
          zorgverlenerId: idMap.zorgverleners[item.zorgverlenerId] || ""
        });
      }),
      sessies: incoming.sessies.map(function (item) {
        return Object.assign({}, item, {
          id: idMap.sessies[item.id],
          persoonId: idMap.personen[item.persoonId] || "",
          zorgverlenerId: idMap.zorgverleners[item.zorgverlenerId] || ""
        });
      }),
      acties: incoming.acties.map(function (item) {
        return Object.assign({}, item, {
          id: idMap.acties[item.id],
          persoonId: idMap.personen[item.persoonId] || ""
        });
      }),
      vragen: incoming.vragen.map(function (item) {
        return Object.assign({}, item, {
          id: idMap.vragen[item.id],
          persoonId: idMap.personen[item.persoonId] || "",
          zorgverlenerId: idMap.zorgverleners[item.zorgverlenerId] || ""
        });
      })
    };
  }

  function importJSON(jsonString, mode) {
    var parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (error) {
      throw new Error("Dit bestand is geen geldige JSON.");
    }
    var incoming = normalize(parsed);
    if (mode === "replace") {
      return saveData(incoming);
    }
    if (mode !== "merge") {
      throw new Error("Onbekende importmodus.");
    }
    var remapped = remapIds(incoming);
    var current = loadData();
    current.personen = current.personen.concat(remapped.personen);
    current.zorgverleners = current.zorgverleners.concat(remapped.zorgverleners);
    current.afspraken = current.afspraken.concat(remapped.afspraken);
    current.sessies = current.sessies.concat(remapped.sessies);
    current.acties = current.acties.concat(remapped.acties);
    current.vragen = current.vragen.concat(remapped.vragen);
    return saveData(current);
  }

  function clearAll() {
    return saveData(emptyData());
  }

  function linkZorgverlener(data, zorgverlenerId, persoonId) {
    var zorgverlener = findById(data.zorgverleners, zorgverlenerId);
    if (!zorgverlener || !persoonId) {
      return;
    }
    if (zorgverlener.persoonIds.indexOf(persoonId) === -1) {
      zorgverlener.persoonIds.push(persoonId);
    }
  }

  function personenVoorZorgverlener(data, zorgverlenerId) {
    var ids = {};
    var zorgverlener = findById(data.zorgverleners, zorgverlenerId);
    if (zorgverlener) {
      zorgverlener.persoonIds.forEach(function (id) {
        ids[id] = true;
      });
    }
    data.afspraken.concat(data.sessies, data.vragen).forEach(function (item) {
      if (item.zorgverlenerId === zorgverlenerId && item.persoonId) {
        ids[item.persoonId] = true;
      }
    });
    return data.personen.filter(function (persoon) {
      return ids[persoon.id];
    });
  }

  function afsprakenVoorZorgverlener(data, zorgverlenerId) {
    return data.afspraken.filter(function (item) {
      return item.zorgverlenerId === zorgverlenerId;
    });
  }

  function volgendeAfspraak(data, persoonId) {
    var now = Date.now();
    return data.afspraken
      .filter(function (item) {
        if (item.gedaan) {
          return false;
        }
        if (persoonId && item.persoonId !== persoonId) {
          return false;
        }
        var tijd = new Date(item.datum).getTime();
        return !Number.isNaN(tijd) && tijd >= now;
      })
      .sort(function (a, b) {
        return new Date(a.datum).getTime() - new Date(b.datum).getTime();
      })[0] || null;
  }

  function openstaandeActies(data, persoonId) {
    return data.acties.filter(function (item) {
      return item.persoonId === persoonId && !item.gedaan;
    });
  }

  function openstaandeVragen(data, persoonId) {
    return data.vragen.filter(function (item) {
      return item.persoonId === persoonId;
    });
  }

  var api = {
    CURRENT_VERSION: CURRENT_VERSION,
    generateId: generateId,
    emptyData: emptyData,
    loadData: loadData,
    saveData: saveData,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clearAll: clearAll,
    findById: findById,
    personenVoorZorgverlener: personenVoorZorgverlener,
    afsprakenVoorZorgverlener: afsprakenVoorZorgverlener,
    volgendeAfspraak: volgendeAfspraak,
    openstaandeActies: openstaandeActies,
    openstaandeVragen: openstaandeVragen,

    addPersoon: function (velden) {
      var persoon = normalizePersoon(Object.assign({}, velden, { id: generateId() }));
      update(function (data) {
        data.personen.push(persoon);
      });
      return persoon;
    },

    updatePersoon: function (id, velden) {
      var updated = null;
      update(function (data) {
        var persoon = findById(data.personen, id);
        if (!persoon) {
          return;
        }
        Object.assign(persoon, normalizePersoon(Object.assign({}, persoon, velden, { id: persoon.id })));
        updated = persoon;
      });
      return updated;
    },

    deletePersoon: function (id) {
      update(function (data) {
        data.personen = removeById(data.personen, id);
        data.afspraken = data.afspraken.filter(function (item) {
          return item.persoonId !== id;
        });
        data.sessies = data.sessies.filter(function (item) {
          return item.persoonId !== id;
        });
        data.acties = data.acties.filter(function (item) {
          return item.persoonId !== id;
        });
        data.vragen = data.vragen.filter(function (item) {
          return item.persoonId !== id;
        });
        data.zorgverleners.forEach(function (item) {
          item.persoonIds = item.persoonIds.filter(function (pid) {
            return pid !== id;
          });
        });
      });
    },

    addZorgverlener: function (velden) {
      var zorgverlener = normalizeZorgverlener(Object.assign({}, velden, { id: generateId() }));
      update(function (data) {
        data.zorgverleners.push(zorgverlener);
      });
      return zorgverlener;
    },

    updateZorgverlener: function (id, velden) {
      var updated = null;
      update(function (data) {
        var zorgverlener = findById(data.zorgverleners, id);
        if (!zorgverlener) {
          return;
        }
        Object.assign(
          zorgverlener,
          normalizeZorgverlener(Object.assign({}, zorgverlener, velden, { id: zorgverlener.id }))
        );
        updated = zorgverlener;
      });
      return updated;
    },

    linkZorgverlenerToPersoon: function (zorgverlenerId, persoonId) {
      update(function (data) {
        linkZorgverlener(data, zorgverlenerId, persoonId);
      });
    },

    deleteZorgverlener: function (id) {
      update(function (data) {
        data.zorgverleners = removeById(data.zorgverleners, id);
        data.afspraken.forEach(function (item) {
          if (item.zorgverlenerId === id) {
            item.zorgverlenerId = "";
          }
        });
        data.sessies.forEach(function (item) {
          if (item.zorgverlenerId === id) {
            item.zorgverlenerId = "";
          }
        });
        data.vragen.forEach(function (item) {
          if (item.zorgverlenerId === id) {
            item.zorgverlenerId = "";
          }
        });
      });
    },

    addAfspraak: function (velden) {
      var afspraak = normalizeAfspraak(Object.assign({}, velden, { id: generateId() }));
      update(function (data) {
        data.afspraken.push(afspraak);
        linkZorgverlener(data, afspraak.zorgverlenerId, afspraak.persoonId);
      });
      return afspraak;
    },

    updateAfspraak: function (id, velden) {
      var updated = null;
      update(function (data) {
        var afspraak = findById(data.afspraken, id);
        if (!afspraak) {
          return;
        }
        Object.assign(afspraak, normalizeAfspraak(Object.assign({}, afspraak, velden, { id: afspraak.id })));
        linkZorgverlener(data, afspraak.zorgverlenerId, afspraak.persoonId);
        updated = afspraak;
      });
      return updated;
    },

    deleteAfspraak: function (id) {
      update(function (data) {
        data.afspraken = removeById(data.afspraken, id);
      });
    },

    addSessie: function (velden) {
      var sessie = normalizeSessie(Object.assign({}, velden, { id: generateId() }));
      update(function (data) {
        data.sessies.push(sessie);
        linkZorgverlener(data, sessie.zorgverlenerId, sessie.persoonId);
      });
      return sessie;
    },

    deleteSessie: function (id) {
      update(function (data) {
        data.sessies = removeById(data.sessies, id);
      });
    },

    addActie: function (velden) {
      var actie = normalizeActie(Object.assign({}, velden, { id: generateId() }));
      update(function (data) {
        data.acties.push(actie);
      });
      return actie;
    },

    updateActie: function (id, velden) {
      var updated = null;
      update(function (data) {
        var actie = findById(data.acties, id);
        if (!actie) {
          return;
        }
        Object.assign(actie, normalizeActie(Object.assign({}, actie, velden, { id: actie.id })));
        updated = actie;
      });
      return updated;
    },

    deleteActie: function (id) {
      update(function (data) {
        data.acties = removeById(data.acties, id);
      });
    },

    addVraag: function (velden) {
      var vraag = normalizeVraag(Object.assign({}, velden, { id: generateId() }));
      update(function (data) {
        data.vragen.push(vraag);
        linkZorgverlener(data, vraag.zorgverlenerId, vraag.persoonId);
      });
      return vraag;
    },

    deleteVraag: function (id) {
      update(function (data) {
        data.vragen = removeById(data.vragen, id);
      });
    }
  };

  global.ZorgplanStorage = api;
})(typeof window !== "undefined" ? window : globalThis);
