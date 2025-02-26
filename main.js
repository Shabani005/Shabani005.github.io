function scrollToSection(event, sectionId) {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    window.scrollTo({
        top: target.offsetTop - 50, // Adjust for fixed navbar
        behavior: 'smooth'
    });
}
