window.onload = function() {
    document.getElementById("gifModal").style.display = "none";
};


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



function expandGif(img) {
    const modal = document.getElementById("gifModal");
    const expandedGif = document.getElementById("expandedGif");

    expandedGif.src = img.src; // Set the modal image source
    modal.style.display = "flex"; // Show modal
}

function closeGif() {
    document.getElementById("gifModal").style.display = "none"; // Hide modal
}

