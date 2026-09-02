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
      if (item.persoonIds.indexOf(persoonId) !== -1) {
        return true;
      }
      return storage.personenVoorZorgverlener(data, item.id).some(function (p) {
        return p.id === persoonId;
      });
    });
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
          '<button type="button" class="btn btn-ghost" data-actie="afspraak-verwijder" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '">Verwijder</button>' +
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
          '<button type="button" class="btn btn-ghost" data-actie="sessie-verwijder" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '">Verwijder</button>' +
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
          '<button type="button" class="btn btn-ghost" data-actie="actie-verwijder" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '">Verwijder</button>' +
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
          '<article class="lijst-kaart">' +
          "<p>" +
          Zorgplan.escapeHtml(item.tekst) +
          (bij ? "<br /><span class=\"muted\">Voor " + Zorgplan.escapeHtml(bij) + "</span>" : "") +
          "</p>" +
          '<button type="button" class="btn btn-ghost" data-actie="vraag-verwijder" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '">Verwijder</button>' +
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
  }

  function bewaarOverMij() {
    storage.updatePersoon(persoonId, {
      naam: $("#naam").value,
      geboortedatum: $("#geboortedatum").value,
      notitie: $("#notitie").value
    });
    data = storage.loadData();
    $("#plan-titel").textContent = Zorgplan.persoonNaam(storage.findById(data.personen, persoonId));
  }

  document.addEventListener("DOMContentLoaded", function () {
    Zorgplan.registerServiceWorker();
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
      storage.addAfspraak({
        persoonId: persoonId,
        zorgverlenerId: form.zorgverlenerId.value,
        datum: new Date(datum).toISOString(),
        locatie: form.locatie.value,
        gedaan: false
      });
      form.reset();
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-afspraak-form").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#afspraak-form"), false);
      $("#afspraak-form").datum.focus();
    });

    $("#sessie-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      storage.addSessie({
        persoonId: persoonId,
        zorgverlenerId: form.zorgverlenerId.value,
        datum: form.datum.value,
        tekst: form.tekst.value
      });
      form.reset();
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-sessie-form").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#sessie-form"), false);
      $("#sessie-form").datum.focus();
    });

    $("#actie-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      storage.addActie({
        persoonId: persoonId,
        tekst: form.tekst.value,
        gedaan: false
      });
      form.reset();
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-actie-form").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#actie-form"), false);
      $("#actie-form").tekst.focus();
    });

    $("#vraag-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      storage.addVraag({
        persoonId: persoonId,
        zorgverlenerId: form.zorgverlenerId.value,
        tekst: form.tekst.value
      });
      form.reset();
      Zorgplan.toggleHidden(form, true);
      render();
    });

    $("#toon-vraag-form").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#vraag-form"), false);
      $("#vraag-form").tekst.focus();
    });

    document.addEventListener("click", function (event) {
      var knop = event.target.closest("[data-actie]");
      if (!knop) {
        return;
      }
      var id = knop.getAttribute("data-id");
      var actie = knop.getAttribute("data-actie");
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
      }
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
