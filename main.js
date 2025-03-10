window.onload = () => {
    document.getElementById("gifModal").style.display = "none"
  }
  
  // Scroll handling with smoother behavior
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY
    const windowHeight = window.innerHeight
    const homeSection = document.querySelector("#home")
    const projectsSection = document.getElementById("projects")
    const titleHeading = document.querySelector("#home h1")
    const titleText = document.querySelector("#home p")
    const skillsContainer = document.querySelector(".skills-container")
  
    // Calculate scroll percentage relative to viewport height
    const scrollPercentage = (scrollPosition / windowHeight) * 100
  
    // Handle animations based on scroll percentage
    if (scrollPercentage > 15) {
      document.body.classList.add("scrolled")
      requestAnimationFrame(() => {
        projectsSection.classList.add("visible")
      })
    } else {
      document.body.classList.remove("scrolled")
      projectsSection.classList.remove("visible")
    }
  })
  
  // Add click handler for scroll arrow
  document.querySelector(".scroll-arrow")?.addEventListener("click", () => {
    scrollToProjects()
  })
  
  function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" })
  }
  
  function expandGif(img) {
    const modal = document.getElementById("gifModal")
    const expandedImg = document.getElementById("expandedGif")
    modal.style.display = "flex"
    expandedImg.src = img.src
  }
  
  function closeGif() {
    document.getElementById("gifModal").style.display = "none"
  }
  
  // Function to scroll to projects - defined globally for reuse
  function scrollToProjects() {
    document.getElementById("projects").scrollIntoView({ behavior: "smooth" })
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize variables
    let currentSection = "home"
    let isTransitioning = false
    let touchStartY = 0
    let touchEndY = 0
  
    // DOM elements
    const sections = document.querySelectorAll(".section")
    const navLinks = document.querySelectorAll(".nav-links a")
    const nextButtons = document.querySelectorAll(".next-section-btn")
    const scrollDots = document.querySelectorAll(".scroll-dot")
    const gifModal = document.getElementById("gifModal")
  
    // Initialize GIF modal
    gifModal.style.display = "none"
  
    // Function to change section
    const changeSection = (targetSection) => {
      if (isTransitioning || currentSection === targetSection) return
      isTransitioning = true
  
      // Update navigation
      navLinks.forEach((link) => {
        link.classList.remove("active")
        if (link.dataset.section === targetSection) {
          link.classList.add("active")
        }
      })
  
      // Update scroll dots
      scrollDots.forEach((dot) => {
        dot.classList.remove("active")
        if (dot.dataset.section === targetSection) {
          dot.classList.add("active")
        }
      })
  
      // Get current and target section elements
      const currentSectionEl = document.getElementById(currentSection)
      const targetSectionEl = document.getElementById(targetSection)
  
      // Add transition classes
      currentSectionEl.classList.add("transitioning-out")
      currentSectionEl.classList.remove("active")
  
      // After a short delay, show the target section
      setTimeout(() => {
        targetSectionEl.classList.add("active", "transitioning-in")
  
        // After transition completes, clean up classes
        setTimeout(() => {
          currentSectionEl.classList.remove("transitioning-out")
          targetSectionEl.classList.remove("transitioning-in")
          currentSection = targetSection
          isTransitioning = false
        }, 800) // Match this to the CSS transition duration
      }, 400)
    }
  
    // Event listeners for navigation links
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        const targetSection = link.dataset.section
        changeSection(targetSection)
      })
    })
  
    // Event listeners for next section buttons
    nextButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetSection = button.dataset.target
        changeSection(targetSection)
      })
    })
  
    // Event listeners for scroll dots
    scrollDots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const targetSection = dot.dataset.section
        changeSection(targetSection)
      })
    })
  
    // Mouse wheel event for section changing
    window.addEventListener("wheel", (e) => {
      if (isTransitioning) return
  
      const direction = e.deltaY > 0 ? "down" : "up"
      const sections = ["home", "projects", "contact"]
      const currentIndex = sections.indexOf(currentSection)
  
      if (direction === "down" && currentIndex < sections.length - 1) {
        changeSection(sections[currentIndex + 1])
      } else if (direction === "up" && currentIndex > 0) {
        changeSection(sections[currentIndex - 1])
      }
    })
  
    // Touch events for mobile
    document.addEventListener("touchstart", (e) => {
      touchStartY = e.touches[0].clientY
    })
  
    document.addEventListener("touchend", (e) => {
      touchEndY = e.changedTouches[0].clientY
      handleSwipe()
    })
  
    const handleSwipe = () => {
      if (isTransitioning) return
  
      const swipeDistance = touchStartY - touchEndY
      if (Math.abs(swipeDistance) < 50) return // Minimum swipe distance
  
      const direction = swipeDistance > 0 ? "down" : "up"
      const sections = ["home", "projects", "contact"]
      const currentIndex = sections.indexOf(currentSection)
  
      if (direction === "down" && currentIndex < sections.length - 1) {
        changeSection(sections[currentIndex + 1])
      } else if (direction === "up" && currentIndex > 0) {
        changeSection(sections[currentIndex - 1])
      }
    }
  
    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (isTransitioning) return
  
      const sections = ["home", "projects", "contact"]
      const currentIndex = sections.indexOf(currentSection)
  
      if ((e.key === "ArrowDown" || e.key === "PageDown") && currentIndex < sections.length - 1) {
        changeSection(sections[currentIndex + 1])
      } else if ((e.key === "ArrowUp" || e.key === "PageUp") && currentIndex > 0) {
        changeSection(sections[currentIndex - 1])
      }
    })
  
    // GIF modal functions
    window.expandGif = (img) => {
      const expandedImg = document.getElementById("expandedGif")
      gifModal.style.display = "flex"
      expandedImg.src = img.src
    }
  
    window.closeGif = () => {
      gifModal.style.display = "none"
    }
  })
  
  