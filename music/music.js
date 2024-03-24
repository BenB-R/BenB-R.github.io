document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.more-btn').forEach(button => {
        button.addEventListener('click', () => {
            const additionalTracks = button.previousElementSibling;
            const isHidden = additionalTracks.style.display === 'none' || additionalTracks.style.display === '';

            if (isHidden) {
                additionalTracks.style.display = 'block';
                button.textContent = 'Less';
            } else {
                additionalTracks.style.display = 'none';
                button.textContent = 'More';
            }
        });
    });
});
