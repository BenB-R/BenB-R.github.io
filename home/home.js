document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Add active class to navigation links based on scroll position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.main-navigation a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - sectionHeight / 3) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // Background slide animation
    const backgroundSlides = document.querySelectorAll('.background-slide');
    const projectImages = [
        '../art/images/Bear Brewery/outside.PNG',
        '../art/images/Bear Brewery/factory.gif',
        '../art/images/Bear Brewery/factory.gif'
    ];
    let currentSlide = 0;

    function changeBackground() {
        console.log('Changing background...');
        backgroundSlides[currentSlide].style.opacity = 0;
        currentSlide = (currentSlide + 1) % backgroundSlides.length;
        const img = new Image();
        img.onload = function() {
            console.log(`Image loaded successfully: ${projectImages[currentSlide]}`);
            backgroundSlides[currentSlide].innerHTML = `<img src="${projectImages[currentSlide]}" alt="Project Image" style="width: 100%; height: 100%; object-fit: cover;">`;
            backgroundSlides[currentSlide].style.opacity = 1;
        };
        img.onerror = function() {
            console.error(`Failed to load image: ${projectImages[currentSlide]}`);
        };
        img.src = projectImages[currentSlide];
    }

    // Initialize background slides
    backgroundSlides.forEach((slide, index) => {
        console.log(`Initializing slide ${index}...`);
        const img = new Image();
        img.onload = function() {
            console.log(`Initial image loaded successfully: ${projectImages[index]}`);
            slide.innerHTML = `<img src="${projectImages[index]}" alt="Project Image" style="width: 100%; height: 100%; object-fit: cover;">`;
            if (index === 0) {
                slide.style.opacity = 1;
            }
        };
        img.onerror = function() {
            console.error(`Failed to load initial image: ${projectImages[index]}`);
        };
        img.src = projectImages[index];
    });

    // Change background every 5 seconds
    setInterval(changeBackground, 5000);

    // Simple animation for project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.transition = 'transform 0.3s ease';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
});