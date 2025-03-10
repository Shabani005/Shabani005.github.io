window.onload = function() {
    document.getElementById("gifModal").style.display = "none";
};

// Scroll handling
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const homeSection = document.querySelector('#home');
    const projectsSection = document.getElementById('projects');
    const titleText = document.querySelector('#home p');
    const skillsContainer = document.querySelector('.skills-container');
    
    // Calculate scroll percentage relative to viewport height
    const scrollPercentage = (scrollPosition / windowHeight) * 100;

    // Handle animations based on scroll percentage
    if (scrollPercentage > 10) {
        document.body.classList.add('scrolled');
        requestAnimationFrame(() => {
            projectsSection.classList.add('visible');
        });
    } else {
        document.body.classList.remove('scrolled');
        projectsSection.classList.remove('visible');
    }
});

// Add click handler for scroll arrow
document.querySelector('.scroll-arrow')?.addEventListener('click', () => {
    document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
});

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

function expandGif(img) {
    const modal = document.getElementById('gifModal');
    const expandedImg = document.getElementById('expandedGif');
    modal.style.display = 'flex';
    expandedImg.src = img.src;
}

function closeGif() {
    document.getElementById('gifModal').style.display = 'none';
}

