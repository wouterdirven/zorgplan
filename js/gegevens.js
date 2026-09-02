(function () {
  "use strict";

  var $ = Zorgplan.$;
  var storage = ZorgplanStorage;

  function toonExportWaarschuwing() {
    Zorgplan.toggleHidden($("#export-paneel"), false);
  }

  function downloadExport() {
    Zorgplan.downloadText(Zorgplan.exportBestandsnaam(), storage.exportJSON());
    Zorgplan.toggleHidden($("#export-paneel"), true);
  }

  function startImport() {
    $("#import-bestand").click();
  }

  function onBestandGekozen(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      $("#import-paneel").dataset.json = String(reader.result || "");
      Zorgplan.toggleHidden($("#import-paneel"), false);
      Zorgplan.setStatus($("#import-status"), "Bestand geladen: " + file.name + ". Kies hoe je het wilt toevoegen.");
    };
    reader.onerror = function () {
      Zorgplan.setStatus($("#import-status"), "Het bestand kon niet gelezen worden.");
      Zorgplan.toggleHidden($("#import-paneel"), false);
    };
    reader.readAsText(file);
  }

  function importeer(mode) {
    var json = $("#import-paneel").dataset.json || "";
    try {
      storage.importJSON(json, mode);
      Zorgplan.toggleHidden($("#import-paneel"), true);
      $("#import-paneel").dataset.json = "";
      Zorgplan.setStatus($("#gegevens-status"), "Import gelukt.");
    } catch (error) {
      Zorgplan.setStatus($("#import-status"), error.message || "Importeren is mislukt.");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Zorgplan.registerServiceWorker();

    $("#exporteer").addEventListener("click", toonExportWaarschuwing);
    $("#export-bevestig").addEventListener("click", downloadExport);
    $("#export-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#export-paneel"), true);
    });

    $("#importeer").addEventListener("click", startImport);
    $("#import-bestand").addEventListener("change", onBestandGekozen);
    $("#import-vervang").addEventListener("click", function () {
      importeer("replace");
    });
    $("#import-voeg-toe").addEventListener("click", function () {
      importeer("merge");
    });
    $("#import-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#import-paneel"), true);
      $("#import-paneel").dataset.json = "";
    });

    $("#wis-start").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#wis-stap1"), false);
      Zorgplan.toggleHidden($("#wis-stap2"), true);
    });
    $("#wis-nee").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#wis-stap1"), true);
    });
    $("#wis-verder").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#wis-stap1"), true);
      Zorgplan.toggleHidden($("#wis-stap2"), false);
    });
    $("#wis-annuleer").addEventListener("click", function () {
      Zorgplan.toggleHidden($("#wis-stap2"), true);
    });
    $("#wis-nu").addEventListener("click", function () {
      storage.clearAll();
      Zorgplan.toggleHidden($("#wis-stap2"), true);
      Zorgplan.setStatus($("#gegevens-status"), "Alle gegevens zijn gewist.");
    });
  });
})();
