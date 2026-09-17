#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var assert = require("assert");

function loadZorgplan() {
  var context = {
    document: {
      readyState: "loading",
      addEventListener: function () {},
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; }
    },
    navigator: {
      userAgent: "",
      platform: "",
      standalone: false,
      maxTouchPoints: 0
    },
    Intl: Intl,
    Date: Date,
    Number: Number,
    String: String,
    URLSearchParams: URLSearchParams
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", "common.js"), "utf8"), context);
  return context.Zorgplan;
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

var Zorgplan = loadZorgplan();

test("leest dag/maand/jaar, niet maand/dag", function () {
  assert.strictEqual(Zorgplan.isoDateFromInput("17/09/2026"), "2026-09-17");
  assert.strictEqual(Zorgplan.isoDateFromInput("1/2/2026"), "2026-02-01");
  assert.strictEqual(Zorgplan.parseEuropeanDate("31/02/2026"), null);
});

test("leest 24-uursuur en weigert 24:00", function () {
  function zelfdeTijd(invoer, uren, minuten) {
    var tijd = Zorgplan.parseEuropeanTime(invoer);
    assert.ok(tijd, "verwacht geldig uur voor " + invoer);
    assert.strictEqual(tijd.hours, uren);
    assert.strictEqual(tijd.minutes, minuten);
  }
  zelfdeTijd("14:30", 14, 30);
  zelfdeTijd("9:05", 9, 5);
  zelfdeTijd("00:00", 0, 0);
  zelfdeTijd("23:59", 23, 59);
  zelfdeTijd("14u30", 14, 30);
  assert.strictEqual(Zorgplan.parseEuropeanTime("24:00"), null);
  assert.strictEqual(Zorgplan.parseEuropeanTime("13:60"), null);
});

test("zet Europese datum en 24u om naar ISO", function () {
  var parsed = Zorgplan.europeanDateTimeToIso("17/09/2026", "14:30");
  assert.strictEqual(parsed.dateOk, true);
  assert.strictEqual(parsed.timeOk, true);
  var date = new Date(parsed.iso);
  assert.strictEqual(date.getFullYear(), 2026);
  assert.strictEqual(date.getMonth(), 8);
  assert.strictEqual(date.getDate(), 17);
  assert.strictEqual(date.getHours(), 14);
  assert.strictEqual(date.getMinutes(), 30);
});

test("toont datum als dd/mm/jjjj en uur zonder am/pm", function () {
  var lokaleMiddag = new Date(2026, 8, 17, 14, 30);
  assert.strictEqual(Zorgplan.formatEuropeanDate(lokaleMiddag.toISOString()), "17/09/2026");
  assert.strictEqual(Zorgplan.formatEuropeanTime(lokaleMiddag.toISOString()), "14:30");
  var tekst = Zorgplan.formatDateTime(lokaleMiddag.toISOString());
  assert.strictEqual(/am|pm/i.test(tekst), false);
  assert.strictEqual(tekst.indexOf("14:30") !== -1 || tekst.indexOf("14.30") !== -1, true);
});

if (failed) {
  process.exit(1);
}
console.log("Alle datumtests geslaagd.");
