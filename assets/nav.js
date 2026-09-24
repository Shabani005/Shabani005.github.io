// The marker behind the current tab (a lit block with a yellow line along its bottom), as its own element:
// in page switches only the marker glides to the new tab (view-transition-name: tab-line), instead of the
// tab's text sliding over the others.

// block scope: this file shares the global scope with the other page scripts
{
    const nav = document.querySelector(".header-top");
    const current = nav?.querySelector('[aria-current="page"]');
    if (current) {
        const line = document.createElement("span");
        line.className = "tab-line";
        nav.append(line);
        const place = () => {
            line.style.left = `${current.offsetLeft}px`;
            line.style.width = `${current.offsetWidth}px`;
            line.style.setProperty("--tab-h", `${current.offsetHeight}px`); // height of the block behind the tab
        };
        place();
        addEventListener("resize", place);
        document.fonts?.ready.then(place); // the tab widths change once the font has loaded
    }
}
