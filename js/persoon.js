(function () {
  "use strict";

  var $ = Zorgplan.$;
  var storage = ZorgplanStorage;
  var persoonId = Zorgplan.queryParam("id");
  var data;

  function load() {
    data = storage.loadData();
    return storage.findById(data.personen, persoonId);
  }

  function hulpverlenersVoorPersoon() {
    return data.zorgverleners.filter(function (item) {
      return item.persoonIds.indexOf(persoonId) !== -1;
    });
  }

  function resetFormulier(form, bewaarTekst) {
    if (!form) {
      return;
    }
    form.reset();
    form.dataset.bewerkId = "";
    var knop = form.querySelector("[type=submit]");
    if (knop && bewaarTekst) {
      knop.textContent = bewaarTekst;
    }
  }

  function zetBewerkKnop(form, tekst) {
    var knop = form.querySelector("[type=submit]");
    if (knop) {
      knop.textContent = tekst;
    }
  }

  function kaartActies(bewerkActie, verwijderActie, id, extraKnop) {
    return (
      '<div class="actie-rij-inline">' +
      '<button type="button" class="btn btn-secondary" data-actie="' +
      bewerkActie +
      '" data-id="' +
      Zorgplan.escapeHtml(id) +
      '">Bewerken</button>' +
      (extraKnop || "") +
      '<button type="button" class="btn btn-ghost" data-actie="' +
      verwijderActie +
      '" data-id="' +
      Zorgplan.escapeHtml(id) +
      '">Verwijder</button>' +
      "</div>"
    );
  }

  function renderOverMij(persoon) {
    $("#naam").value = persoon.naam;
    $("#geboortedatum").value = persoon.geboortedatum;
    $("#notitie").value = persoon.notitie;
  }

  function renderHulpverleners() {
    var gekoppeld = hulpverlenersVoorPersoon();
    var lijst = $("#hulpverleners-lijst");
    if (gekoppeld.length === 0) {
      lijst.innerHTML = "<p class=\"leeg-regel\">Nog geen hulpverleners in dit plan.</p>";
    } else {
      lijst.innerHTML = gekoppeld
        .map(function (item) {
          return (
            "<article class=\"lijst-kaart\">" +
            "<h3>" +
            Zorgplan.escapeHtml(item.naam || "Naamloos") +
            "</h3>" +
            "<p>" +
            Zorgplan.escapeHtml(
              [item.organisatie, item.contact, item.waarvoor].filter(Boolean).join(" · ") || "Geen extra gegevens"
            ) +
            "</p>" +
            '<div class="actie-rij-inline">' +
            '<a class="btn btn-secondary" href="zorgverleners.html">Bewerken</a>' +
            '<button type="button" class="btn btn-ghost" data-actie="hulpverlener-los" data-id="' +
            Zorgplan.escapeHtml(item.id) +
            '">Haal uit dit plan</button>' +
            "</div>" +
            "</article>"
          );
        })
        .join("");
    }

    var gekoppeldeIds = {};
    gekoppeld.forEach(function (item) {
      gekoppeldeIds[item.id] = true;
    });
    var beschikbaar = data.zorgverleners.filter(function (item) {
      return !gekoppeldeIds[item.id];
    });
    var select = $("#bestaande-hulpverlener");
    if (beschikbaar.length === 0) {
      select.innerHTML = '<option value="">Geen andere hulpverleners in de lijst</option>';
      $("#koppel-hulpverlener").disabled = true;
    } else {
      select.innerHTML = Zorgplan.zorgverlenerOpties(
        { zorgverleners: beschikbaar },
        "",
        "Kies uit de gedeelde lijst"
      );
      $("#koppel-hulpverlener").disabled = false;
    }
    Zorgplan.$$("select[data-zorgverleners]").forEach(function (el) {
      var huidige = el.value;
      el.innerHTML = Zorgplan.zorgverlenerOpties(data, huidige, el.getAttribute("data-leeg") || "Geen (niet verplicht)");
    });
  }

  function renderAfspraken() {
    var items = data.afspraken
      .filter(function (item) {
        return item.persoonId === persoonId;
      })
      .sort(function (a, b) {
        return new Date(a.datum).getTime() - new Date(b.datum).getTime();
      });
    var lijst = $("#afspraken-lijst");
    if (items.length === 0) {
      lijst.innerHTML = "<p class=\"leeg-regel\">Nog geen afspraken.</p>";
      return;
    }
    lijst.innerHTML = items
      .map(function (item) {
        var bij = Zorgplan.zorgverlenerNaam(data, item.zorgverlenerId);
        return (
          '<article class="lijst-kaart' +
          (item.gedaan ? " is-gedaan" : "") +
          '">' +
          "<label class=\"vink-rij\">" +
          '<input type="checkbox" data-actie="afspraak-gedaan" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '"' +
          (item.gedaan ? " checked" : "") +
          " />" +
          "<span>" +
          "<strong>" +
          Zorgplan.escapeHtml(Zorgplan.formatDateTime(item.datum) || "Geen datum") +
          "</strong>" +
          "<br />" +
          Zorgplan.escapeHtml([bij ? "Bij " + bij : "", item.locatie].filter(Boolean).join(" · ") || "Geen extra gegevens") +
          "</span>" +
          "</label>" +
          kaartActies("afspraak-bewerk", "afspraak-verwijder", item.id) +
          "</article>"
        );
      })
      .join("");
  }

  function renderSessies() {
    var items = data.sessies
      .filter(function (item) {
        return item.persoonId === persoonId;
      })
      .sort(function (a, b) {
        return String(b.datum).localeCompare(String(a.datum));
      });
    var lijst = $("#sessies-lijst");
    if (items.length === 0) {
      lijst.innerHTML = "<p class=\"leeg-regel\">Nog niets besproken genoteerd.</p>";
      return;
    }
    lijst.innerHTML = items
      .map(function (item) {
        var bij = Zorgplan.zorgverlenerNaam(data, item.zorgverlenerId);
        return (
          '<article class="lijst-kaart">' +
          "<p><strong>" +
          Zorgplan.escapeHtml(Zorgplan.formatDate(item.datum) || "Geen datum") +
          "</strong>" +
          (bij ? " · " + Zorgplan.escapeHtml(bij) : "") +
          "</p>" +
          "<p>" +
          Zorgplan.escapeHtml(item.tekst) +
          "</p>" +
          kaartActies("sessie-bewerk", "sessie-verwijder", item.id) +
          "</article>"
        );
      })
      .join("");
  }

  function renderActies() {
    var items = data.acties.filter(function (item) {
      return item.persoonId === persoonId;
    });
    var lijst = $("#acties-lijst");
    if (items.length === 0) {
      lijst.innerHTML = "<p class=\"leeg-regel\">Nog geen acties.</p>";
      return;
    }
    lijst.innerHTML = items
      .map(function (item) {
        return (
          '<article class="lijst-kaart' +
          (item.gedaan ? " is-gedaan" : "") +
          '">' +
          "<label class=\"vink-rij\">" +
          '<input type="checkbox" data-actie="actie-gedaan" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '"' +
          (item.gedaan ? " checked" : "") +
          " />" +
          "<span>" +
          Zorgplan.escapeHtml(item.tekst) +
          "</span>" +
          "</label>" +
          kaartActies("actie-bewerk", "actie-verwijder", item.id) +
          "</article>"
        );
      })
      .join("");
  }

  function renderVragen() {
    var items = data.vragen.filter(function (item) {
      return item.persoonId === persoonId;
    });
    var lijst = $("#vragen-lijst");
    if (items.length === 0) {
      lijst.innerHTML = "<p class=\"leeg-regel\">Nog geen vragen.</p>";
      return;
    }
    lijst.innerHTML = items
      .map(function (item) {
        var bij = Zorgplan.zorgverlenerNaam(data, item.zorgverlenerId);
        return (
          '<article class="lijst-kaart' +
          (item.gedaan ? " is-gedaan" : "") +
          '">' +
          "<label class=\"vink-rij\">" +
          '<input type="checkbox" data-actie="vraag-gedaan" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '"' +
          (item.gedaan ? " checked" : "") +
          " />" +
          "<span>" +
          Zorgplan.escapeHtml(item.tekst) +
          (bij ? "<br /><span class=\"muted\">Voor " + Zorgplan.escapeHtml(bij) + "</span>" : "") +
          "</span>" +
          "</label>" +
          kaartActies("vraag-bewerk", "vraag-verwijder", item.id) +
          "</article>"
        );
      })
      .join("");
  }

  function render() {
    var persoon = load();
    if (!persoon) {
      window.location.replace("index.html");
      return;
    }
    document.title = Zorgplan.persoonNaam(persoon) + " — Zorgplan";
    $("#plan-titel").textContent = Zorgplan.persoonNaam(persoon);
    $("#print-knop").href = "print.html?id=" + encodeURIComponent(persoonId);
    renderOverMij(persoon);
    renderHulpverleners();
    renderAfspraken();
    renderSessies();
    renderActies();
    renderVragen();
    Zorgplan.toonSysteemBanner();
  }

  function bewaarOverMij() {
    storage.updatePersoon(persoonId, {
      naam: $("#naam").value,
      geboortedatum: $("#geboortedatum").value,
      notitie: $("#notitie").value
    });
    data = storage.loadData();
    var persoon = storage.findById(data.personen, persoonId);
    if (persoon) {
      $("#plan-titel").textContent = Zorgplan.persoonNaam(persoon);
    }
    Zorgplan.toonSysteemBanner();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!persoonId) {
      window.location.replace("index.html");
      return;
    }

    $("#over-mij-form").addEventListener("change", bewaarOverMij);
    $("#over-mij-form").addEventListener("blur", bewaarOverMij, true);

    $("#koppel-hulpverlener").addEventListener("click", function () {
      var id = $("#bestaande-hulpverlener").value;
      if (!id) {
        return;
      }
      storage.linkZorgverlenerToPersoon(id, persoonId);
      render();
    });

    $("#nieuwe-hulpverlener-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      storage.addZorgverlener({
        naam: form.naam.value,
        organisatie: form.organisatie.value,
        contact: form.contact.value,
        waarvoor: form.waarvoor.value,
        persoonIds: [persoonId]
      });
      form.reset();
      Zorgplan.toggleHidden($("#nieuwe-hulpverlener-form"), true);
      render();
    });

    $("#toon-hulpverlener-form").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#nieuwe-hulpverlener-form"), false);
      $("#nieuwe-hulpverlener-form").naam.focus();
    });

    $("#afspraak-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var datum = form.datum.value;
      if (!datum) {
        return;
      }
      var velden = {
        persoonId: persoonId,
        zorgverlenerId: form.zorgverlenerId.value,
        datum: new Date(datum).toISOString(),
        locatie: form.locatie.value
      };
      if (form.dataset.bewerkId) {
        var bestaand = storage.findById(storage.loadData().afspraken, form.dataset.bewerkId);
        velden.gedaan = !!(bestaand && bestaand.gedaan);
        storage.updateAfspraak(form.dataset.bewerkId, velden);
      } else {
        velden.gedaan = false;
        storage.addAfspraak(velden);
      }
      resetFormulier(form, "Bewaar afspraak");
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-afspraak-form").addEventListener("click", function () {
      var form = $("#afspraak-form");
      resetFormulier(form, "Bewaar afspraak");
      Zorgplan.toggleHidden(form, false);
      form.datum.focus();
    });

    $("#sessie-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var velden = {
        persoonId: persoonId,
        zorgverlenerId: form.zorgverlenerId.value,
        datum: form.datum.value,
        tekst: form.tekst.value
      };
      if (form.dataset.bewerkId) {
        storage.updateSessie(form.dataset.bewerkId, velden);
      } else {
        storage.addSessie(velden);
      }
      resetFormulier(form, "Bewaar notitie");
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-sessie-form").addEventListener("click", function () {
      var form = $("#sessie-form");
      resetFormulier(form, "Bewaar notitie");
      Zorgplan.toggleHidden(form, false);
      form.datum.focus();
    });

    $("#actie-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var velden = { persoonId: persoonId, tekst: form.tekst.value };
      if (form.dataset.bewerkId) {
        var bestaand = storage.findById(storage.loadData().acties, form.dataset.bewerkId);
        velden.gedaan = !!(bestaand && bestaand.gedaan);
        storage.updateActie(form.dataset.bewerkId, velden);
      } else {
        velden.gedaan = false;
        storage.addActie(velden);
      }
      resetFormulier(form, "Bewaar actie");
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-actie-form").addEventListener("click", function () {
      var form = $("#actie-form");
      resetFormulier(form, "Bewaar actie");
      Zorgplan.toggleHidden(form, false);
      form.tekst.focus();
    });

    $("#vraag-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var velden = {
        persoonId: persoonId,
        zorgverlenerId: form.zorgverlenerId.value,
        tekst: form.tekst.value
      };
      if (form.dataset.bewerkId) {
        var bestaand = storage.findById(storage.loadData().vragen, form.dataset.bewerkId);
        velden.gedaan = !!(bestaand && bestaand.gedaan);
        storage.updateVraag(form.dataset.bewerkId, velden);
      } else {
        velden.gedaan = false;
        storage.addVraag(velden);
      }
      resetFormulier(form, "Bewaar vraag");
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-vraag-form").addEventListener("click", function () {
      var form = $("#vraag-form");
      resetFormulier(form, "Bewaar vraag");
      Zorgplan.toggleHidden(form, false);
      form.tekst.focus();
    });

    Zorgplan.$$(".form-annuleer").forEach(function (knop) {
      knop.addEventListener("click", function () {
        var form = knop.closest("form");
        if (!form) {
          return;
        }
        var teksten = {
          "afspraak-form": "Bewaar afspraak",
          "sessie-form": "Bewaar notitie",
          "actie-form": "Bewaar actie",
          "vraag-form": "Bewaar vraag"
        };
        resetFormulier(form, teksten[form.id] || "Bewaar");
        Zorgplan.toggleHidden(form, true);
      });
    });

    document.addEventListener("click", function (event) {
      var knop = event.target.closest("[data-actie]");
      if (!knop) {
        return;
      }
      var id = knop.getAttribute("data-id");
      var actie = knop.getAttribute("data-actie");
      data = storage.loadData();

      if (actie === "afspraak-bewerk") {
        var afspraak = storage.findById(data.afspraken, id);
        if (!afspraak) {
          return;
        }
        var afspraakForm = $("#afspraak-form");
        afspraakForm.dataset.bewerkId = id;
        afspraakForm.datum.value = Zorgplan.toDateTimeLocal(afspraak.datum);
        afspraakForm.zorgverlenerId.value = afspraak.zorgverlenerId;
        afspraakForm.locatie.value = afspraak.locatie;
        zetBewerkKnop(afspraakForm, "Wijzigingen bewaren");
        Zorgplan.toggleHidden(afspraakForm, false);
        afspraakForm.datum.focus();
        return;
      }
      if (actie === "sessie-bewerk") {
        var sessie = storage.findById(data.sessies, id);
        if (!sessie) {
          return;
        }
        var sessieForm = $("#sessie-form");
        sessieForm.dataset.bewerkId = id;
        sessieForm.datum.value = sessie.datum;
        sessieForm.zorgverlenerId.value = sessie.zorgverlenerId;
        sessieForm.tekst.value = sessie.tekst;
        zetBewerkKnop(sessieForm, "Wijzigingen bewaren");
        Zorgplan.toggleHidden(sessieForm, false);
        sessieForm.tekst.focus();
        return;
      }
      if (actie === "actie-bewerk") {
        var actieItem = storage.findById(data.acties, id);
        if (!actieItem) {
          return;
        }
        var actieForm = $("#actie-form");
        actieForm.dataset.bewerkId = id;
        actieForm.tekst.value = actieItem.tekst;
        zetBewerkKnop(actieForm, "Wijzigingen bewaren");
        Zorgplan.toggleHidden(actieForm, false);
        actieForm.tekst.focus();
        return;
      }
      if (actie === "vraag-bewerk") {
        var vraag = storage.findById(data.vragen, id);
        if (!vraag) {
          return;
        }
        var vraagForm = $("#vraag-form");
        vraagForm.dataset.bewerkId = id;
        vraagForm.tekst.value = vraag.tekst;
        vraagForm.zorgverlenerId.value = vraag.zorgverlenerId;
        zetBewerkKnop(vraagForm, "Wijzigingen bewaren");
        Zorgplan.toggleHidden(vraagForm, false);
        vraagForm.tekst.focus();
        return;
      }
      if (actie === "hulpverlener-los") {
        var hulpverlener = storage.findById(data.zorgverleners, id);
        var aantal = data.afspraken.filter(function (item) {
          return item.persoonId === persoonId && item.zorgverlenerId === id;
        }).length;
        $("#los-paneel").dataset.id = id;
        $("#los-tekst").textContent = aantal
          ? (hulpverlener ? hulpverlener.naam : "Deze hulpverlener") +
            " verdwijnt uit dit plan, maar blijft staan bij " +
            aantal +
            (aantal === 1 ? " afspraak" : " afspraken") +
            "."
          : "Deze hulpverlener verdwijnt uit dit plan. De gedeelde lijst blijft behouden.";
        Zorgplan.toggleHidden($("#los-paneel"), false);
        return;
      }
      if (actie === "afspraak-verwijder") {
        storage.deleteAfspraak(id);
      } else if (actie === "sessie-verwijder") {
        storage.deleteSessie(id);
      } else if (actie === "actie-verwijder") {
        storage.deleteActie(id);
      } else if (actie === "vraag-verwijder") {
        storage.deleteVraag(id);
      } else {
        return;
      }
      render();
    });

    document.addEventListener("change", function (event) {
      var invoer = event.target;
      if (!(invoer instanceof HTMLInputElement) || invoer.type !== "checkbox") {
        return;
      }
      var actie = invoer.getAttribute("data-actie");
      var id = invoer.getAttribute("data-id");
      if (actie === "afspraak-gedaan") {
        storage.updateAfspraak(id, { gedaan: invoer.checked });
        render();
      } else if (actie === "actie-gedaan") {
        storage.updateActie(id, { gedaan: invoer.checked });
        render();
      } else if (actie === "vraag-gedaan") {
        storage.updateVraag(id, { gedaan: invoer.checked });
        render();
      }
    });

    $("#los-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#los-paneel"), true);
      $("#los-paneel").dataset.id = "";
    });
    $("#los-bevestig").addEventListener("click", function () {
      var id = $("#los-paneel").dataset.id;
      if (id) {
        storage.unlinkZorgverlenerFromPersoon(id, persoonId);
      }
      Zorgplan.toggleHidden($("#los-paneel"), true);
      render();
    });

    $("#toon-verwijder").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#verwijder-stap1"), false);
    });
    $("#verwijder-nee").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#verwijder-stap1"), true);
      Zorgplan.toggleHidden($("#verwijder-stap2"), true);
    });
    $("#verwijder-verder").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#verwijder-stap1"), true);
      Zorgplan.toggleHidden($("#verwijder-stap2"), false);
    });
    $("#verwijder-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#verwijder-stap2"), true);
    });
    $("#verwijder-nu").addEventListener("click", function () {
      storage.deletePersoon(persoonId);
      window.location.href = "index.html";
    });

    render();
  });
})();
