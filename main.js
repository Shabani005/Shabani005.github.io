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

document.addEventListener('DOMContentLoaded', () => {
    const scrollArrow = document.querySelector('.scroll-arrow');
    const projectsSection = document.getElementById('projects');
    let isScrolling = false;
    let lastScrollPosition = 0;

    // Function to scroll to projects
    function scrollToProjects() {
        projectsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Handle scroll arrow click
    scrollArrow.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToProjects();
    });

    // Single scroll event handler
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const projectsOffset = projectsSection.offsetTop;
        const windowHeight = window.innerHeight;
        
        // Calculate distances
        const distanceToProjects = projectsOffset - scrollPosition;
        const scrollPercentage = (scrollPosition / windowHeight) * 100;
        
        // Handle state changes
        if (scrollPosition < 100) {
            // At top - no arrow
            document.body.classList.remove('scrolled', 'at-projects');
            isScrolling = false;
        } else if (scrollPosition >= projectsOffset - 300) {
            // Near or at projects section - hide arrow
            document.body.classList.remove('scrolled');
            document.body.classList.add('at-projects');
        } else {
            // Between top and projects - show arrow
            document.body.classList.add('scrolled');
            document.body.classList.remove('at-projects');
            
            // Only trigger auto-scroll when scrolling down
            if (!isScrolling && scrollPosition > lastScrollPosition) {
                isScrolling = true;
                setTimeout(() => {
                    scrollToProjects();
                }, 500);
            }
        }
        
        lastScrollPosition = scrollPosition;
    });

    // Make scrollToSection available globally
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };
});

