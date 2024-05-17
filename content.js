const keywordColors = {};

function highlightKeywords(keywords) {
  clearHighlights();

  const counts = {};
  const colors = [
    "rgba(255, 255, 0, 0.35)", // existing yellow
    "rgba(0, 255, 255, 0.35)", // existing cyan
    "rgba(255, 0, 255, 0.35)", // existing magenta
    "rgba(0, 255, 0, 0.35)", // existing green
    "rgba(255, 165, 0, 0.35)", // existing orange
    "rgba(64, 224, 208, 0.35)", // new turquoise
    "rgba(255, 192, 203, 0.35)", // new pink
    "rgba(173, 216, 230, 0.35)", // new light blue
    "rgba(240, 128, 128, 0.35)", // new light coral
    "rgba(144, 238, 144, 0.35)", // new light green
  ]; // Add more colors if needed

  function highlightTextNode(node) {
    let highlightedText = node.textContent;
    keywords.forEach((keyword) => {
      if (!keywordColors[keyword]) {
        keywordColors[keyword] =
          colors[Object.keys(keywordColors).length % colors.length];
      }
      const color = keywordColors[keyword];
      // const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const regex = new RegExp(`${keyword}`, "gi");
      const replacement = `<span class='highlight' style='background-color:${color}'>$&</span>`;
      const newHighlightedText = highlightedText.replace(regex, replacement);
      const matchCount = (highlightedText.match(regex) || []).length;
      if (matchCount > 0 && newHighlightedText !== highlightedText) {
        counts[keyword] = (counts[keyword] || 0) + matchCount;
        highlightedText = newHighlightedText;
      }
    });
    if (node.textContent !== highlightedText) {
      const div = document.createElement("div");
      div.innerHTML = highlightedText;
      Array.from(div.childNodes).forEach((newNode) => {
        node.parentNode.insertBefore(newNode.cloneNode(true), node);
      });
      node.parentNode.removeChild(node);
    }
  }

  function walk(node, func) {
    let queue = [node];
    while (queue.length > 0) {
      const currentNode = queue.shift();
      func(currentNode);
      if (currentNode.firstChild) queue.push(currentNode.firstChild);
      if (currentNode.nextSibling) queue.push(currentNode.nextSibling);
    }
  }
  walk(document.body, function (node) {
    if (node.nodeType === 3) {
      highlightTextNode(node);
    }
  });

  return counts;
}

function clearHighlights() {
  document.querySelectorAll(".highlight").forEach((highlight) => {
    const textNode = document.createTextNode(highlight.textContent);
    highlight.parentNode.replaceChild(textNode, highlight);
  });
}
// // Function to highlight keywords on page load
// function highlightOnPageLoad() {
//   chrome.storage.sync.get({ keywords: [] }, function (result) {
//     // if (result.keywords.length > 0) {
//     //   highlightKeywords(result.keywords);
//     // }

//     // Listen for URL changes
//     // window.addEventListener("hashchange", function () {
//     //   highlightKeywords(result.keywords);
//     // });
//     // window.addEventListener("popstate", function () {
//     //   highlightKeywords(result.keywords);
//     // });
//   });
// }

window.addEventListener("load", clearHighlights());
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "highlight" && request.keywords) {
    const counts = highlightKeywords(request.keywords);
    sendResponse({ counts });
  } else if (request.action === "clear") {
    clearHighlights();
    sendResponse({});
  }
});

// const regex = new RegExp(`${keyword}`, "gi"); // Remove word boundaries, for word THE it shows THERE, THEN too
