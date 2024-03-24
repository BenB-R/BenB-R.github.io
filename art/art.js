document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.more-btn').forEach(button => {
        button.addEventListener('click', () => {
            const additionalArt = button.previousElementSibling;
            const isHidden = additionalArt.style.display === 'none' || additionalArt.style.display === '';

            if (isHidden) {
                additionalArt.style.display = 'block';
                button.textContent = 'Less';
            } else {
                additionalArt.style.display = 'none';
                button.textContent = 'More';
            }
        });
    });
});
