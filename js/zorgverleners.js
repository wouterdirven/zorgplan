(function () {
  "use strict";

  var $ = Zorgplan.$;
  var storage = ZorgplanStorage;
  var bewerkId = "";

  function render() {
    var data = storage.loadData();
    var lijst = $("#zorgverleners-lijst");
    if (data.zorgverleners.length === 0) {
      lijst.innerHTML = "<p class=\"leeg-regel\">Nog geen zorgverleners. Voeg de eerste toe.</p>";
      return;
    }
    lijst.innerHTML = data.zorgverleners
      .slice()
      .sort(function (a, b) {
        return a.naam.localeCompare(b.naam, "nl");
      })
      .map(function (item) {
        var personen = storage
          .personenVoorZorgverlener(data, item.id)
          .map(function (persoon) {
            return Zorgplan.persoonNaam(persoon);
          });
        var afspraken = storage.afsprakenVoorZorgverlener(data, item.id).length;
        return (
          '<article class="lijst-kaart" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '">' +
          "<h2>" +
          Zorgplan.escapeHtml(item.naam || "Naamloos") +
          "</h2>" +
          "<p>" +
          Zorgplan.escapeHtml(item.organisatie || "Geen organisatie") +
          "</p>" +
          "<p>" +
          Zorgplan.escapeHtml(item.contact || "Geen telefoon of e-mail") +
          "</p>" +
          "<p>" +
          Zorgplan.escapeHtml(item.waarvoor || "Waarvoor is nog niet ingevuld") +
          "</p>" +
          '<p class="muted">Bij: ' +
          Zorgplan.escapeHtml(personen.length ? personen.join(", ") : "nog niemand") +
          "</p>" +
          '<div class="actie-rij-inline">' +
          '<button type="button" class="btn btn-secondary" data-actie="bewerk" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '">Bewerken</button>' +
          '<button type="button" class="btn btn-ghost" data-actie="verwijder" data-id="' +
          Zorgplan.escapeHtml(item.id) +
          '" data-afspraken="' +
          afspraken +
          '">Verwijderen</button>' +
          "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function vulForm(zorgverlener) {
    var form = $("#zorgverlener-form");
    form.naam.value = zorgverlener ? zorgverlener.naam : "";
    form.organisatie.value = zorgverlener ? zorgverlener.organisatie : "";
    form.contact.value = zorgverlener ? zorgverlener.contact : "";
    form.waarvoor.value = zorgverlener ? zorgverlener.waarvoor : "";
    $("#form-titel").textContent = zorgverlener ? "Hulpverlener bewerken" : "Nieuwe hulpverlener";
  }

  function toonForm(zorgverlener) {
    bewerkId = zorgverlener ? zorgverlener.id : "";
    vulForm(zorgverlener);
    Zorgplan.toggleHidden($("#zorgverlener-form"), false);
    Zorgplan.toggleHidden($("#verwijder-paneel"), true);
    $("#zorgverlener-form").naam.focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    Zorgplan.registerServiceWorker();

    $("#toon-form").addEventListener("click", function () {
      toonForm(null);
    });

    $("#form-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#zorgverlener-form"), true);
      bewerkId = "";
    });

    $("#zorgverlener-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var form = event.target;
      var velden = {
        naam: form.naam.value.trim(),
        organisatie: form.organisatie.value.trim(),
        contact: form.contact.value.trim(),
        waarvoor: form.waarvoor.value.trim()
      };
      if (!velden.naam) {
        return;
      }
      if (bewerkId) {
        storage.updateZorgverlener(bewerkId, velden);
      } else {
        storage.addZorgverlener(velden);
      }
      bewerkId = "";
      form.reset();
      Zorgplan.toggleHidden(form, true);
      render();
    });

    document.addEventListener("click", function (event) {
      var knop = event.target.closest("[data-actie]");
      if (!knop) {
        return;
      }
      var id = knop.getAttribute("data-id");
      var data = storage.loadData();
      if (knop.getAttribute("data-actie") === "bewerk") {
        toonForm(storage.findById(data.zorgverleners, id));
        return;
      }
      if (knop.getAttribute("data-actie") === "verwijder") {
        var aantal = Number(knop.getAttribute("data-afspraken") || "0");
        $("#verwijder-paneel").dataset.id = id;
        $("#verwijder-tekst").textContent =
          aantal > 0
            ? "Deze hulpverlener hangt nog aan " +
              aantal +
              " afspraak" +
              (aantal === 1 ? "" : "ken") +
              ". Als je verwijdert, blijft de afspraak staan maar zonder naam."
            : "Wil je deze hulpverlener verwijderen?";
        Zorgplan.toggleHidden($("#verwijder-paneel"), false);
      }
    });

    $("#verwijder-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#verwijder-paneel"), true);
      $("#verwijder-paneel").dataset.id = "";
    });

    $("#verwijder-bevestig").addEventListener("click", function () {
      var id = $("#verwijder-paneel").dataset.id;
      if (id) {
        storage.deleteZorgverlener(id);
      }
      Zorgplan.toggleHidden($("#verwijder-paneel"), true);
      render();
    });

    render();
  });
})();
