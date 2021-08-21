function injectInTheDOM(filePath: string) {
    const script = document.createElement('script');
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", filePath);
    document.body.appendChild(script);
}

injectInTheDOM(chrome.extension.getURL("download.js"));