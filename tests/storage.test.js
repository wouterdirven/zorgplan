#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var assert = require("assert");

function memoryStorage() {
  var map = {};
  return {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
    },
    setItem: function (key, value) {
      map[key] = String(value);
    },
    removeItem: function (key) {
      delete map[key];
    }
  };
}

function loadStorage(localStorage) {
  var context = {
    localStorage: localStorage,
    crypto: { randomUUID: function () { return "id-" + Math.random().toString(16).slice(2); } }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "storage.js"), "utf8"), context);
  return context.ZorgplanStorage;
}

var failed = 0;
function test(naam, fn) {
  try {
    fn();
    console.log("ok  " + naam);
  } catch (error) {
    failed += 1;
    console.error("fail  " + naam);
    console.error("  " + error.message);
  }
}

test("bewaart en laadt een persoon", function () {
  var storage = loadStorage(memoryStorage());
  var persoon = storage.addPersoon({ naam: "Anna" });
  var data = storage.loadData();
  assert.strictEqual(data.personen.length, 1);
  assert.strictEqual(data.personen[0].naam, "Anna");
  assert.strictEqual(data.personen[0].id, persoon.id);
  assert.strictEqual(storage.getOpslagStatus().ok, true);
});

test("openstaande vragen negeren afgevinkte vragen", function () {
  var storage = loadStorage(memoryStorage());
  var persoon = storage.addPersoon({ naam: "Sam" });
  var open = storage.addVraag({ persoonId: persoon.id, tekst: "Mag ik een kopie?" });
  storage.addVraag({ persoonId: persoon.id, tekst: "Oude vraag", gedaan: true });
  var data = storage.loadData();
  assert.strictEqual(storage.openstaandeVragen(data, persoon.id).length, 1);
  storage.updateVraag(open.id, { gedaan: true });
  data = storage.loadData();
  assert.strictEqual(storage.openstaandeVragen(data, persoon.id).length, 0);
});

test("hulpverlener loskoppelen houdt de gedeelde lijst", function () {
  var storage = loadStorage(memoryStorage());
  var persoon = storage.addPersoon({ naam: "Kim" });
  var hulp = storage.addZorgverlener({ naam: "Dokter", persoonIds: [persoon.id] });
  storage.unlinkZorgverlenerFromPersoon(hulp.id, persoon.id);
  var data = storage.loadData();
  assert.strictEqual(data.zorgverleners.length, 1);
  assert.strictEqual(data.zorgverleners[0].persoonIds.length, 0);
});

test("sessie en afspraak kunnen bewerkt worden", function () {
  var storage = loadStorage(memoryStorage());
  var persoon = storage.addPersoon({ naam: "Lee" });
  var afspraak = storage.addAfspraak({
    persoonId: persoon.id,
    datum: "2030-01-01T10:00:00.000Z",
    locatie: "Thuis"
  });
  storage.updateAfspraak(afspraak.id, { locatie: "Wijkcentrum" });
  var sessie = storage.addSessie({ persoonId: persoon.id, datum: "2030-01-01", tekst: "Eerste keer" });
  storage.updateSessie(sessie.id, { tekst: "Tweede versie" });
  var data = storage.loadData();
  assert.strictEqual(data.afspraken[0].locatie, "Wijkcentrum");
  assert.strictEqual(data.sessies[0].tekst, "Tweede versie");
});

test("export en import met vervangen", function () {
  var storage = loadStorage(memoryStorage());
  storage.addPersoon({ naam: "Origineel" });
  var json = storage.exportJSON();
  storage.clearAll();
  assert.strictEqual(storage.loadData().personen.length, 0);
  storage.importJSON(json, "replace");
  assert.strictEqual(storage.loadData().personen[0].naam, "Origineel");
});

test("schrijven naar volle opslag faalt zichtbaar", function () {
  var backend = memoryStorage();
  backend.setItem = function () {
    var error = new Error("quota");
    error.name = "QuotaExceededError";
    error.code = 22;
    throw error;
  };
  var storage = loadStorage(backend);
  storage.addPersoon({ naam: "Test" });
  var status = storage.getOpslagStatus();
  assert.strictEqual(status.ok, false);
  assert.strictEqual(status.reden, "vol");
});

test("beschadigde JSON wordt niet overschreven", function () {
  var backend = memoryStorage();
  backend.setItem("zorgplan", "{niet-geldig");
  var storage = loadStorage(backend);
  storage.loadData();
  assert.strictEqual(storage.getOpslagStatus().corrupt, true);
  storage.addPersoon({ naam: "Mag niet" });
  assert.strictEqual(backend.getItem("zorgplan"), "{niet-geldig");
});

if (failed) {
  process.exit(1);
}
console.log("Alle tests geslaagd.");
