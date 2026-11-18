
        document.addEventListener('DOMContentLoaded', function() {
            
            // 1. Initialize Flipbook with responsive boundaries and locked parent dimensions
            const bookContainer = document.getElementById('book');
            const pageFlip = new St.PageFlip(bookContainer, {
                width: 452,
                height: 636,

                size: "stretch",

                minWidth: 280,
                maxWidth: 900,

                minHeight: 400,
                maxHeight: 1200,

                maxShadowOpacity: 0.15, // Immersion shadows

                showCover: false, // Soft covers setup
                mobileScrollSupport: false,
                usePortrait: true,
                autoSize: false // Disables runtime DOM resizing of parent node to prevent shifting
            });

            pageFlip.loadFromHTML(document.querySelectorAll('.page'));

            // 2. Real Page Flip Audio
            let pageSound = null;

            function initAudio() {
                if (pageSound) return;

                pageSound = new Audio("Magazine/page-flip-4.mp3");
                pageSound.preload = "auto";
                pageSound.load();

                pageSound.volume = 0.5;

                // Unlock audio on first interaction
                pageSound.play()
                    .then(() => {
                        pageSound.pause();
                        pageSound.currentTime = 0;
                    })
                    .catch(() => {});
            }

            document.addEventListener("click", initAudio, { once: true });
            document.addEventListener("touchstart", initAudio, { once: true });

            function playTurnSound() {
                if (!pageSound) return;

                // Create a fresh instance for instant playback
                const s = pageSound.cloneNode();
                s.volume = 0.5;
                s.play().catch(()=>{});
            }

            // 3. UI Interactions & Event Listeners
            const btnPrev = document.getElementById('btn-prev');
            const btnNext = document.getElementById('btn-next');
            const pageCurrentDisplay = document.getElementById('page-current');
            
            // Calculate total excluding cover and back cover if they are blanks
            const pagesList = document.querySelectorAll('.page');
            const totalPages = pagesList.length;
            document.getElementById('page-total').textContent = totalPages - 2;

            btnPrev.addEventListener('click', () => { if(currentScale === 1) pageFlip.flipPrev(); });
            btnNext.addEventListener('click', () => { if(currentScale === 1) pageFlip.flipNext(); });

            pageFlip.on('flip', (e) => {
                const targetPageIndex = e.data;
                const orientation = pageFlip.getOrientation();
                
                // Portrait redirection handling to skip empty dummy pages on mobile
                if (orientation === 'portrait') {
                    if (targetPageIndex === 0) {
                        pageFlip.turnToPage(1);
                        return;
                    }
                    if (targetPageIndex === totalPages - 1) {
                        pageFlip.turnToPage(totalPages - 2);
                        return;
                    }
                    pageCurrentDisplay.textContent = targetPageIndex;
                } else {
                    // Landscape display
                    if (targetPageIndex === 0 || targetPageIndex === 1) {
                        pageCurrentDisplay.textContent = "1";
                    } else if (targetPageIndex === totalPages - 1 || targetPageIndex === totalPages - 2) {
                        pageCurrentDisplay.textContent = totalPages - 2;
                    } else {
                        const leftPage = Math.floor(targetPageIndex / 2) * 2;
                        const rightPage = leftPage + 1;
                        pageCurrentDisplay.textContent = `${leftPage}-${rightPage}`;
                    }
                }
                
                playTurnSound();
            });

            document.addEventListener('keydown', (e) => {
                if (currentScale > 1) return; 
                if (e.key === 'ArrowLeft') pageFlip.flipPrev();
                else if (e.key === 'ArrowRight') pageFlip.flipNext();
            });

            // ==========================================
            // 4. ZOOM & PAN IMPLEMENTATION (HARDWARE ACCELERATED)
            // ==========================================
            
            const transformWrapper = document.getElementById('transform-wrapper');
            const panOverlay = document.getElementById('pan-overlay');
            const instructionText = document.getElementById('instruction-text');
            
            const btnZoomIn = document.getElementById('btn-zoom-in');
            const btnZoomOut = document.getElementById('btn-zoom-out');
            const btnZoomReset = document.getElementById('btn-zoom-reset');

            let currentScale = 1;
            const maxScale = 5;
            const minScale = 1;
            const scaleStep = 0.5;

            let isDragging = false;
            let startX = 0, startY = 0;
            let panX = 0, panY = 0;

            function updateZoom() {
                if (currentScale <= 1) {
                    currentScale = 1;
                    panX = 0;
                    panY = 0;
                }

                // translate3d engages the GPU for much smoother performance on mobile and desktop
                transformWrapper.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${currentScale})`;

                if (currentScale > 1) {
                    if (panOverlay) {
                        panOverlay.classList.remove('hidden');
                    }
                    if (btnZoomReset) btnZoomReset.classList.remove('hidden');
                    
                    if (btnPrev) btnPrev.classList.add('opacity-30', 'cursor-not-allowed', 'pointer-events-none');
                    if (btnNext) btnNext.classList.add('opacity-30', 'cursor-not-allowed', 'pointer-events-none');
                    
                    if (instructionText) {
                        instructionText.textContent = "Zoom Mode Active • Drag to Pan";
                        instructionText.classList.replace('text-white/50', 'text-amber-400');
                    }
                } else {
                    if (panOverlay) panOverlay.style.cursor = 'grab';
                    if (panOverlay) panOverlay.classList.add('hidden');
                    if (btnZoomReset) btnZoomReset.classList.add('hidden');
                    
                    if (btnPrev) btnPrev.classList.remove('opacity-30', 'cursor-not-allowed', 'pointer-events-none');
                    if (btnNext) btnNext.classList.remove('opacity-30', 'cursor-not-allowed', 'pointer-events-none');
                    
                    if (instructionText) {
                        instructionText.textContent = "Drag corners to flip or use arrows";
                        instructionText.classList.replace('text-amber-400', 'text-white/50');
                    }
                }
            }

            if (btnZoomIn) {
                btnZoomIn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentScale < maxScale) { currentScale += scaleStep; updateZoom(); }
                });
            }

            if (btnZoomOut) {
                btnZoomOut.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (currentScale > minScale) { currentScale -= scaleStep; updateZoom(); }
                });
            }

            if (btnZoomReset) {
                btnZoomReset.addEventListener('click', (e) => {
                    e.stopPropagation();
                    currentScale = 1; updateZoom();
                });
            }

            // Panning Logic with hardware acceleration
            function startPan(clientX, clientY) {
                if (currentScale <= 1) return; 
                isDragging = true;
                startX = clientX - panX;
                startY = clientY - panY;
                if (panOverlay) panOverlay.style.cursor = 'grabbing';
                transformWrapper.classList.add('is-dragging'); 
            }

            function doPan(clientX, clientY, e) {
                if (!isDragging) return;
                if (e) e.preventDefault(); 
                
                let targetX = clientX - startX;
                let targetY = clientY - startY;

                // Better boundary calculation based on current viewport to prevent dragging the book off screen
                const boundaryX = (window.innerWidth * currentScale) / 2.5;
                const boundaryY = (window.innerHeight * currentScale) / 2.5;

                panX = Math.max(-boundaryX, Math.min(boundaryX, targetX));
                panY = Math.max(-boundaryY, Math.min(boundaryY, targetY));

                transformWrapper.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${currentScale})`;
            }

            function endPan() {
                if (isDragging) {
                    isDragging = false;
                    if (panOverlay) panOverlay.style.cursor = 'grab';
                    transformWrapper.classList.remove('is-dragging'); 
                }
            }

            // Mouse Events
            if (panOverlay) panOverlay.addEventListener('mousedown', (e) => startPan(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => doPan(e.clientX, e.clientY, e));
            window.addEventListener('mouseup', endPan);

            // Touch Events
            if (panOverlay) {
                panOverlay.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) startPan(e.touches[0].clientX, e.touches[0].clientY);
                }, { passive: false });
            }
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1 && isDragging) doPan(e.touches[0].clientX, e.touches[0].clientY, e);
            }, { passive: false });
            window.addEventListener('touchend', endPan);
        });
    