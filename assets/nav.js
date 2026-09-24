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
            line.style.setProperty("--tab-h", `${current.offsetHeight}px`);
        };
        place();
        addEventListener("resize", place);
        document.fonts?.ready.then(place);
    }
}
