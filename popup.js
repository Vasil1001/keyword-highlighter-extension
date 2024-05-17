document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("addKeywordButton")
    .addEventListener("click", function () {
      const keyword = document.getElementById("keywordInput").value;
      if (!keyword) {
        return;
      }
      chrome.storage.sync.get({ keywords: [] }, function (result) {
        if (!result.keywords.includes(keyword)) {
          result.keywords.push(keyword);
          chrome.storage.sync.set({ keywords: result.keywords }, function () {
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (tabs) {
                if (tabs.length === 0) {
                  console.error("No active tabs found");
                  return;
                }
                chrome.tabs.sendMessage(
                  tabs[0].id,
                  { action: "highlight", keywords: [keyword] },
                  function (response) {
                    if (
                      !response ||
                      !response.counts ||
                      !response.counts[keyword]
                    ) {
                      console.error(
                        "Invalid response from content script",
                        response
                      );
                      return;
                    }
                    chrome.storage.local.get(["counts"], function (storage) {
                      const counts = storage.counts || {};
                      counts[keyword] = response.counts[keyword];
                      chrome.storage.local.set({ counts: counts });
                      const li = document.createElement("li");
                      li.textContent = `${keyword} (${counts[keyword]})`;
                      document.getElementById("keywordsList").appendChild(li);
                      const totalCountElement =
                        document.getElementById("highlightCount");
                      const totalCount =
                        parseInt(
                          totalCountElement.textContent.split(": ")[1]
                        ) || 0;
                      totalCountElement.textContent = `Total matches found: ${
                        totalCount + counts[keyword]
                      }`;
                    });
                  }
                );
              }
            );
          });
        }
      });
    });

  document
    .getElementById("clearKeywordsButton")
    .addEventListener("click", function () {
      chrome.storage.sync.set({ keywords: [] }, function () {
        document.getElementById("keywordsList").innerHTML = "";
        document.getElementById("highlightCount").textContent =
          "Total matches found: 0";
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            if (tabs.length === 0) {
              console.error("No active tabs found");
              return;
            }
            chrome.tabs.sendMessage(tabs[0].id, { action: "clear" });
          }
        );
      });
    });

  chrome.storage.sync.get({ keywords: [] }, function (result) {
    chrome.storage.local.get(["counts"], function (storage) {
      const counts = storage.counts || {};
      result.keywords.forEach((keyword) => {
        let keywordElement = `<li>${keyword}`;
        if (counts[keyword]) {
          keywordElement += ` (${counts[keyword]})`;
        } else {
          keywordElement += ` (0)`;
        }
        keywordElement += "</li>";
        document.getElementById("keywordsList").innerHTML += keywordElement;
      });

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) {
          console.error("No active tabs found");
          return;
        }
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "highlight", keywords: result.keywords },
          function (response) {
            if (!response || !response.counts) {
              console.error("Invalid response from content script", response);
              return;
            }
            const totalCount = Object.values(response.counts).reduce(
              (a, b) => a + b,
              0
            );
            document.getElementById(
              "highlightCount"
            ).textContent = `Total matches found: ${totalCount}`;
          }
        );
      });
    });
  });
});
