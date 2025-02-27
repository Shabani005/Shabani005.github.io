function scrollToSection(event, sectionId) {
    event.preventDefault();
    const target = document.getElementById(sectionId);

    if (target) {
        // Use element.scrollTo for better compatibility
        window.scrollTo({
            top: target.offsetTop - 50, // Adjust for fixed navbar
            behavior: 'smooth'
        });
    } else {
        console.error(`Section with id ${sectionId} not found`);
    }
}
